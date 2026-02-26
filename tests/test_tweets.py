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


def test_create_tweet_success(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping tweets tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username)

    response = client.post(
        '/tweets',
        json={'text': 'hello tweet'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 201
    assert 'tweet_id' in response.json()

    _delete_user(username)


def test_create_tweet_too_long_returns_400(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping tweets tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username)

    response = client.post(
        '/tweets',
        json={'text': 'x' * 241},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400
    _delete_user(username)


def test_delete_own_tweet(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping tweets tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username)
    create = client.post('/tweets', json={'text': 'mine'}, headers={'Authorization': f'Bearer {token}'})
    tweet_id = create.json()['tweet_id']

    delete = client.delete(f'/tweets/{tweet_id}', headers={'Authorization': f'Bearer {token}'})
    assert delete.status_code in (200, 204)

    _delete_user(username)


def test_delete_others_tweet_returns_403(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping tweets tests')

    author = f"user_{uuid.uuid4().hex[:10]}"
    other = f"user_{uuid.uuid4().hex[:10]}"
    author_token = _register_and_login(client, author)
    other_token = _register_and_login(client, other)

    create = client.post('/tweets', json={'text': 'author tweet'}, headers={'Authorization': f'Bearer {author_token}'})
    tweet_id = create.json()['tweet_id']

    delete = client.delete(f'/tweets/{tweet_id}', headers={'Authorization': f'Bearer {other_token}'})
    assert delete.status_code == 403

    _delete_user(author)
    _delete_user(other)


def test_delete_non_existent_returns_404(client, monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping tweets tests')

    username = f"user_{uuid.uuid4().hex[:10]}"
    token = _register_and_login(client, username)

    delete = client.delete('/tweets/999999999', headers={'Authorization': f'Bearer {token}'})
    assert delete.status_code == 404

    _delete_user(username)
