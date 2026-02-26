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


def test_register_success_returns_201(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping register success test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    payload = {'username': username, 'password': 'Abcdefg1'}

    response = client.post('/auth/register', json=payload)

    assert response.status_code == 201
    assert response.json()['username'] == username

    _delete_user(username)


def test_register_duplicate_username_returns_409(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping duplicate username test')

    username = f"user_{uuid.uuid4().hex[:10]}"
    payload = {'username': username, 'password': 'Abcdefg1'}

    first = client.post('/auth/register', json=payload)
    second = client.post('/auth/register', json=payload)

    assert first.status_code == 201
    assert second.status_code == 409

    _delete_user(username)


def test_register_invalid_username_password_returns_400(client) -> None:
    bad_username = client.post('/auth/register', json={'username': 'ab', 'password': 'Abcdefg1'})
    bad_password = client.post('/auth/register', json={'username': 'valid_name', 'password': 'abcdefg1'})

    assert bad_username.status_code == 400
    assert bad_password.status_code == 400
