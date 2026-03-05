"""Application settings loaded from environment variables."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the API."""

    app_env: str = "dev"

    db_host: str = ""
    db_port: int = 3306
    db_user: str = ""
    db_password: str = ""
    db_name: str = ""

    # Optional test database settings (used by pytest)
    test_db_host: str | None = None
    test_db_port: int | None = None
    test_db_user: str | None = None
    test_db_password: str | None = None
    test_db_name: str | None = None

    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 30
    demo_seed_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
