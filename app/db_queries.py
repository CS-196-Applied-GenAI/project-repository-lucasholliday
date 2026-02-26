"""Reusable DB query helpers."""

from fastapi import HTTPException


def is_blocked(conn, user_id_a: int, user_id_b: int) -> bool:
    """Check if either user has blocked the other."""
    with conn.cursor() as cursor:
        blocker_col, blocked_col = resolve_block_columns(cursor)
        cursor.execute(
            f'SELECT 1 FROM blocks WHERE '
            f'({blocker_col} = %s AND {blocked_col} = %s) '
            f'OR ({blocker_col} = %s AND {blocked_col} = %s) LIMIT 1',
            (user_id_a, user_id_b, user_id_b, user_id_a),
        )
        return cursor.fetchone() is not None


def resolve_block_columns(cursor) -> tuple[str, str]:
    cursor.execute('SHOW COLUMNS FROM blocks')
    columns = {row[0] for row in cursor.fetchall()}

    blocker_col = None
    for candidate in ('blocker_id', 'user_id'):
        if candidate in columns:
            blocker_col = candidate
            break
    if blocker_col is None:
        raise HTTPException(status_code=500, detail='Unsupported blocks schema: blocker column missing')

    blocked_col = None
    for candidate in ('blocked_id', 'target_user_id'):
        if candidate in columns:
            blocked_col = candidate
            break
    if blocked_col is None:
        raise HTTPException(status_code=500, detail='Unsupported blocks schema: blocked column missing')

    return blocker_col, blocked_col
