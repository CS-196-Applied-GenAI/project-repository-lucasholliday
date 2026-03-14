# UI Decisions

## Current UI Audit (before rework)
- Routes/pages existed for auth, feed, compose, profile, replies, user profile.
- Feed had a backend/FE shape mismatch risk (`/feed` object vs array) that could blank the page.
- Actions were text-first and inconsistent (limited visual hierarchy, no persistent toast system, no count display on likes).
- Discover/search UX was not backed by real data.
- Some backend endpoints were not clearly reachable via explicit UI controls.

## UX/Logic Issues Addressed
- Fixed feed parsing for both payload shapes (`[]` and `{ items: [] }`).
- Added consistent optimistic action handling with rollback and disabled in-flight controls.
- Added like count display + visual liked state.
- Added skeleton loading cards for feed.
- Added shared toast system for success/error feedback.
- Added real user search endpoint and Explore page integration.
- Added visible system-status controls for `/health` and `/health/db`.
- Improved shell/navigation layout (desktop two-column, mobile-friendly stacked layout).

## Design System
- Theme tokens: CSS variables in `frontend/src/styles/globals.css` for background layers, text scale, accent shades, borders, radii, and shadows.
- Accent strategy: green is restricted to active nav, CTA emphasis, links, and engaged actions (liked/retweeted), while base text remains neutral.
- Components: reusable `Button`, `IconButton`, `Card`, `Avatar`, `TextField`, and `Toast` primitives applied across pages.
- Post action row: icon-button controls only (comment/replies, retweet, like, share), with count-only text for metrics.
- Motion/feedback: hover lift on cards, button press feedback, like pop animation, optimistic updates, auto-dismissing toasts.
- Accessibility:
  - icon actions use real `<button>` elements with `aria-label`
  - keyboard-focusable inputs/links/buttons
  - sufficient text contrast against dark backgrounds

## Navigation Structure
- Left rail (desktop): Home, Compose, Discover, My Profile, Logout, profile quick-jump form.
- Center: page content (feed/forms/profiles/replies).
- Right rail (desktop xl): who-to-follow list + quick actions.
- Discover page: search users + suggested accounts list.
- Home page: quick links to Compose and Discover.

## Endpoint to UI Mapping

### Public
- `GET /health` -> `Login/Register` "System Status" card (`Check status`).
- `GET /health/db` -> `Login/Register` "System Status" card (`Check status`).
- `POST /auth/register` -> Register form submit.
- `POST /auth/login` -> Login form submit.

### Auth-protected
- `GET /auth/me` -> auth bootstrap + login completion (UI-driven by entering app/sign-in).
- `POST /auth/logout` -> Logout button (left nav) + idle timeout path.
- `GET /feed` -> Home feed initial load, refresh, pagination.
- `POST /tweets` -> Compose page submit.
- `DELETE /tweets/{tweet_id}` -> Tweet card delete action (own tweets only).
- `POST /tweets/{tweet_id}/like` -> Tweet card like button.
- `DELETE /tweets/{tweet_id}/like` -> Tweet card unlike button.
- `POST /tweets/{tweet_id}/retweet` -> Tweet card retweet button.
- `DELETE /tweets/{tweet_id}/retweet` -> Tweet card unretweet button.
- `PATCH /users/me` -> My Profile save form.
- `GET /users/search` -> Discover page user search form.
- `POST /users/{username}/follow` -> User profile Follow button.
- `DELETE /users/{username}/follow` -> User profile Unfollow button.
- `POST /users/{username}/block` -> User profile Block button.
- `DELETE /users/{username}/block` -> User profile Unblock button.

### Non-UI/Test-only
- `/_test/*` endpoints are test-only and intentionally excluded from production UI.
