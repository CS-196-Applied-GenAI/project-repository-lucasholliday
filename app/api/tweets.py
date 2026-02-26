"""Tweet endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import CurrentUser, get_current_user
from app.db import get_db
from app.db_queries import is_blocked

router = APIRouter(prefix='/tweets', tags=['tweets'])


class CreateTweetRequest(BaseModel):
    text: str


@router.post('', status_code=status.HTTP_201_CREATED)
def create_tweet(
    payload: CreateTweetRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, Any]:
    if len(payload.text) > 240:
        raise HTTPException(status_code=400, detail='Tweet must be at most 240 characters')

    with get_db() as conn:
        with conn.cursor() as cursor:
            id_col, author_col, text_col = resolve_tweet_columns(cursor)
            cursor.execute(
                f'INSERT INTO tweets ({author_col}, {text_col}) VALUES (%s, %s)',
                (current_user.user_id, payload.text),
            )
            tweet_id = cursor.lastrowid

    return {'tweet_id': tweet_id}


@router.delete('/{tweet_id}')
def delete_tweet(
    tweet_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            id_col, author_col, _ = resolve_tweet_columns(cursor)
            cursor.execute(f'SELECT {author_col} FROM tweets WHERE {id_col} = %s LIMIT 1', (tweet_id,))
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail='Tweet not found')

            author_id = int(row[0])
            if author_id != current_user.user_id:
                raise HTTPException(status_code=403, detail='Forbidden')

            cursor.execute(f'DELETE FROM tweets WHERE {id_col} = %s', (tweet_id,))

    return {'status': 'ok'}


@router.post('/{tweet_id}/like')
def like_tweet(
    tweet_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            id_col, author_col, _ = resolve_tweet_columns(cursor)
            cursor.execute(f'SELECT {author_col} FROM tweets WHERE {id_col} = %s LIMIT 1', (tweet_id,))
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail='Tweet not found')
            author_id = int(row[0])
            if is_blocked(conn, current_user.user_id, author_id):
                raise HTTPException(status_code=403, detail='Blocked relationship')

            liker_col, liked_tweet_col = resolve_like_columns(cursor)
            cursor.execute(
                f'INSERT IGNORE INTO likes ({liker_col}, {liked_tweet_col}) VALUES (%s, %s)',
                (current_user.user_id, tweet_id),
            )
    return {'status': 'ok'}


@router.delete('/{tweet_id}/like')
def unlike_tweet(
    tweet_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            liker_col, liked_tweet_col = resolve_like_columns(cursor)
            cursor.execute(
                f'DELETE FROM likes WHERE {liker_col} = %s AND {liked_tweet_col} = %s',
                (current_user.user_id, tweet_id),
            )
    return {'status': 'ok'}


@router.post('/{tweet_id}/retweet')
def retweet(
    tweet_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, int]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            id_col, author_col, text_col = resolve_tweet_columns(cursor)
            retweeted_col = resolve_retweeted_column(cursor)
            cursor.execute(f'SELECT {author_col} FROM tweets WHERE {id_col} = %s LIMIT 1', (tweet_id,))
            original = cursor.fetchone()
            if original is None:
                raise HTTPException(status_code=404, detail='Tweet not found')

            original_author_id = int(original[0])
            if is_blocked(conn, current_user.user_id, original_author_id):
                raise HTTPException(status_code=403, detail='Blocked relationship')

            cursor.execute(
                f'SELECT {id_col} FROM tweets WHERE {author_col} = %s AND {retweeted_col} = %s LIMIT 1',
                (current_user.user_id, tweet_id),
            )
            existing = cursor.fetchone()
            if existing is not None:
                return {'tweet_id': int(existing[0])}

            cursor.execute(
                f'INSERT INTO tweets ({author_col}, {text_col}, {retweeted_col}) VALUES (%s, %s, %s)',
                (current_user.user_id, '', tweet_id),
            )
            return {'tweet_id': int(cursor.lastrowid)}


@router.delete('/{tweet_id}/retweet')
def unretweet(
    tweet_id: int,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, str]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            author_col = resolve_tweet_columns(cursor)[1]
            retweeted_col = resolve_retweeted_column(cursor)
            cursor.execute(
                f'DELETE FROM tweets WHERE {author_col} = %s AND {retweeted_col} = %s',
                (current_user.user_id, tweet_id),
            )
    return {'status': 'ok'}


def resolve_tweet_columns(cursor) -> tuple[str, str, str]:
    cursor.execute('SHOW COLUMNS FROM tweets')
    columns = {row[0] for row in cursor.fetchall()}

    if 'tweet_id' in columns:
        id_col = 'tweet_id'
    elif 'id' in columns:
        id_col = 'id'
    else:
        raise HTTPException(status_code=500, detail='Unsupported tweets schema: id column missing')

    if 'author_id' in columns:
        author_col = 'author_id'
    elif 'user_id' in columns:
        author_col = 'user_id'
    else:
        raise HTTPException(status_code=500, detail='Unsupported tweets schema: author column missing')

    if 'text' in columns:
        text_col = 'text'
    elif 'content' in columns:
        text_col = 'content'
    else:
        raise HTTPException(status_code=500, detail='Unsupported tweets schema: text column missing')

    return id_col, author_col, text_col


def resolve_like_columns(cursor) -> tuple[str, str]:
    cursor.execute('SHOW COLUMNS FROM likes')
    columns = {row[0] for row in cursor.fetchall()}

    liker_col = None
    for candidate in ('user_id', 'liker_id'):
        if candidate in columns:
            liker_col = candidate
            break
    if liker_col is None:
        raise HTTPException(status_code=500, detail='Unsupported likes schema: user column missing')

    tweet_col = None
    for candidate in ('tweet_id', 'liked_tweet_id'):
        if candidate in columns:
            tweet_col = candidate
            break
    if tweet_col is None:
        raise HTTPException(status_code=500, detail='Unsupported likes schema: tweet column missing')

    return liker_col, tweet_col


def resolve_retweeted_column(cursor) -> str:
    cursor.execute('SHOW COLUMNS FROM tweets')
    columns = {row[0] for row in cursor.fetchall()}
    for candidate in ('retweeted_from', 'retweet_of'):
        if candidate in columns:
            return candidate
    raise HTTPException(status_code=500, detail='Unsupported tweets schema: retweet column missing')
