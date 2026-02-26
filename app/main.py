"""Application entrypoint for the Chirper API."""

from app.api.auth import router as auth_router
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from mysql.connector import IntegrityError, errorcode

from app.api.feed import router as feed_router
from app.api.health import router as health_router
from app.api.test_only import router as test_router
from app.api.tweets import router as tweets_router
from app.api.users import router as users_router
from app.core.settings import get_settings


def create_app() -> FastAPI:
    """Build and configure the FastAPI app."""
    settings = get_settings()
    app = FastAPI(title="Chirper API")
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(tweets_router)
    app.include_router(feed_router)
    if settings.app_env == "test":
        app.include_router(test_router)

    @app.exception_handler(IntegrityError)
    def handle_integrity_error(_, exc: IntegrityError) -> JSONResponse:
        if exc.errno == errorcode.ER_DUP_ENTRY:
            return JSONResponse(status_code=409, content={"detail": "Duplicate resource"})
        return JSONResponse(status_code=500, content={"detail": "Database integrity error"})

    return app


app = create_app()
