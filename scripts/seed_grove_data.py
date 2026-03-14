"""Seed realistic Grove users, posts, and follows for local demos."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.api.tweets import resolve_like_columns, resolve_tweet_columns
from app.api.users import resolve_follow_columns
from app.core.security import hash_password, resolve_user_id_column
from app.db import get_db

DEFAULT_PASSWORD = 'Password1'


@dataclass(frozen=True)
class SeedProfile:
    username: str
    bio: str
    posts: tuple[str, ...]


SEED_PROFILES: tuple[SeedProfile, ...] = (
    SeedProfile(
        username='wildcatfan',
        bio='Northwestern sports, campus nights, and weekend takes from Evanston.',
        posts=(
            'Northwestern basketball looking solid this season. Welsh-Ryan was loud tonight.',
            'Nothing beats a fall Saturday in Evanston.',
            'Northwestern football defense looked sharp today.',
            'Still thinking about that fourth quarter stop. Huge moment.',
        ),
    ),
    SeedProfile(
        username='northwesterngrad',
        bio='Alum perspective on campus life, Chicago weekends, and Big Ten chatter.',
        posts=(
            'Lakefill sunset hits different after a long week of classes.',
            'Big Ten tournament is going to be chaos this year.',
            'Always good to be back near campus for a game day weekend.',
            'Evanston in the fall still feels undefeated.',
        ),
    ),
    SeedProfile(
        username='evanstonsports',
        bio='Local scores, game notes, and sports chatter from around Evanston.',
        posts=(
            'Northwestern football defense looked sharp today.',
            'Welsh-Ryan had real energy tonight. Student section showed up.',
            'Big road game this week. Feels like an early season tone-setter.',
            'The rotation looks tighter every game.',
            'That was the loudest fourth quarter of the season so far.',
        ),
    ),
    SeedProfile(
        username='bigtenwatch',
        bio='Tracking Big Ten storylines, tournament swings, and weekly rankings.',
        posts=(
            'Big Ten tournament is going to be chaos this year.',
            'Every week the conference race gets weirder in the best way.',
            'Two road wins in this league should count double.',
            'Ranking the toughest places to play in the conference is impossible this season.',
        ),
    ),
    SeedProfile(
        username='chicagosports',
        bio='Chicago sports notes with a side of lakefront weather complaints.',
        posts=(
            'Lake Michigan wind undefeated as always.',
            'Chicago sports fans can handle anything except false hope in February.',
            'Good coffee, cold air, and a noon kickoff feels very Midwest.',
            'The city looks better when there is a game worth talking about.',
        ),
    ),
    SeedProfile(
        username='campusreport',
        bio='Student routines, campus updates, and small moments around Northwestern.',
        posts=(
            'Anyone else studying at Norris until midnight again?',
            'Coffee before a morning lecture = survival.',
            'The library was packed before 9 a.m. today.',
            'Campus feels especially calm right before finals hit.',
            'There is always one table at Norris that becomes group-project headquarters.',
        ),
    ),
    SeedProfile(
        username='lakefrontlife',
        bio='Views from the lakefront, everyday routines, and Evanston outside the classroom.',
        posts=(
            'Lakefill sunset hits different after a long week of classes.',
            'Nothing clears your head like a walk by the lake in cold air.',
            'The lakefront was packed the second the weather turned decent.',
            'Morning light off Lake Michigan never gets old.',
        ),
    ),
)


def main() -> None:
    with get_db() as conn:
        with conn.cursor() as cursor:
            user_columns = _resolve_table_columns(cursor, 'users')
            password_column = _resolve_password_column(user_columns)

            demo_user_id = _ensure_user(
                cursor=cursor,
                user_columns=user_columns,
                password_column=password_column,
                username='demo',
                password=DEFAULT_PASSWORD,
                bio='Following campus voices, sports talk, and life around the lakefront.',
            )

            seeded_user_ids: dict[str, int] = {}
            for profile in SEED_PROFILES:
                seeded_user_ids[profile.username] = _ensure_user(
                    cursor=cursor,
                    user_columns=user_columns,
                    password_column=password_column,
                    username=profile.username,
                    password=DEFAULT_PASSWORD,
                    bio=profile.bio,
                )

            _reset_seeded_posts(cursor, list(seeded_user_ids.values()))
            _seed_posts(cursor, seeded_user_ids)
            _seed_demo_follows(cursor, demo_user_id, list(seeded_user_ids.values()))
            _seed_network_follows(cursor, seeded_user_ids)
            _seed_likes(cursor, demo_user_id, list(seeded_user_ids.values()))

    print('Grove seed complete.')
    print('Demo login: demo / Password1')
    print('Seeded users:', ', '.join(profile.username for profile in SEED_PROFILES))


def _ensure_user(
    *,
    cursor,
    user_columns: set[str],
    password_column: str,
    username: str,
    password: str,
    bio: str,
) -> int:
    user_id_column = resolve_user_id_column(cursor)
    cursor.execute(
        f'SELECT {user_id_column} FROM users WHERE username = %s LIMIT 1',
        (username,),
    )
    row = cursor.fetchone()

    values_by_col: dict[str, Any] = {
        'username': username,
        password_column: hash_password(password),
    }
    if 'email' in user_columns:
        values_by_col['email'] = f'{username}@grove.local'
    if 'bio' in user_columns:
        values_by_col['bio'] = bio
    if 'profile_picture' in user_columns:
        values_by_col['profile_picture'] = f'https://api.dicebear.com/7.x/thumbs/svg?seed={username}'

    if row is not None:
        user_id = int(row[0])
        updatable = [column for column in values_by_col if column != password_column]
        assignments = ', '.join(f'{column} = %s' for column in updatable)
        cursor.execute(
            f'UPDATE users SET {assignments} WHERE {user_id_column} = %s',
            tuple(values_by_col[column] for column in updatable) + (user_id,),
        )
        return user_id

    insert_columns = list(values_by_col.keys())
    placeholders = ', '.join(['%s'] * len(insert_columns))
    cursor.execute(
        f"INSERT INTO users ({', '.join(insert_columns)}) VALUES ({placeholders})",
        tuple(values_by_col[column] for column in insert_columns),
    )
    return int(cursor.lastrowid)


def _reset_seeded_posts(cursor, author_ids: list[int]) -> None:
    if not author_ids:
        return

    tweet_id_col, author_col, _ = resolve_tweet_columns(cursor)
    liker_col, liked_tweet_col = resolve_like_columns(cursor)
    placeholders = _placeholders(len(author_ids))

    cursor.execute(
        f'SELECT {tweet_id_col} FROM tweets WHERE {author_col} IN ({placeholders})',
        tuple(author_ids),
    )
    tweet_ids = [int(row[0]) for row in cursor.fetchall()]

    if tweet_ids:
        tweet_placeholders = _placeholders(len(tweet_ids))
        cursor.execute(
            f'DELETE FROM likes WHERE {liked_tweet_col} IN ({tweet_placeholders})',
            tuple(tweet_ids),
        )

    cursor.execute(
        f'DELETE FROM likes WHERE {liker_col} IN ({placeholders})',
        tuple(author_ids),
    )
    cursor.execute(
        f'DELETE FROM tweets WHERE {author_col} IN ({placeholders})',
        tuple(author_ids),
    )


def _seed_posts(cursor, seeded_user_ids: dict[str, int]) -> None:
    _, author_col, text_col = resolve_tweet_columns(cursor)
    created_col = _resolve_created_column(cursor)
    now = datetime.now(timezone.utc)

    inserted = 0
    for profile_index, profile in enumerate(SEED_PROFILES):
        author_id = seeded_user_ids[profile.username]
        for post_index, text in enumerate(profile.posts):
            created_at = now - timedelta(hours=inserted * 5 + profile_index + post_index)
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
            inserted += 1


def _seed_demo_follows(cursor, demo_user_id: int, target_user_ids: list[int]) -> None:
    follower_col, following_col = resolve_follow_columns(cursor)
    cursor.execute(
        f'DELETE FROM follows WHERE {follower_col} = %s',
        (demo_user_id,),
    )
    for target_user_id in target_user_ids:
        cursor.execute(
            f'INSERT IGNORE INTO follows ({follower_col}, {following_col}) VALUES (%s, %s)',
            (demo_user_id, target_user_id),
        )


def _seed_network_follows(cursor, seeded_user_ids: dict[str, int]) -> None:
    follower_col, following_col = resolve_follow_columns(cursor)
    ids = list(seeded_user_ids.values())
    for index, source_user_id in enumerate(ids):
        for step in (1, 2):
            target_user_id = ids[(index + step) % len(ids)]
            cursor.execute(
                f'INSERT IGNORE INTO follows ({follower_col}, {following_col}) VALUES (%s, %s)',
                (source_user_id, target_user_id),
            )


def _seed_likes(cursor, demo_user_id: int, seeded_user_ids: list[int]) -> None:
    tweet_id_col, author_col, _ = resolve_tweet_columns(cursor)
    liker_col, liked_tweet_col = resolve_like_columns(cursor)

    cursor.execute(
        f'SELECT {tweet_id_col}, {author_col} FROM tweets ORDER BY {tweet_id_col} DESC LIMIT 24',
    )
    tweet_rows = [(int(row[0]), int(row[1])) for row in cursor.fetchall()]

    for index, (tweet_id, author_id) in enumerate(tweet_rows):
        if author_id != demo_user_id:
            cursor.execute(
                f'INSERT IGNORE INTO likes ({liker_col}, {liked_tweet_col}) VALUES (%s, %s)',
                (demo_user_id, tweet_id),
            )
        liker_id = seeded_user_ids[index % len(seeded_user_ids)]
        if liker_id != author_id:
            cursor.execute(
                f'INSERT IGNORE INTO likes ({liker_col}, {liked_tweet_col}) VALUES (%s, %s)',
                (liker_id, tweet_id),
            )


def _resolve_table_columns(cursor, table_name: str) -> set[str]:
    cursor.execute(f'SHOW COLUMNS FROM {table_name}')
    return {str(row[0]) for row in cursor.fetchall()}


def _resolve_password_column(user_columns: set[str]) -> str:
    if 'password_hash' in user_columns:
        return 'password_hash'
    if 'password' in user_columns:
        return 'password'
    raise RuntimeError('Unsupported users schema: password column missing')


def _resolve_created_column(cursor) -> str | None:
    cursor.execute('SHOW COLUMNS FROM tweets')
    columns = {str(row[0]) for row in cursor.fetchall()}
    for candidate in ('created_at', 'created_on', 'createdAt'):
        if candidate in columns:
            return candidate
    return None


def _placeholders(count: int) -> str:
    return ', '.join(['%s'] * count)


if __name__ == '__main__':
    main()
