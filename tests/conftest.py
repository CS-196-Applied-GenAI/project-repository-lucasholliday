import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv

from app.core.settings import get_settings
from app.main import create_app

load_dotenv()


@pytest.fixture()
def app(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv('APP_ENV', 'test')
    get_settings.cache_clear()
    return create_app()


@pytest.fixture()
def client(app) -> TestClient:
    return TestClient(app)
