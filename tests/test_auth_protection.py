import os
import uuid

import pytest

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


def _register_and_login(client, username: str, password: str) -> str:
    register = client.post('/auth/register', json={'username': username, 'password': password})
    assert register.status_code == 201
    login = client.post('/auth/login', json={'username': username, 'password': password})
    assert login.status_code == 200
    return login.json()['access_token']


def test_auth_me_requires_header(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping /auth/me protection tests')

    response = client.get('/auth/me')
    assert response.status_code == 401


def test_auth_me_with_valid_token_returns_user(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping /auth/me valid token test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username, 'Abcdefg1')

    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    assert response.json()['username'] == username

    _delete_user(username)


def test_auth_me_rejects_blacklisted_token(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping blacklist test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username, 'Abcdefg1')

    logout = client.post('/auth/logout', headers={'Authorization': f'Bearer {token}'})
    assert logout.status_code == 200

    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 401

    _delete_user(username)
