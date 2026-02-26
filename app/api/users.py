"""User profile and social endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import IntegrityError, errorcode
from pydantic import BaseModel

from app.api.util import value_error_to_http_400
from app.core.security import CurrentUser, get_current_user, resolve_user_id_column
from app.core.validators import validate_username
from app.db import get_db
from app.db_queries import is_blocked, resolve_block_columns

router = APIRouter(prefix='/users', tags=['users'])


class UpdateMeRequest(BaseModel):
    bio: str | None = None
    username: str | None = None
    profile_picture: str | None = None


@router.patch('/me')
def update_me(
    payload: UpdateMeRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, Any]:
    if payload.username is not None:
        try:
            validate_username(payload.username)
        except ValueError as exc:
            raise value_error_to_http_400(exc) from exc

    updates: dict[str, Any] = {}
    if payload.bio is not None:
        updates['bio'] = payload.bio
    if payload.username is not None:
        updates['username'] = payload.username
    if payload.profile_picture is not None:
        updates['profile_picture'] = payload.profile_picture

    if not updates:
        raise HTTPException(status_code=400, detail='No fields to update')

    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            assignments = ', '.join(f"{column} = %s" for column in updates)
            values = list(updates.values()) + [current_user.user_id]
            query = f'UPDATE users SET {assignments} WHERE {user_id_column} = %s'

            try:
                cursor.execute(query, tuple(values))
            except IntegrityError as exc:
                if exc.errno == errorcode.ER_DUP_ENTRY:
                    raise HTTPException(status_code=409, detail='Username already exists') from exc
                raise HTTPException(status_code=500, detail='Database integrity error') from exc

            cursor.execute(
                f'SELECT {user_id_column}, username, bio, profile_picture FROM users '
                f'WHERE {user_id_column} = %s LIMIT 1',
                (current_user.user_id,),
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail='User not found')

    user_id, username, bio, profile_picture = row
    return {
        'user_id': user_id,
        'username': username,
        'bio': bio,
        'profile_picture': profile_picture,
    }


@router.post('/{username}/follow')
def follow_user(
    username: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            target_user_id = resolve_user_id_by_username(cursor, username, user_id_column)
            if target_user_id is None:
                raise HTTPException(status_code=404, detail='User not found')
            if target_user_id == current_user.user_id:
                raise HTTPException(status_code=400, detail='Cannot follow yourself')
            if is_blocked(conn, current_user.user_id, target_user_id):
                raise HTTPException(status_code=403, detail='Blocked relationship')

            follower_col, following_col = resolve_follow_columns(cursor)
            cursor.execute(
                f'INSERT IGNORE INTO follows ({follower_col}, {following_col}) VALUES (%s, %s)',
                (current_user.user_id, target_user_id),
            )
    return {'status': 'ok'}


@router.post('/{username}/block')
def block_user(
    username: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            target_user_id = resolve_user_id_by_username(cursor, username, user_id_column)
            if target_user_id is None:
                raise HTTPException(status_code=404, detail='User not found')
            if target_user_id == current_user.user_id:
                raise HTTPException(status_code=400, detail='Cannot block yourself')

            blocker_col, blocked_col = resolve_block_columns(cursor)
            cursor.execute(
                f'INSERT IGNORE INTO blocks ({blocker_col}, {blocked_col}) VALUES (%s, %s)',
                (current_user.user_id, target_user_id),
            )
    return {'status': 'ok'}


@router.delete('/{username}/block')
def unblock_user(
    username: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            target_user_id = resolve_user_id_by_username(cursor, username, user_id_column)
            if target_user_id is None:
                return {'status': 'ok'}

            blocker_col, blocked_col = resolve_block_columns(cursor)
            cursor.execute(
                f'DELETE FROM blocks WHERE {blocker_col} = %s AND {blocked_col} = %s',
                (current_user.user_id, target_user_id),
            )
    return {'status': 'ok'}


@router.delete('/{username}/follow')
def unfollow_user(
    username: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_column = resolve_user_id_column(cursor)
            target_user_id = resolve_user_id_by_username(cursor, username, user_id_column)
            if target_user_id is None:
                return {'status': 'ok'}

            follower_col, following_col = resolve_follow_columns(cursor)
            cursor.execute(
                f'DELETE FROM follows WHERE {follower_col} = %s AND {following_col} = %s',
                (current_user.user_id, target_user_id),
            )
    return {'status': 'ok'}


def resolve_user_id_by_username(cursor, username: str, user_id_column: str) -> int | None:
    cursor.execute(
        f'SELECT {user_id_column} FROM users WHERE username = %s LIMIT 1',
        (username,),
    )
    row = cursor.fetchone()
    return int(row[0]) if row else None


def resolve_follow_columns(cursor) -> tuple[str, str]:
    cursor.execute('SHOW COLUMNS FROM follows')
    columns = {row[0] for row in cursor.fetchall()}

    follower_col = None
    for candidate in ('follower_id', 'user_id'):
        if candidate in columns:
            follower_col = candidate
            break
    if follower_col is None:
        raise HTTPException(status_code=500, detail='Unsupported follows schema: follower column missing')

    following_col = None
    for candidate in ('following_id', 'followed_id', 'followee_id', 'target_user_id'):
        if candidate in columns:
            following_col = candidate
            break
    if following_col is None:
        raise HTTPException(status_code=500, detail='Unsupported follows schema: following column missing')

    return follower_col, following_col
