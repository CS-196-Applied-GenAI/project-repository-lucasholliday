import os

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


def test_db_connection_smoke(monkeypatch: pytest.MonkeyPatch) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping DB smoke test')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT 1')
            row = cursor.fetchone()
            assert row[0] == 1
    finally:
        conn.close()


def test_health_db_endpoint(monkeypatch: pytest.MonkeyPatch, client) -> None:
    if not _load_db_env_from_test(monkeypatch):
        pytest.skip('DB env not configured; skipping /health/db test')

    response = client.get('/health/db')

    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'db': 'ok'}
