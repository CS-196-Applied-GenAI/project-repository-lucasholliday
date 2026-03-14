"""Health check endpoints."""

from fastapi import APIRouter, HTTPException

from app.db import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health() -> dict[str, str]:
    """Application liveness endpoint."""
    return {"status": "ok"}


@router.get("/db")
def health_db() -> dict[str, str]:
    """Database connectivity check."""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
    except Exception as exc:  # pragma: no cover - error branch covered in integration setups
        raise HTTPException(status_code=500, detail="Database unavailable") from exc
    return {"status": "ok", "db": "ok"}
