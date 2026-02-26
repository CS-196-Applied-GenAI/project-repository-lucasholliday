# Twitter-like Backend — Specification (Using Provided Chirper Database)

## 1) Goal

Build a backend-only Twitter (X)-style application that implements all 16 required tasks from the Twitter Backend assignment using the provided MySQL database structure (Chirper schema).

The backend must allow users to:

1. Create account (unique username + password restrictions)
2. Login (no actions allowed unless logged in)
3. Logout
4. Update profile (bio, username, profile picture)
5. Post tweet (character limit)
6. Delete a post
7. View feed of recent tweets (most recent first)
8. Refresh tweet feed
9. Follow a user
10. Unfollow a user
11. Block a user
12. Unblock a user
13. Like a post
14. Unlike a post
15. Retweet a post
16. Unretweet a post

Frontend is NOT required. Backend APIs only.

---

## 2) Tech Stack

- Python 3.11+
- FastAPI
- MySQL (local installation)
- Provided Chirper database schema
- mysql-connector-python
- bcrypt (password hashing)
- PyJWT (JWT authentication)
- pytest + coverage

---

## 3) Database Usage (Provided Schema)

This project uses the provided Chirper database schema from the instructor repository.

Key tables used:

- `users`
- `tweets`
- `follows`
- `blocks`
- `likes`
- `blacklisted_tokens`

The database is initialized using the provided SQL file (`chirper_full_schema.sql`).

---

## 4) Authentication Model

### 4.1 JWT-based Authentication

- On login: server generates a JWT token.
- Token is returned to client.
- All protected endpoints require:
  Authorization: Bearer <token>
- On logout: token is inserted into `blacklisted_tokens`.
- Protected endpoints must check:
  - Token is valid
  - Token is not blacklisted

### 4.2 Access Control

Public endpoints:
- POST /auth/register
- POST /auth/login
- GET /health

All other endpoints require valid JWT.

---

## 5) Business Rules

### 5.1 Username
- Unique
- Alphanumeric + underscore
- 3–20 characters
- Updatable (must remain unique)

### 5.2 Password
- Minimum 8 characters
- Must include uppercase, lowercase, digit
- Stored only as bcrypt hash

### 5.3 Tweets
- Max length: 240 characters (matches provided schema)
- Stored in `tweets.text`
- Retweets use `retweeted_from` column
- Deletion supported

### 5.4 Follow Rules
- Cannot follow self
- Idempotent follow/unfollow

### 5.5 Block Rules
If A blocks B:
- Neither sees the other's tweets or retweets
- Follow attempts between them return 403
- Likes/retweets between them return 403

### 5.6 Likes
- One like per user per tweet
- Idempotent like/unlike

### 5.7 Retweets
- Retweet creates new tweet row with `retweeted_from` referencing original tweet
- One active retweet per user per original tweet
- Unretweet removes that retweet

---

## 6) Feed Behavior

- Returns newest first
- Includes:
  - Tweets from users the current user follows
  - Retweets by users the current user follows
- Excludes:
  - Content from blocked users (either direction)
- Pagination via limit and offset
- Refresh = calling same endpoint again

---

## 7) API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

### Profile
- PATCH /users/me

### Tweets
- POST /tweets
- DELETE /tweets/{tweet_id}

### Feed
- GET /feed

### Follow
- POST /users/{username}/follow
- DELETE /users/{username}/follow

### Block
- POST /users/{username}/block
- DELETE /users/{username}/block

### Like
- POST /tweets/{tweet_id}/like
- DELETE /tweets/{tweet_id}/like

### Retweet
- POST /tweets/{tweet_id}/retweet
- DELETE /tweets/{tweet_id}/retweet

---

## 8) Error Handling

Standard HTTP status codes:

- 400 – Validation error
- 401 – Not authenticated
- 403 – Forbidden
- 404 – Resource not found
- 409 – Conflict
