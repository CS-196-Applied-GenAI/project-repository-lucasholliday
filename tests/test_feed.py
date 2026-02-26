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


def test_feed_follows_and_retweets_order_pagination_and_blocks(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping feed tests')

    me = f"user_{uuid.uuid4().hex[:10]}"
    a = f"user_{uuid.uuid4().hex[:10]}"
    b = f"user_{uuid.uuid4().hex[:10]}"

    me_token = _register_and_login(client, me)
    a_token = _register_and_login(client, a)
    b_token = _register_and_login(client, b)

    follow = client.post(f'/users/{a}/follow', headers={'Authorization': f'Bearer {me_token}'})
    assert follow.status_code in (200, 201)

    t1 = client.post('/tweets', json={'text': 'first from a'}, headers={'Authorization': f'Bearer {a_token}'})
    t2 = client.post('/tweets', json={'text': 'second from a'}, headers={'Authorization': f'Bearer {a_token}'})
    orig_b = client.post('/tweets', json={'text': 'from b'}, headers={'Authorization': f'Bearer {b_token}'})
    retweet = client.post(
        f"/tweets/{orig_b.json()['tweet_id']}/retweet",
        headers={'Authorization': f'Bearer {a_token}'},
    )

    assert t1.status_code == 201
    assert t2.status_code == 201
    assert retweet.status_code in (200, 201)

    feed_all = client.get('/feed', headers={'Authorization': f'Bearer {me_token}'})
    assert feed_all.status_code == 200
    items = feed_all.json()['items']
    ids = [item['tweet_id'] for item in items]

    assert t1.json()['tweet_id'] in ids
    assert t2.json()['tweet_id'] in ids
    assert retweet.json()['tweet_id'] in ids

    assert ids == sorted(ids, reverse=True)

    paged = client.get('/feed?limit=1&offset=1', headers={'Authorization': f'Bearer {me_token}'})
    assert paged.status_code == 200
    assert len(paged.json()['items']) <= 1

    block = client.post(f'/users/{a}/block', headers={'Authorization': f'Bearer {me_token}'})
    assert block.status_code in (200, 201)
    blocked_feed = client.get('/feed', headers={'Authorization': f'Bearer {me_token}'})
    assert blocked_feed.status_code == 200
    blocked_ids = [item['tweet_id'] for item in blocked_feed.json()['items']]

    assert t1.json()['tweet_id'] not in blocked_ids
    assert t2.json()['tweet_id'] not in blocked_ids
    assert retweet.json()['tweet_id'] not in blocked_ids

    _delete_user(me)
    _delete_user(a)
    _delete_user(b)
