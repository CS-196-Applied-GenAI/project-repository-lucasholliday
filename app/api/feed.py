"""Feed endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.tweets import resolve_like_columns, resolve_retweeted_column, resolve_tweet_columns
from app.api.users import resolve_follow_columns
from app.core.security import CurrentUser, get_current_user, resolve_user_id_column
from app.db import get_db
from app.db_queries import is_blocked

router = APIRouter(tags=['feed'])


@router.get('/feed')
def get_feed(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict[str, list[dict[str, Any]]]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_id_col = 'follower_id'
            target_col = 'following_id'
            follower_col, following_col = resolve_follow_columns(cursor)
            user_id_col = follower_col
            target_col = following_col
            cursor.execute(
                f'SELECT {target_col} FROM follows WHERE {user_id_col} = %s',
                (current_user.user_id,),
            )
            followed_ids = [int(row[0]) for row in cursor.fetchall()]
            if not followed_ids:
                return {'items': []}

            id_col, author_col, text_col = resolve_tweet_columns(cursor)
            retweeted_col = resolve_retweeted_column(cursor)
            like_user_col, like_tweet_col = resolve_like_columns(cursor)
            created_col = resolve_created_at_column(cursor)
            user_id_column = resolve_user_id_column(cursor)

            placeholders = ', '.join(['%s'] * len(followed_ids))
            cursor.execute(
                f'SELECT {id_col}, {author_col}, {text_col}, {created_col}, {retweeted_col} '
                f'FROM tweets WHERE {author_col} IN ({placeholders}) '
                f'ORDER BY {created_col} DESC, {id_col} DESC LIMIT %s OFFSET %s',
                tuple(followed_ids + [limit, offset]),
            )
            tweet_rows = cursor.fetchall()

            items: list[dict[str, Any]] = []
            for tweet_id, author_id, text, created_at, retweeted_from in tweet_rows:
                if is_blocked(conn, current_user.user_id, int(author_id)):
                    continue

                cursor.execute(
                    f'SELECT username FROM users WHERE {user_id_column} = %s LIMIT 1',
                    (author_id,),
                )
                user_row = cursor.fetchone()
                if user_row is None:
                    continue

                cursor.execute(
                    f'SELECT COUNT(*) FROM likes WHERE {like_tweet_col} = %s',
                    (tweet_id,),
                )
                like_count = int(cursor.fetchone()[0])

                cursor.execute(
                    f'SELECT 1 FROM likes WHERE {like_tweet_col} = %s AND {like_user_col} = %s LIMIT 1',
                    (tweet_id, current_user.user_id),
                )
                is_liked_by_me = cursor.fetchone() is not None

                items.append(
                    {
                        'tweet_id': int(tweet_id),
                        'author_username': str(user_row[0]),
                        'text': text,
                        'created_at': str(created_at),
                        'retweeted_from': retweeted_from,
                        'like_count': like_count,
                        'is_liked_by_me': is_liked_by_me,
                    }
                )

    return {'items': items}


def resolve_created_at_column(cursor) -> str:
    cursor.execute('SHOW COLUMNS FROM tweets')
    columns = {row[0] for row in cursor.fetchall()}
    for candidate in ('created_at', 'created_on', 'createdAt'):
        if candidate in columns:
            return candidate
    return resolve_tweet_columns(cursor)[0]
