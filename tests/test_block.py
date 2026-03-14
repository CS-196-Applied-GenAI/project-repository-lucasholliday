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


def test_block_prevents_follow_both_directions(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping block tests')

    a = f"user_{uuid.uuid4().hex[:10]}"
    b = f"user_{uuid.uuid4().hex[:10]}"
    a_token = _register_and_login(client, a)
    b_token = _register_and_login(client, b)

    block = client.post(f'/users/{b}/block', headers={'Authorization': f'Bearer {a_token}'})
    assert block.status_code in (200, 201)

    a_follows_b = client.post(f'/users/{b}/follow', headers={'Authorization': f'Bearer {a_token}'})
    b_follows_a = client.post(f'/users/{a}/follow', headers={'Authorization': f'Bearer {b_token}'})

    assert a_follows_b.status_code == 403
    assert b_follows_a.status_code == 403

    _delete_user(a)
    _delete_user(b)


def test_unblock_restores_follow_behavior(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping block tests')

    a = f"user_{uuid.uuid4().hex[:10]}"
    b = f"user_{uuid.uuid4().hex[:10]}"
    a_token = _register_and_login(client, a)
    _register_and_login(client, b)

    client.post(f'/users/{b}/block', headers={'Authorization': f'Bearer {a_token}'})
    unblock = client.delete(f'/users/{b}/block', headers={'Authorization': f'Bearer {a_token}'})
    assert unblock.status_code in (200, 204)

    follow = client.post(f'/users/{b}/follow', headers={'Authorization': f'Bearer {a_token}'})
    assert follow.status_code in (200, 201)

    _delete_user(a)
    _delete_user(b)
