# Prompt Sequence for Code-Generation LLM (TDD, Incremental, No Orphans)

These prompts implement the attached **development plan** and **spec** step-by-step, with tests written first, then minimal code to pass, and continuous integration into the running FastAPI app.  
Assumptions: Python 3.11+, FastAPI, MySQL (chirper schema), pytest. Each step **must keep the test suite passing** before moving on.

**How to use**: Copy-paste **one prompt at a time** into your code-gen LLM. After each prompt, run tests (`pytest -q`) and only proceed when green.

---

## Prompt 0 — Project scaffold + first passing test (health)

```text
You are implementing a backend-only Twitter-like app using FastAPI + MySQL and the instructor-provided Chirper schema.

Goal for this step:
1) Create a clean project scaffold with a working FastAPI app and pytest setup.
2) Add a /health endpoint that returns 200 with JSON {"status":"ok"}.
3) Write tests FIRST (pytest) using FastAPI TestClient.
4) Keep code minimal but production-oriented (clear structure, type hints, docstrings where useful).

Constraints:
- No database required yet; this is just scaffolding.
- Ensure the app can be imported by tests.

Deliverables:
- Directory structure (suggested):
  app/
    __init__.py
    main.py
    api/__init__.py
  tests/
    test_health.py
  pyproject.toml or requirements.txt (choose one and be consistent)
- test_health.py that asserts /health returns 200 and correct JSON.
- app/main.py with FastAPI instance and router wiring.

After implementing, run pytest and ensure it passes.
```

---

## Prompt 1 — Settings + env loading + DB connection helper + connection test

```text
Next step: introduce configuration and a MySQL connection helper, with tests that verify we can open/close a connection.

Do this test-first.

Requirements:
- Add app/core/settings.py using pydantic-settings (or equivalent) to read .env:
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- Add app/db.py with a get_db_connection() helper using mysql-connector-python.
  It should:
  - open a connection using settings
  - set autocommit appropriately (recommend autocommit=True for simple CRUD, but justify in a comment)
  - expose a context manager (recommended) so routes can do: with get_db() as conn: ...
- Add a small /health/db endpoint that attempts SELECT 1 and returns 200 if ok else 500.
- Tests:
  - test_db_connection_smoke: monkeypatch settings to point to test DB env vars (do NOT hardcode secrets)
  - test_health_db_endpoint: calls /health/db and expects 200 when DB is available, otherwise skips with pytest.skip if env missing

Best practices:
- If DB env vars are not set, skip DB tests gracefully.
- Do not connect at import-time; connect inside functions.
- Keep app wiring clean: app/main.py includes router(s) and dependencies.

Update the scaffold accordingly and keep all tests passing.
```

---

## Prompt 2 — Shared error model + consistent HTTP errors (foundation)

```text
Add a small error-handling foundation before implementing features.

Test-first:
- Create app/schemas/errors.py defining a standard error response:
  {"detail": "<message>"}
  (FastAPI already uses this shape; ensure our code uses HTTPException consistently.)
- Create app/core/security.py placeholder module (no JWT yet) and app/core/validators.py placeholder.

Add tests that ensure:
- Unknown route returns 404.
- A sample route that raises HTTPException(401, "Not authenticated") returns {"detail":"Not authenticated"}.

Implementation:
- Add an /_test/unauthorized endpoint (only for tests) that raises 401, behind an include_router only in testing mode (controlled by settings ENV like APP_ENV="test").
- Keep production app free of test-only routes unless APP_ENV=test.

Keep tests green.
```

---

## Prompt 3 — Password + username validation utilities (unit-tested)

```text
Implement the validation rules from the spec as pure functions first, with unit tests.

Rules:
- Username: unique (enforced later), but format rules now:
  - 3–20 chars
  - alphanumeric + underscore only
- Password:
  - at least 8 chars
  - contains uppercase, lowercase, digit

Test-first:
- tests/test_validators.py:
  - username_valid accepts: "lucas_123", rejects: "ab", "too_long_username_over_20", "bad-char!"
  - password_valid accepts: "Abcdefg1", rejects missing uppercase/lowercase/digit/too short
- Implement in app/core/validators.py:
  - def validate_username(username: str) -> None (raise ValueError with clear message)
  - def validate_password(password: str) -> None (raise ValueError with clear message)

Then:
- Add a tiny internal function in app/api/util.py (or similar) that converts ValueError into HTTP 400.

Do not add auth endpoints yet—just validators + tests.
```

---

## Prompt 4 — Auth: register endpoint (DB-backed) + bcrypt hashing (tests)

```text
Implement POST /auth/register using the provided MySQL schema.

Test-first using TestClient and a real DB if available; otherwise skip DB tests.
- Create tests/test_auth_register.py:
  - register success returns 201 and includes created username (and maybe user_id if schema has it)
  - duplicate username returns 409
  - invalid username/password returns 400
- Use fixtures to:
  - create a temporary user row (cleanup after)
  - or wrap tests in transaction and rollback if feasible (note mysql-connector autocommit; you can manage cleanup manually)

Implementation:
- Add app/api/auth.py router and wire it in app/main.py.
- Implement bcrypt hashing in app/core/security.py:
  - hash_password(plain) -> str
  - verify_password(plain, hashed) -> bool
- In /auth/register:
  - validate username/password via validators
  - attempt INSERT into users table with hashed password
  - handle duplicate username (MySQL integrity error) -> 409

Keep code incremental:
- No JWT yet.
- Ensure all endpoints return consistent JSON.
```

---

## Prompt 5 — Auth: JWT create/verify + login endpoint (tests)

```text
Implement JWT auth and POST /auth/login.

Test-first:
- tests/test_auth_login.py:
  - register then login returns 200 and a token string
  - invalid password returns 401
  - invalid username returns 401
  - token decodes to expected subject (username or user_id—choose one and document)
- Add app/core/security.py:
  - create_access_token(subject: str) -> str
  - decode_access_token(token: str) -> dict (raise ValueError on failure)
- Add settings:
  - JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRES_MINUTES
  - Use a short expiry for tests if desired, but don't rely on sleeping.

Implementation:
- /auth/login checks user in DB, verifies bcrypt hash, returns {"access_token": "...", "token_type": "bearer"}.
- Do not yet protect other endpoints—just produce tokens.

Keep tests passing.
```

---

## Prompt 6 — Auth: blacklist table + logout endpoint + auth dependency (tests)

```text
Implement logout and a reusable dependency that enforces:
- valid JWT
- token not blacklisted
- user exists

Test-first:
- tests/test_auth_protection.py:
  - define a protected endpoint /auth/me (GET) that returns current user info
  - calling /auth/me without Authorization header -> 401
  - with valid token -> 200 and correct username
  - logout then reuse same token on /auth/me -> 401 (or 403) due to blacklist
- tests/test_auth_logout.py:
  - POST /auth/logout with token blacklists it (idempotent ok)

Implementation:
- Add a function in app/core/security.py:
  - get_current_user dependency that:
    - reads Authorization: Bearer
    - decodes token
    - checks blacklisted_tokens table for token (or token jti if schema supports it; if not, store token string as in spec)
    - fetches user row
    - returns a typed User model (Pydantic schema)
- Add /auth/me endpoint (GET) to confirm current user.
- Add /auth/logout to insert token into blacklisted_tokens.

Wire dependency into /auth/me and keep app wired.

All tests must pass.
```

---

## Prompt 7 — Profile: PATCH /users/me (bio/username/profile_picture) (tests)

```text
Implement profile update endpoint: PATCH /users/me.

Test-first:
- tests/test_profile.py:
  - update bio works (200, value updated)
  - update username to a new unique username works
  - update username conflict -> 409
  - update requires login -> 401

Implementation:
- Add app/api/users.py router with PATCH /users/me.
- Accept optional fields: bio, username, profile_picture.
- Validate username format if provided.
- Enforce uniqueness by checking DB or catching integrity error.
- Use current_user dependency (already built) to know who is updating.

Ensure no orphan code: route wired in main.py, tests green.
```

---

## Prompt 8 — Tweets: POST /tweets + DELETE /tweets/{id} (author-only) (tests)

```text
Implement tweet creation and deletion.

Test-first:
- tests/test_tweets.py:
  - create tweet success: POST /tweets returns 201 and tweet_id
  - too long (>240) -> 400
  - delete own tweet -> 200/204
  - delete others' tweet -> 403
  - delete non-existent -> 404

Implementation:
- Add app/api/tweets.py router.
- POST /tweets:
  - requires auth
  - validates length <= 240
  - inserts into tweets with author user_id and text
- DELETE /tweets/{tweet_id}:
  - requires auth
  - checks tweet exists
  - checks author matches current user
  - deletes it

Keep responses consistent and tests passing.
```

---

## Prompt 9 — Follow: POST/DELETE /users/{username}/follow (idempotent + no self-follow) (tests)

```text
Implement following and unfollowing users.

Test-first:
- tests/test_follow.py:
  - follow success -> 200/201
  - follow idempotent (repeat follow doesn't error)
  - cannot follow self -> 400
  - unfollow success -> 200/204
  - unfollow idempotent

Implementation:
- Add endpoints to app/api/users.py (or separate app/api/follows.py if cleaner, but keep wiring simple):
  - POST /users/{username}/follow
  - DELETE /users/{username}/follow
- Both require auth.
- Resolve target username -> user_id.
- Insert/delete from follows table.
- Prevent self-follow.

Keep all tests green.
```

---

## Prompt 10 — Block: POST/DELETE /users/{username}/block + enforce block checks (minimal) (tests)

```text
Implement blocking/unblocking and immediately enforce it in the most sensitive interactions.

Test-first:
- tests/test_block.py:
  - A blocks B: subsequent follow attempt either direction returns 403
  - A blocks B: A should not see B's tweets in feed (feed implemented later, but create a placeholder /_test/feed_preview for now OR defer feed assertion to feed milestone; do not orphan code)
  - unblock restores follow behavior

Implementation:
- Add:
  - POST /users/{username}/block
  - DELETE /users/{username}/block
- Add a shared helper in app/db/queries.py (or similar) that checks if two users are blocked either direction:
  - is_blocked(conn, user_id_a, user_id_b) -> bool
- Enforce block rule NOW in:
  - follow endpoints (return 403 if blocked)
  - tweet create/delete does not need block logic
- Do not implement likes/retweets enforcement yet, but ensure helper is placed where it will be reused.

Keep tests passing and avoid any unused endpoints.
```

---

## Prompt 11 — Likes: POST/DELETE /tweets/{id}/like (idempotent) + block enforcement (tests)

```text
Implement like/unlike endpoints with idempotency and block enforcement.

Test-first:
- tests/test_likes.py:
  - like success
  - like again is idempotent (still 200/204)
  - unlike success
  - unlike again idempotent
  - if tweet author is blocked either direction, liking returns 403

Implementation:
- Add to app/api/tweets.py:
  - POST /tweets/{tweet_id}/like
  - DELETE /tweets/{tweet_id}/like
- Require auth.
- Resolve tweet -> author_id; if not found -> 404.
- Use is_blocked helper to deny.
- Insert/delete in likes table; use unique constraint behavior if present, otherwise check first.

Keep suite green.
```

---

## Prompt 12 — Retweets: POST/DELETE /tweets/{id}/retweet + block enforcement (tests)

```text
Implement retweet/unretweet as specified: retweet creates a new tweet row with retweeted_from pointing to original tweet.

Test-first:
- tests/test_retweets.py:
  - retweet success creates a tweet with retweeted_from=original_id
  - user can only have one active retweet per original tweet (idempotent: repeating retweet returns existing retweet or no-op)
  - unretweet removes that retweet (idempotent)
  - blocked retweet returns 403

Implementation:
- Add to app/api/tweets.py:
  - POST /tweets/{tweet_id}/retweet
  - DELETE /tweets/{tweet_id}/retweet
- Require auth.
- Validate original tweet exists.
- Deny if blocked with original author.
- Enforce one retweet per user per original:
  - query tweets where author=current_user and retweeted_from=original_id
- Insert/delete accordingly.

All tests must pass.
```

---

## Prompt 13 — Feed: GET /feed with ordering, pagination, follows, retweets, blocks (tests)

```text
Implement the feed endpoint last, wiring together follows, tweets, retweets, and blocks.

Test-first:
- tests/test_feed.py:
  - when user follows someone, their tweets appear in feed
  - retweets by followed users appear in feed
  - ordering newest first
  - limit/offset pagination works
  - blocked users' content excluded both directions

Implementation:
- Add app/api/feed.py router with GET /feed?limit=20&offset=0.
- Require auth.
- Query logic (document and keep readable):
  - Determine followed user_ids for current user
  - Fetch tweets where author_id in followed_ids
  - Include retweets as they are tweets rows (retweeted_from not null) by followed authors
  - Exclude any tweets where author is blocked with current user either direction
- Return a clean response schema:
  - list of tweets with: tweet_id, author_username, text, created_at, retweeted_from (nullable), like_count, is_liked_by_me, etc.
  (Keep minimal fields required by tests; you can extend later.)

Wire router in main.py.

At the end, remove any test-only temporary endpoints introduced earlier (if any), ensuring no orphan code remains. Ensure full test suite passes.
```

---

## Prompt 14 — Final wiring + cleanup + coverage target (no new features)

```text
Final step: do NOT add new features. Focus on wiring, consistency, and quality.

Tasks:
1) Ensure all routers are included in app/main.py with clear prefixes and tags.
2) Ensure every protected endpoint uses the same auth dependency.
3) Ensure all DB access uses the same connection helper/context manager.
4) Add centralized exception handling for common DB errors (duplicate key -> 409).
5) Add README.md with:
   - setup steps (MySQL, schema import, env vars)
   - how to run server
   - how to run tests and coverage
6) Add coverage config and ensure >=80% (add missing edge case tests only if needed).

Confirm:
- pytest passes
- coverage passes (or instructions to run it)

Produce a concise summary of the final API endpoints and expected auth requirements.
```

---
