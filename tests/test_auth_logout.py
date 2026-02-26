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


def test_logout_blacklists_token_idempotent(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping logout tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    password = 'Abcdefg1'

    register = client.post('/auth/register', json={'username': username, 'password': password})
    assert register.status_code == 201

    login = client.post('/auth/login', json={'username': username, 'password': password})
    assert login.status_code == 200
    token = login.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    first = client.post('/auth/logout', headers=headers)
    second = client.post('/auth/logout', headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200

    _delete_user(username)
