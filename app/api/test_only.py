"""Test-only API routes."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix='/_test', tags=['test'])


@router.get('/unauthorized')
def unauthorized() -> None:
    raise HTTPException(status_code=401, detail='Not authenticated')
