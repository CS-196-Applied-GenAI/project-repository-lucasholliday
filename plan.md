# Backend Development Plan (Using Provided Chirper MySQL Schema)

Goal: Implement all 16 required tasks using the instructor-provided MySQL database.

---

## Milestone 0 — Setup

0.1 Install MySQL
0.2 Create database `chirper`
0.3 Run provided schema SQL file
0.4 Configure environment variables (.env)
0.5 Create DB connection helper in FastAPI

Test:
- Confirm DB connection works
- Health endpoint returns 200

---

## Milestone 1 — Authentication (Tasks 1–3)

1.1 Implement password validation rules
1.2 Implement user registration (insert into users table)
1.3 Implement bcrypt hashing
1.4 Implement JWT creation
1.5 Implement login (verify password, return JWT)
1.6 Implement logout (insert token into blacklisted_tokens)
1.7 Create auth dependency that validates JWT and checks blacklist

Tests:
- Register success
- Duplicate username -> 409
- Login success
- Invalid login -> 401
- Logout blocks token reuse
- Protected endpoint without token -> 401

---

## Milestone 2 — Profile (Task 4)

2.1 PATCH /users/me updates bio, username, profile_picture
2.2 Enforce username uniqueness

Tests:
- Update bio
- Update username conflict
- Update requires login

---

## Milestone 3 — Tweets (Tasks 5–6)

3.1 POST /tweets (max 240 chars)
3.2 DELETE /tweets/{id} (author-only)

Tests:
- Create tweet success
- Too long -> 400
- Delete own tweet success
- Delete others tweet -> 403

---

## Milestone 4 — Follow/Unfollow (Tasks 9–10)

4.1 POST /users/{username}/follow
4.2 DELETE /users/{username}/follow
4.3 Prevent self-follow

Tests:
- Follow success
- Self-follow -> 400
- Unfollow success

---

## Milestone 5 — Block/Unblock (Tasks 11–12)

5.1 POST /users/{username}/block
5.2 DELETE /users/{username}/block
5.3 Enforce block checks in feed, follow, like, retweet

Tests:
- Block hides content
- Block prevents follow
- Unblock restores behavior

---

## Milestone 6 — Likes (Tasks 13–14)

6.1 POST /tweets/{id}/like
6.2 DELETE /tweets/{id}/like

Tests:
- Like/unlike
- Duplicate like idempotent
- Blocked like -> 403

---

## Milestone 7 — Retweets (Tasks 15–16)

7.1 POST /tweets/{id}/retweet
7.2 DELETE /tweets/{id}/retweet

Tests:
- Retweet creates new tweet with retweeted_from
- Unretweet removes it
- Blocked retweet -> 403

---

## Milestone 8 — Feed (Tasks 7–8)

8.1 GET /feed returns tweets + retweets by followed users
8.2 Exclude blocked relationships
8.3 Implement limit + offset
8.4 Refresh = same endpoint

Tests:
- Feed ordering newest first
- Followed content appears
- Blocked content excluded

---

## Milestone 9 — Coverage + Finalization

9.1 Add missing edge case tests
9.2 Run coverage
9.3 Achieve >=80% coverage
9.4 Final push to GitHub
