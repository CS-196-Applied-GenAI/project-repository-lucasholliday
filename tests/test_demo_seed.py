from fastapi.testclient import TestClient

from app.core.settings import get_settings
from app.main import create_app


def _client_with_env(monkeypatch, *, app_env: str, seed_secret: str | None):
    monkeypatch.setenv('APP_ENV', app_env)
    if seed_secret is None:
        monkeypatch.delenv('DEMO_SEED_SECRET', raising=False)
    else:
        monkeypatch.setenv('DEMO_SEED_SECRET', seed_secret)
    get_settings.cache_clear()
    return TestClient(create_app())


def test_demo_seed_route_hidden_in_production(monkeypatch):
    client = _client_with_env(monkeypatch, app_env='production', seed_secret='secret-123')

    response = client.post('/dev/demo/seed', headers={'X-Demo-Seed-Secret': 'secret-123'})

    assert response.status_code == 404


def test_demo_seed_requires_configured_secret(monkeypatch):
    client = _client_with_env(monkeypatch, app_env='dev', seed_secret=None)

    response = client.post('/dev/demo/seed')

    assert response.status_code == 503
    assert response.json()['detail'] == 'Demo seed secret not configured'


def test_demo_seed_rejects_wrong_secret(monkeypatch):
    client = _client_with_env(monkeypatch, app_env='dev', seed_secret='secret-123')

    response = client.post('/dev/demo/seed', headers={'X-Demo-Seed-Secret': 'wrong'})

    assert response.status_code == 403
    assert response.json()['detail'] == 'Forbidden'
