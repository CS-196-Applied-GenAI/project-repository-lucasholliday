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


def _register_and_login(client, username: str, password: str = 'Abcdefg1') -> str:
    r = client.post('/auth/register', json={'username': username, 'password': password})
    assert r.status_code == 201
    l = client.post('/auth/login', json={'username': username, 'password': password})
    assert l.status_code == 200
    return l.json()['access_token']


def test_update_bio_works(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping profile tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username)

    response = client.patch(
        '/users/me',
        json={'bio': 'hello world'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    assert response.json()['bio'] == 'hello world'

    _delete_user(username)


def test_update_username_unique_works(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping profile tests')

    old_username = f"user_{uuid.uuid4().hex[:10]}"
    new_username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, old_username)

    response = client.patch(
        '/users/me',
        json={'username': new_username},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    assert response.json()['username'] == new_username

    _delete_user(new_username)


def test_update_username_conflict_returns_409(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping profile tests')

    first = f"user_{uuid.uuid4().hex[:10]}"
    second = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, first)
    _register_and_login(client, second)

    response = client.patch(
        '/users/me',
        json={'username': second},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 409

    _delete_user(first)
    _delete_user(second)


def test_update_requires_login(client) -> None:
    response = client.patch('/users/me', json={'bio': 'no auth'})
    assert response.status_code == 401
