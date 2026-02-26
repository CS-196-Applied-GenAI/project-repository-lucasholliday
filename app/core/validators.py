"""Validation utilities for request payloads."""

import re

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]{3,20}$")


def validate_username(username: str) -> None:
    """Validate username format."""
    if not USERNAME_PATTERN.match(username):
        raise ValueError(
            "Username must be 3-20 characters and contain only letters, numbers, or underscores."
        )


def validate_password(password: str) -> None:
    """Validate password strength requirements."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one digit.")
