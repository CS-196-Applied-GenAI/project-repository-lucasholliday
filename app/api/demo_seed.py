"""Development-only demo content seeding endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import random
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.feed import resolve_created_at_column
from app.api.tweets import resolve_like_columns, resolve_tweet_columns
from app.api.users import resolve_follow_columns
from app.core.security import hash_password, resolve_user_id_column
from app.core.settings import get_settings
from app.db import get_db
from app.db_queries import resolve_block_columns

router = APIRouter(prefix='/dev/demo', tags=['demo'])

_DEMO_PASSWORD = 'Password10'
_DEMO_PREFIX = 'demo_'

_DEMO_PROFILES: list[dict[str, str]] = [
    {'handle': 'alpha', 'name': 'Alpha Reed', 'bio': 'Frontend engineer sharing product notes.'},
    {'handle': 'binary', 'name': 'Binary Lane', 'bio': 'Build logs, launch notes, and coffee.'},
    {'handle': 'campus', 'name': 'Campus Wire', 'bio': 'Student stories and event highlights.'},
    {'handle': 'delta', 'name': 'Delta Quinn', 'bio': 'Mobile-first design and micro-interactions.'},
    {'handle': 'echo', 'name': 'Echo Park', 'bio': 'API patterns and clean service boundaries.'},
    {'handle': 'forge', 'name': 'Forge Rivera', 'bio': 'Turning side projects into products.'},
    {'handle': 'glow', 'name': 'Glow Kim', 'bio': 'Visual polish and accessibility advocate.'},
    {'handle': 'harbor', 'name': 'Harbor Vale', 'bio': 'Shipping updates from the dev dock.'},
    {'handle': 'ion', 'name': 'Ion Brooks', 'bio': 'Type-safe systems and calm deployments.'},
    {'handle': 'jade', 'name': 'Jade Moss', 'bio': 'Community ops and mentorship threads.'},
    {'handle': 'knit', 'name': 'Knit Parker', 'bio': 'Backend reliability and queue tuning.'},
    {'handle': 'lumen', 'name': 'Lumen Hart', 'bio': 'Data stories and growth experiments.'},
    {'handle': 'mosaic', 'name': 'Mosaic Page', 'bio': 'Building social products with intent.'},
    {'handle': 'north', 'name': 'North Allen', 'bio': 'Maps, metrics, and performance budgets.'},
    {'handle': 'orbit', 'name': 'Orbit Stone', 'bio': 'Distributed systems and happy paths.'},
    {'handle': 'pulse', 'name': 'Pulse Vega', 'bio': 'Realtime feeds and event pipelines.'},
    {'handle': 'quartz', 'name': 'Quartz Young', 'bio': 'Ops dashboards and release checklists.'},
    {'handle': 'rally', 'name': 'Rally Hayes', 'bio': 'Developer education and docs quality.'},
]

_POST_SNIPPETS = [
    'Shipped a small UX polish pass today. Tiny changes, better feel.',
    'Reviewing API responses for consistency before the next milestone.',
    'Testing feed pagination behavior across mobile and desktop.',
    'Today\'s build is stable. Moving to cleanup and hardening next.',
    'Pair-programming session unlocked a cleaner architecture path.',
    'Documented edge cases so the team can avoid repeat regressions.',
    'Drafting launch checklist items for reliability and observability.',
    'Optimized loading states so transitions feel smoother in the feed.',
    'Exploring ways to make navigation faster with fewer clicks.',
    'Wrapped up integration tests for auth and profile flows.',
    'Refactoring old components into reusable UI primitives.',
    'Added accessibility labels and keyboard-first interactions.',
]


@router.post('/seed')
def seed_demo_content(
    _: Annotated[None, Depends(_require_demo_seed_access)],
) -> dict[str, Any]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            clear_stats = _clear_demo_content(cursor)
            seed_stats = _seed_demo_content(cursor)

    return {
        'status': 'ok',
        'demo_password': _DEMO_PASSWORD,
        'cleared': clear_stats,
        **seed_stats,
    }


@router.delete('/seed')
def clear_demo_content(
    _: Annotated[None, Depends(_require_demo_seed_access)],
) -> dict[str, Any]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            stats = _clear_demo_content(cursor)
    return {'status': 'ok', **stats}


def _require_demo_seed_access(
    x_demo_seed_secret: Annotated[str | None, Header(alias='X-Demo-Seed-Secret')] = None,
) -> None:
    settings = get_settings()
    if settings.app_env.lower() == 'production':
        raise HTTPException(status_code=404, detail='Not found')

    if not settings.demo_seed_secret:
        raise HTTPException(status_code=503, detail='Demo seed secret not configured')

    if x_demo_seed_secret != settings.demo_seed_secret:
        raise HTTPException(status_code=403, detail='Forbidden')


def _seed_demo_content(cursor) -> dict[str, Any]:
    user_id_column = resolve_user_id_column(cursor)
    user_columns = _resolve_table_columns(cursor, 'users')
    password_column = _resolve_password_column(user_columns)

    cursor.execute(
        f"SELECT {user_id_column}, username FROM users WHERE username LIKE %s ESCAPE '\\\\'",
        (f'{_DEMO_PREFIX}\\_%',),
    )
    existing_rows = cursor.fetchall()
    existing_by_username = {str(row[1]): int(row[0]) for row in existing_rows}

    users_created = 0
    demo_user_ids: list[int] = []
    password_hash = hash_password(_DEMO_PASSWORD)

    for index, profile in enumerate(_DEMO_PROFILES, start=1):
        username = f"{_DEMO_PREFIX}{profile['handle']}"
        values_by_col: dict[str, Any] = {
            'username': username,
            password_column: password_hash,
        }

        if 'email' in user_columns:
            values_by_col['email'] = f'{username}@chirper.local'
        if 'bio' in user_columns:
            values_by_col['bio'] = profile['bio']
        if 'profile_picture' in user_columns:
            values_by_col['profile_picture'] = f'https://api.dicebear.com/7.x/bottts/svg?seed={username}'
        if 'name' in user_columns:
            values_by_col['name'] = profile['name']
        if 'display_name' in user_columns:
            values_by_col['display_name'] = profile['name']

        if username in existing_by_username:
            updatable_columns = [col for col in values_by_col if col not in {'username', password_column}]
            if updatable_columns:
                assignments = ', '.join(f'{column} = %s' for column in updatable_columns)
                update_values = [values_by_col[column] for column in updatable_columns] + [username]
                cursor.execute(
                    f'UPDATE users SET {assignments} WHERE username = %s',
                    tuple(update_values),
                )
            demo_user_ids.append(existing_by_username[username])
            continue

        insert_columns = list(values_by_col.keys())
        placeholders = ', '.join(['%s'] * len(insert_columns))
        cursor.execute(
            f"INSERT INTO users ({', '.join(insert_columns)}) VALUES ({placeholders})",
            tuple(values_by_col[column] for column in insert_columns),
        )
        users_created += 1
        demo_user_ids.append(int(cursor.lastrowid))

    follows_created = _seed_follows(cursor, demo_user_ids, user_id_column)
    tweets_created, tweet_rows = _seed_tweets(cursor, demo_user_ids)
    likes_created = _seed_likes(cursor, demo_user_ids, tweet_rows)

    return {
        'users_total': len(demo_user_ids),
        'users_created': users_created,
        'follows_created': follows_created,
        'tweets_created': tweets_created,
        'likes_created': likes_created,
    }


def _seed_follows(cursor, demo_user_ids: list[int], user_id_column: str) -> int:
    if not demo_user_ids:
        return 0

    follower_col, following_col = resolve_follow_columns(cursor)
    created = 0

    for index, source_user_id in enumerate(demo_user_ids):
        for step in range(1, 5):
            target_user_id = demo_user_ids[(index + step) % len(demo_user_ids)]
            cursor.execute(
                f'INSERT IGNORE INTO follows ({follower_col}, {following_col}) VALUES (%s, %s)',
                (source_user_id, target_user_id),
            )
            created += cursor.rowcount

    cursor.execute(
        f"SELECT {user_id_column} FROM users WHERE username NOT LIKE %s ESCAPE '\\\\' LIMIT 25",
        (f'{_DEMO_PREFIX}\\_%',),
    )
    non_demo_user_ids = [int(row[0]) for row in cursor.fetchall()]

    demo_targets = demo_user_ids[:8]
    for source_user_id in non_demo_user_ids:
        for target_user_id in demo_targets:
            cursor.execute(
                f'INSERT IGNORE INTO follows ({follower_col}, {following_col}) VALUES (%s, %s)',
                (source_user_id, target_user_id),
            )
            created += cursor.rowcount

    return created


def _seed_tweets(cursor, demo_user_ids: list[int]) -> tuple[int, list[tuple[int, int]]]:
    if not demo_user_ids:
        return 0, []

    id_col, author_col, text_col = resolve_tweet_columns(cursor)
    created_col = _resolve_tweet_created_column(cursor)
    tweet_rows: list[tuple[int, int]] = []

    randomizer = random.Random(196)
    now = datetime.now(timezone.utc)

    for index, author_id in enumerate(demo_user_ids):
        posts_for_user = 5 + (index % 3)
        for post_index in range(posts_for_user):
            template = _POST_SNIPPETS[(index + post_index) % len(_POST_SNIPPETS)]
            text = f'{template} #{index + 1}-{post_index + 1}'
            created_at = now - timedelta(hours=randomizer.randint(2, 21 * 24))

            if created_col:
                cursor.execute(
                    f'INSERT INTO tweets ({author_col}, {text_col}, {created_col}) VALUES (%s, %s, %s)',
                    (author_id, text, created_at.replace(tzinfo=None)),
                )
            else:
                cursor.execute(
                    f'INSERT INTO tweets ({author_col}, {text_col}) VALUES (%s, %s)',
                    (author_id, text),
                )
            tweet_rows.append((int(cursor.lastrowid), author_id))

    cursor.execute(f'SELECT COUNT(*) FROM tweets WHERE {author_col} IN ({_placeholders(len(demo_user_ids))})', tuple(demo_user_ids))
    tweets_total = int(cursor.fetchone()[0])
    return tweets_total, tweet_rows


def _seed_likes(cursor, demo_user_ids: list[int], tweet_rows: list[tuple[int, int]]) -> int:
    if not demo_user_ids or not tweet_rows:
        return 0

    liker_col, liked_tweet_col = resolve_like_columns(cursor)
    randomizer = random.Random(917)
    created = 0

    for tweet_id, author_id in tweet_rows:
        like_count_target = randomizer.randint(0, min(6, max(1, len(demo_user_ids) - 1)))
        eligible_likers = [user_id for user_id in demo_user_ids if user_id != author_id]
        if not eligible_likers or like_count_target == 0:
            continue
        selected_likers = randomizer.sample(eligible_likers, k=min(like_count_target, len(eligible_likers)))
        for liker_id in selected_likers:
            cursor.execute(
                f'INSERT IGNORE INTO likes ({liker_col}, {liked_tweet_col}) VALUES (%s, %s)',
                (liker_id, tweet_id),
            )
            created += cursor.rowcount

    return created


def _clear_demo_content(cursor) -> dict[str, int]:
    user_id_column = resolve_user_id_column(cursor)
    cursor.execute(
        f"SELECT {user_id_column} FROM users WHERE username LIKE %s ESCAPE '\\\\'",
        (f'{_DEMO_PREFIX}\\_%',),
    )
    demo_user_ids = [int(row[0]) for row in cursor.fetchall()]
    if not demo_user_ids:
        return {
            'users_deleted': 0,
            'tweets_deleted': 0,
            'likes_deleted': 0,
            'follows_deleted': 0,
            'blocks_deleted': 0,
        }

    id_col, author_col, _ = resolve_tweet_columns(cursor)
    cursor.execute(
        f'SELECT {id_col} FROM tweets WHERE {author_col} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids),
    )
    demo_tweet_ids = [int(row[0]) for row in cursor.fetchall()]

    likes_deleted = 0
    liker_col, liked_tweet_col = resolve_like_columns(cursor)
    cursor.execute(
        f'DELETE FROM likes WHERE {liker_col} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids),
    )
    likes_deleted += cursor.rowcount
    if demo_tweet_ids:
        cursor.execute(
            f'DELETE FROM likes WHERE {liked_tweet_col} IN ({_placeholders(len(demo_tweet_ids))})',
            tuple(demo_tweet_ids),
        )
        likes_deleted += cursor.rowcount

    follower_col, following_col = resolve_follow_columns(cursor)
    cursor.execute(
        f'DELETE FROM follows WHERE {follower_col} IN ({_placeholders(len(demo_user_ids))}) OR '
        f'{following_col} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids + demo_user_ids),
    )
    follows_deleted = cursor.rowcount

    blocker_col, blocked_col = resolve_block_columns(cursor)
    cursor.execute(
        f'DELETE FROM blocks WHERE {blocker_col} IN ({_placeholders(len(demo_user_ids))}) OR '
        f'{blocked_col} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids + demo_user_ids),
    )
    blocks_deleted = cursor.rowcount

    cursor.execute(
        f'DELETE FROM tweets WHERE {author_col} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids),
    )
    tweets_deleted = cursor.rowcount

    cursor.execute(
        f'DELETE FROM users WHERE {user_id_column} IN ({_placeholders(len(demo_user_ids))})',
        tuple(demo_user_ids),
    )
    users_deleted = cursor.rowcount

    return {
        'users_deleted': users_deleted,
        'tweets_deleted': tweets_deleted,
        'likes_deleted': likes_deleted,
        'follows_deleted': follows_deleted,
        'blocks_deleted': blocks_deleted,
    }


def _resolve_table_columns(cursor, table_name: str) -> set[str]:
    cursor.execute(f'SHOW COLUMNS FROM {table_name}')
    return {str(row[0]) for row in cursor.fetchall()}


def _resolve_password_column(user_columns: set[str]) -> str:
    if 'password_hash' in user_columns:
        return 'password_hash'
    if 'password' in user_columns:
        return 'password'
    raise HTTPException(status_code=500, detail='Unsupported users schema: password column missing')


def _resolve_tweet_created_column(cursor) -> str | None:
    try:
        candidate = resolve_created_at_column(cursor)
    except HTTPException:
        return None
    tweet_columns = _resolve_table_columns(cursor, 'tweets')
    if candidate in tweet_columns and candidate not in {'id', 'tweet_id'}:
        return candidate
    return None


def _placeholders(size: int) -> str:
    if size < 1:
        raise ValueError('placeholder size must be at least 1')
    return ', '.join(['%s'] * size)
