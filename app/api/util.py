"""Shared API utility helpers."""

from fastapi import HTTPException


def value_error_to_http_400(exc: ValueError) -> HTTPException:
    """Convert validation errors into HTTP 400 responses."""
    return HTTPException(status_code=400, detail=str(exc))
