# Chirper API (FastAPI + MySQL)

Backend-only Twitter-like API built with FastAPI and the instructor-provided Chirper MySQL schema.

## Requirements

- Python 3.10+ (project target is 3.11+)
- MySQL server with Chirper schema imported
- Environment variables for DB and JWT config

## Setup

1. Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

2. Create `.env` in project root:

```env
APP_ENV=dev
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=chirper
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=30
```

3. Ensure Chirper schema tables exist (`users`, `tweets`, `follows`, `blocks`, `likes`, `blacklisted_tokens`).

Alternative:

- Use your professor's schema repo directly:
  - Source: `https://github.com/anyabdch/CS196-Database`
  - Bootstrap script in this project: `scripts/setup_chirper_db.sh`
  - Example:
```bash
MYSQL_ADMIN_USER=root MYSQL_ADMIN_PASSWORD=your_root_password ./scripts/setup_chirper_db.sh
```

## Run Server

```bash
python3 -m uvicorn app.main:app --reload
```

## Run Tests

- Standard test run (from repo root, no `PYTHONPATH` export needed):

```bash
python3 -m pytest -q
```

- DB-backed tests use `TEST_DB_*` vars when present:

```env
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=3306
TEST_DB_USER=your_user
TEST_DB_PASSWORD=your_password
TEST_DB_NAME=chirper_test
```

Tip: if `pytest` is not on your shell PATH, always use `python3 -m pytest ...`.

## Coverage

```bash
python3 -m pytest --cov=app --cov-config=.coveragerc -q
```

Target coverage is configured to fail below `80%`.

## API Summary

### Public

- `GET /health`
- `GET /health/db`
- `POST /auth/register`
- `POST /auth/login`

### Auth Required (Bearer token)

- `GET /auth/me`
- `POST /auth/logout`
- `PATCH /users/me`
- `POST /users/{username}/follow`
- `DELETE /users/{username}/follow`
- `POST /users/{username}/block`
- `DELETE /users/{username}/block`
- `POST /tweets`
- `DELETE /tweets/{tweet_id}`
- `POST /tweets/{tweet_id}/like`
- `DELETE /tweets/{tweet_id}/like`
- `POST /tweets/{tweet_id}/retweet`
- `DELETE /tweets/{tweet_id}/retweet`
- `GET /feed?limit=20&offset=0`
