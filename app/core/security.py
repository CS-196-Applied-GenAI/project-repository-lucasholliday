"""Security helpers for auth flow."""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.settings import get_settings
from app.db import get_db
from app.schemas.users import CurrentUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    """Hash a plaintext password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plaintext against hashed password."""
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    """Create signed JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.jwt_expires_minutes)
    payload: dict[str, Any] = {"sub": subject, "iat": int(now.timestamp()), "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    if "sub" not in payload:
        raise ValueError("Token subject missing")
    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    """Resolve and validate authenticated user from a bearer token."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Not authenticated") from exc

    username = str(payload["sub"])
    with get_db() as conn:
        with conn.cursor() as cursor:
            if is_token_blacklisted(cursor, token):
                raise HTTPException(status_code=401, detail="Not authenticated")

            user_id_column = resolve_user_id_column(cursor)
            cursor.execute(
                f"SELECT {user_id_column}, username FROM users WHERE username = %s LIMIT 1",
                (username,),
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=401, detail="Not authenticated")

    user_id, db_username = row
    return CurrentUser(user_id=int(user_id), username=str(db_username))


def resolve_user_id_column(cursor) -> str:
    """Pick the users table id column from known variants."""
    cursor.execute("SHOW COLUMNS FROM users")
    columns = {row[0] for row in cursor.fetchall()}
    if "user_id" in columns:
        return "user_id"
    if "id" in columns:
        return "id"
    raise HTTPException(status_code=500, detail="Unsupported users schema: id column missing")


def resolve_blacklist_token_column(cursor) -> str:
    """Pick blacklisted token column name from known variants."""
    cursor.execute("SHOW COLUMNS FROM blacklisted_tokens")
    columns = {row[0] for row in cursor.fetchall()}
    if "token" in columns:
        return "token"
    if "access_token" in columns:
        return "access_token"
    raise HTTPException(status_code=500, detail="Unsupported blacklist schema: token column missing")


def is_token_blacklisted(cursor, token: str) -> bool:
    """Check whether token is already blacklisted."""
    token_column = resolve_blacklist_token_column(cursor)
    cursor.execute(
        f"SELECT 1 FROM blacklisted_tokens WHERE {token_column} = %s LIMIT 1",
        (token,),
    )
    return cursor.fetchone() is not None


def blacklist_token(cursor, token: str) -> None:
    """Insert token into blacklist in an idempotent way."""
    token_column = resolve_blacklist_token_column(cursor)
    cursor.execute(
        f"INSERT IGNORE INTO blacklisted_tokens ({token_column}) VALUES (%s)",
        (token,),
    )
