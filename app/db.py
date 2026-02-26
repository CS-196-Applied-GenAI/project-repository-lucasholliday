"""Database connection helpers."""

from collections.abc import Generator
from contextlib import contextmanager

import mysql.connector
from mysql.connector.connection import MySQLConnection

from app.core.settings import get_settings


def get_db_connection() -> MySQLConnection:
    """Create a MySQL connection using runtime settings."""
    settings = get_settings()
    # Keep autocommit enabled for simple route-level CRUD operations.
    return mysql.connector.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        autocommit=True,
    )


@contextmanager
def get_db() -> Generator[MySQLConnection, None, None]:
    """Context manager that ensures DB connection closes."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
