import os
import uuid

import pytest

from app.core.security import decode_access_token
from app.core.settings import get_settings
from app.db import get_db_connection


def _load_db_env_from_test(monkeypatch: pytest.MonkeyPatch) -> bool:
    required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    test_values = {key: os.getenv(f'TEST_{key}') for key in required}

    if not all(test_values.values()):
        return False

    for key, value in test_values.items():
        monkeypatch.setenv(key, value or '')
    get_settings.cache_clear()
    return True


def _delete_user(username: str) -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM users WHERE username = %s', (username,))
    finally:
        conn.close()


def _register(client, username: str, password: str) -> None:
    response = client.post('/auth/register', json={'username': username, 'password': password})
    assert response.status_code == 201


def test_register_then_login_returns_token(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping login token test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    password = 'Abcdefg1'
    _register(client, username, password)

    response = client.post('/auth/login', json={'username': username, 'password': password})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get('access_token'), str)
    assert payload.get('token_type') == 'bearer'

    decoded = decode_access_token(payload['access_token'])
    assert decoded['sub'] == username

    _delete_user(username)


def test_login_invalid_password_returns_401(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping invalid password login test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    password = 'Abcdefg1'
    _register(client, username, password)

    response = client.post('/auth/login', json={'username': username, 'password': 'Wrongpass1'})

    assert response.status_code == 401
    _delete_user(username)


def test_login_invalid_username_returns_401(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping invalid username login test')

    response = client.post('/auth/login', json={'username': 'no_such_user', 'password': 'Abcdefg1'})

    assert response.status_code == 401
