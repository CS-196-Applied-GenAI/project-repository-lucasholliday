import pytest

from app.core.validators import validate_password, validate_username


@pytest.mark.parametrize('username', ['lucas_123'])
def test_username_valid_accepts(username: str) -> None:
    validate_username(username)


@pytest.mark.parametrize('username', ['ab', 'too_long_username_over_20', 'bad-char!'])
def test_username_valid_rejects(username: str) -> None:
    with pytest.raises(ValueError):
        validate_username(username)


@pytest.mark.parametrize('password', ['Abcdefg1'])
def test_password_valid_accepts(password: str) -> None:
    validate_password(password)


@pytest.mark.parametrize('password', ['abcdefg1', 'ABCDEFG1', 'Abcdefgh', 'Abc123', 'abcdefg'])
def test_password_valid_rejects(password: str) -> None:
    with pytest.raises(ValueError):
        validate_password(password)
