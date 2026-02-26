"""Authentication endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from mysql.connector import Error as MySQLError
from mysql.connector import IntegrityError, errorcode
from pydantic import BaseModel

from app.api.util import value_error_to_http_400
from app.core.security import (
    bearer_scheme,
    blacklist_token,
    create_access_token,
    decode_access_token,
    get_current_user,
    hash_password,
    resolve_user_id_column,
    verify_password,
)
from app.core.validators import validate_password, validate_username
from app.db import get_db
from app.schemas.users import CurrentUser

router = APIRouter(prefix='/auth', tags=['auth'])


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post('/register', status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict[str, Any]:
    try:
        validate_username(payload.username)
        validate_password(payload.password)
    except ValueError as exc:
        raise value_error_to_http_400(exc) from exc

    with get_db() as conn:
        with conn.cursor() as cursor:
            password_column = _resolve_password_column(cursor)
            user_columns = _resolve_user_columns(cursor)
            insert_columns = ['username', password_column]
            insert_values: list[str] = [payload.username, hash_password(payload.password)]
            if 'email' in user_columns:
                insert_columns.append('email')
                insert_values.append(payload.email or f'{payload.username}@chirper.local')

            placeholders = ', '.join(['%s'] * len(insert_columns))
            column_sql = ', '.join(insert_columns)
            query = f'INSERT INTO users ({column_sql}) VALUES ({placeholders})'
            try:
                cursor.execute(query, tuple(insert_values))
            except IntegrityError as exc:
                if exc.errno == errorcode.ER_DUP_ENTRY:
                    raise HTTPException(status_code=409, detail='Username already exists') from exc
                raise HTTPException(status_code=500, detail='Database integrity error') from exc
            except MySQLError as exc:
                raise HTTPException(status_code=500, detail='Database error') from exc

            user_id = cursor.lastrowid

    return {'user_id': user_id, 'username': payload.username}


@router.post('/login')
def login(payload: LoginRequest) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            password_column = _resolve_password_column(cursor)
            cursor.execute(
                f'SELECT username, {password_column} FROM users WHERE username = %s LIMIT 1',
                (payload.username,),
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=401, detail='Invalid credentials')

            username, hashed_password = row
            if not verify_password(payload.password, hashed_password):
                raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_access_token(subject=username)
    return {'access_token': token, 'token_type': 'bearer'}


@router.get('/me')
def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> dict[str, Any]:
    return {'user_id': current_user.user_id, 'username': current_user.username}


@router.post('/logout')
def logout(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, str]:
    if credentials is None:
        raise HTTPException(status_code=401, detail='Not authenticated')

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail='Not authenticated') from exc

    username = str(payload['sub'])
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            cursor.execute(
                f'SELECT {user_id_column} FROM users WHERE username = %s LIMIT 1',
                (username,),
            )
            if cursor.fetchone() is None:
                raise HTTPException(status_code=401, detail='Not authenticated')
            blacklist_token(cursor, token)
    return {'status': 'ok'}


def _resolve_password_column(cursor) -> str:
    cursor.execute('SHOW COLUMNS FROM users')
    columns = {row[0] for row in cursor.fetchall()}
    if 'password_hash' in columns:
        return 'password_hash'
    if 'password' in columns:
        return 'password'
    raise HTTPException(status_code=500, detail='Unsupported users schema: password column missing')


def _resolve_user_columns(cursor) -> set[str]:
    cursor.execute('SHOW COLUMNS FROM users')
    return {row[0] for row in cursor.fetchall()}
