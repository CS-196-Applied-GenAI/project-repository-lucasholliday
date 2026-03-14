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


def test_retweet_success_and_idempotent(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping retweets tests')

    author = f"user_{uuid.uuid4().hex[:10]}"
    retweeter = f"user_{uuid.uuid4().hex[:10]}"
    author_token = _register_and_login(client, author)
    retweeter_token = _register_and_login(client, retweeter)

    original = client.post('/tweets', json={'text': 'orig'}, headers={'Authorization': f'Bearer {author_token}'})
    original_id = original.json()['tweet_id']

    first = client.post(f'/tweets/{original_id}/retweet', headers={'Authorization': f'Bearer {retweeter_token}'})
    second = client.post(f'/tweets/{original_id}/retweet', headers={'Authorization': f'Bearer {retweeter_token}'})

    assert first.status_code in (200, 201)
    assert second.status_code in (200, 201)
    assert first.json()['tweet_id'] == second.json()['tweet_id']

    unretweet_1 = client.delete(f'/tweets/{original_id}/retweet', headers={'Authorization': f'Bearer {retweeter_token}'})
    unretweet_2 = client.delete(f'/tweets/{original_id}/retweet', headers={'Authorization': f'Bearer {retweeter_token}'})

    assert unretweet_1.status_code in (200, 204)
    assert unretweet_2.status_code in (200, 204)

    _delete_user(author)
    _delete_user(retweeter)


def test_retweet_blocked_returns_403(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping blocked retweet test')

    author = f"user_{uuid.uuid4().hex[:10]}"
    retweeter = f"user_{uuid.uuid4().hex[:10]}"
    author_token = _register_and_login(client, author)
    retweeter_token = _register_and_login(client, retweeter)

    original = client.post('/tweets', json={'text': 'orig'}, headers={'Authorization': f'Bearer {author_token}'})
    original_id = original.json()['tweet_id']

    block = client.post(f'/users/{retweeter}/block', headers={'Authorization': f'Bearer {author_token}'})
    assert block.status_code in (200, 201)

    retweet = client.post(f'/tweets/{original_id}/retweet', headers={'Authorization': f'Bearer {retweeter_token}'})
    assert retweet.status_code == 403

    _delete_user(author)
    _delete_user(retweeter)
