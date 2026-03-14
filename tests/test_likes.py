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


def test_like_unlike_idempotent(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping likes tests')

    author = f"user_{uuid.uuid4().hex[:10]}"
    liker = f"user_{uuid.uuid4().hex[:10]}"
    author_token = _register_and_login(client, author)
    liker_token = _register_and_login(client, liker)

    created = client.post('/tweets', json={'text': 'like me'}, headers={'Authorization': f'Bearer {author_token}'})
    tweet_id = created.json()['tweet_id']

    like_1 = client.post(f'/tweets/{tweet_id}/like', headers={'Authorization': f'Bearer {liker_token}'})
    like_2 = client.post(f'/tweets/{tweet_id}/like', headers={'Authorization': f'Bearer {liker_token}'})
    unlike_1 = client.delete(f'/tweets/{tweet_id}/like', headers={'Authorization': f'Bearer {liker_token}'})
    unlike_2 = client.delete(f'/tweets/{tweet_id}/like', headers={'Authorization': f'Bearer {liker_token}'})

    assert like_1.status_code in (200, 204)
    assert like_2.status_code in (200, 204)
    assert unlike_1.status_code in (200, 204)
    assert unlike_2.status_code in (200, 204)

    _delete_user(author)
    _delete_user(liker)


def test_like_blocked_returns_403(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping blocked-like test')

    author = f"user_{uuid.uuid4().hex[:10]}"
    liker = f"user_{uuid.uuid4().hex[:10]}"
    author_token = _register_and_login(client, author)
    liker_token = _register_and_login(client, liker)

    created = client.post('/tweets', json={'text': 'block me'}, headers={'Authorization': f'Bearer {author_token}'})
    tweet_id = created.json()['tweet_id']
    block = client.post(f'/users/{liker}/block', headers={'Authorization': f'Bearer {author_token}'})
    assert block.status_code in (200, 201)

    like = client.post(f'/tweets/{tweet_id}/like', headers={'Authorization': f'Bearer {liker_token}'})
    assert like.status_code == 403

    _delete_user(author)
    _delete_user(liker)
