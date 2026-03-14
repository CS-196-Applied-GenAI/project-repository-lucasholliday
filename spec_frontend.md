# spec_frontend.md
> Frontend specification for a simplified Twitter (X)-like social media app (“Chirper” backend).
>
> Theme: **Green neon / terminal garden** (dark UI, green accents, subtle “matrix” glow).
>
> This spec is designed to be handed to a code-generation tool to implement the frontend.

---

## 0) Source requirements (what this frontend must satisfy)

### Required pages (minimum set)
Create at least these pages: account creation, login, home feed, post tweet, post reply, replies-to-a-tweet, profile, and an unknown-route error page. fileciteturn2file0L2-L15

### Required navigation (from every in-app page)
From every page *inside the app* (everything except login + account creation):
1) Navigate to tweet feed  
2) Navigate to own profile  
3) Navigate to another user’s profile when viewing their tweet  
4) Logout and be redirected to login fileciteturn2file0L17-L24

### Required security features
1) Users can only access in-app pages when logged in fileciteturn2file0L25-L28  
2) Inactivity timeout logs the user out on idle fileciteturn2file0L28-L29

### Backend assumptions
Backend is already implemented with JWT auth and the following endpoints (plus associated business rules). fileciteturn2file1L60-L181

Key notes:
- Only `/auth/register`, `/auth/login`, `/health` are public; everything else requires a valid JWT. fileciteturn2file1L73-L81
- Tweet max length is 240 chars. fileciteturn2file1L97-L101
- Feed returns newest first; supports pagination by `limit` and `offset`. fileciteturn2file1L124-L134
- Follow/block/like/retweet have idempotency and block-based restrictions. fileciteturn2file1L103-L121

---

## 1) Recommended stack & tooling

- **React 18 + Vite** (fast dev, straightforward deployment)
- **React Router** for routing and protected pages
- **TypeScript** (recommended) for safer integration with API shapes
- **Testing**
  - Unit/integration: **Vitest + React Testing Library**
  - API mocking in tests: **MSW** (Mock Service Worker)
- **Styling**
  - Tailwind CSS (recommended for speed + consistency), or CSS modules if preferred
- **State**
  - React Context for auth/session + a small set of reusable hooks
  - Server state fetches via `fetch` wrappers (or React Query if desired; optional)

This spec assumes **TypeScript + Tailwind**.

---

## 2) UX / visual design (“Neon Garden” theme)

### Palette & feel
- Background: near-black
- Primary accent: saturated green
- Secondary: muted green + gray
- Highlights: neon glow for active UI, focus rings, selected nav

### Visual motifs
- “Terminal cards” with subtle scanlines (CSS gradient overlay)
- “Sprout” iconography (leaf, seed, vine) as small branding elements
- Buttons: pill/rounded, neon outline, hover glow
- Typography: system font, slightly larger line-height, tweet text is easy to read

### Layout
- Desktop: 3-column
  - Left: app nav
  - Center: main content
  - Right: “Quick actions” / user card / suggestions (optional)
- Mobile: top bar + bottom nav (optional), content full width

---

## 3) App routes & page responsibilities

### Public routes (no token required)
- `GET /register` → **AccountCreationPage**
- `GET /login` → **LoginPage**

### Protected routes (require token)
- `GET /` → redirect to `/home` if logged in, else `/login`
- `GET /home` → **HomeFeedPage**
- `GET /compose` → **PostTweetPage** (new tweet)
- `GET /tweet/:tweetId/reply` → **PostReplyPage**
- `GET /tweet/:tweetId/replies` → **RepliesPage**
- `GET /profile` → **MyProfilePage** (current user)
- `GET /u/:username` → **UserProfilePage** (other user)
- `GET *` → **NotFoundPage** (unknown path)

**Navigation must be present on all protected pages**. fileciteturn2file0L17-L24

---

## 4) Authentication, session storage, and inactivity timeout

### Token storage (recommended)
- Store JWT in **memory** + **localStorage** (so refresh persists session).
  - Key: `chirper_token`
  - Also store `chirper_last_active` timestamp

### Auth flow
- Register: `POST /auth/register` then redirect to `/login`
- Login: `POST /auth/login`, store token, then route to `/home`
- Me: call `GET /auth/me` after login and on app startup to populate current user

### ProtectedRoute behavior
- If no token: redirect to `/login` with `from` state.
- If token exists but `/auth/me` returns 401: clear token and redirect to `/login`.

### Inactivity timeout (required)
- Implement `IdleTimerProvider` that:
  - Listens to `mousemove`, `keydown`, `scroll`, `click`, `touchstart`
  - Updates `lastActive` in state + localStorage (throttle to 1 update / 5s)
  - If idle for **15 minutes** (configurable constant), auto-logout:
    - Call `POST /auth/logout` (best-effort; ignore failures)
    - Clear token
    - Redirect to `/login`
This satisfies the required inactivity timeout security feature. fileciteturn2file0L28-L29

---

## 5) API integration contract

### Base URL
- Configure via env: `VITE_API_BASE_URL`
- Example dev: `http://localhost:8000`

### Shared request helper
All protected endpoints must send:
- `Authorization: Bearer <token>` fileciteturn2file1L64-L71

Implement a wrapper:
- `apiFetch(path, { method, body })`
- Auto JSON encode/decode
- If 401: trigger global logout

### Endpoints used (from backend spec)
Auth:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me` fileciteturn2file1L139-L143

Profile:
- `PATCH /users/me` fileciteturn2file1L145-L147

Tweets:
- `POST /tweets`
- `DELETE /tweets/{tweet_id}` fileciteturn2file1L148-L151

Feed:
- `GET /feed` (supports `limit`, `offset`) fileciteturn2file1L124-L134

Follow:
- `POST /users/{username}/follow`
- `DELETE /users/{username}/follow` fileciteturn2file1L155-L158

Block:
- `POST /users/{username}/block`
- `DELETE /users/{username}/block` fileciteturn2file1L159-L162

Like:
- `POST /tweets/{tweet_id}/like`
- `DELETE /tweets/{tweet_id}/like` fileciteturn2file1L163-L166

Retweet:
- `POST /tweets/{tweet_id}/retweet`
- `DELETE /tweets/{tweet_id}/retweet` fileciteturn2file1L167-L170

### Error handling contract (frontend expectations)
Backend uses standard HTTP codes (400/401/403/404/409). fileciteturn2file1L173-L181

Frontend behavior:
- 400: show inline validation message (don’t toast-only)
- 401: auto-logout + redirect to `/login`
- 403: show “Action not allowed” (usually due to block rules)
- 404: show “Not found” (tweet/user not found)
- 409: show “Conflict” (e.g., username taken)

---

## 6) Replies feature: required pages without guaranteed backend endpoints

The assignment requires a “reply compose” page and a “view replies” page. fileciteturn2file0L8-L12  
The provided backend spec does **not** explicitly list reply-specific endpoints.

Therefore, implement replies in a way that still demonstrates the pages:

### Behavior (recommended)
- **PostReplyPage** posts a normal tweet via `POST /tweets` with a prefixed convention:
  - `@{originalAuthor} ` + reply text
- **RepliesPage** shows:
  - The original tweet card (from feed cache or a lightweight local “tweet store”)
  - A list of “replies” as **client-side** entries created during this session (kept in localStorage under `chirper_replies` keyed by tweetId)

This ensures the required pages exist and are fully navigable even if the backend has no reply endpoints.

If your backend *does* support replies (unknown to this spec), you can later replace the local storage implementation with real endpoints without changing routing/UI.

---

## 7) Data models (TypeScript interfaces)

Define minimal frontend-facing shapes (adapt to actual backend JSON at implementation time):

```ts
export type Username = string;

export interface Me {
  username: Username;
  bio?: string | null;
  profile_picture?: string | null;
}

export interface Tweet {
  id: number | string;
  author_username: Username;
  text: string;
  created_at?: string;
  retweeted_from?: number | string | null;

  // UI-only computed fields (if backend doesn’t return counts/flags)
  likedByMe?: boolean;
  retweetedByMe?: boolean;
  likeCount?: number;
  retweetCount?: number;
}
```

---

## 8) Page specifications

### 8.1 AccountCreationPage (`/register`)
UI:
- Inputs: username, password, confirm password
- Password rules helper text (min 8, uppercase, lowercase, digit) fileciteturn2file1L92-L96
- Submit → `POST /auth/register`
- On success: show “Account created” and redirect to `/login`
- On 409: “Username already taken”

Tests:
- Renders form
- Rejects mismatched confirm password
- Successful register routes to login

### 8.2 LoginPage (`/login`)
UI:
- Inputs: username, password
- Submit → `POST /auth/login`
- On success:
  - Store token
  - Fetch `/auth/me`
  - Route to `/home`

Tests:
- Successful login stores token and redirects
- Failed login shows error

### 8.3 HomeFeedPage (`/home`)
UI:
- Center column: feed list (TweetCard components), newest first fileciteturn2file1L124-L127
- Top actions:
  - “Refresh” button → re-fetch `GET /feed` fileciteturn2file1L133-L134
  - “Compose” button → `/compose`
- Pagination:
  - Default `limit=20`
  - “Load more” increments `offset` by 20

TweetCard actions:
- Like/unlike
- Retweet/unretweet
- Delete (only if author == me)
- Reply (route to `/tweet/:tweetId/reply`)
- View replies (route to `/tweet/:tweetId/replies`)
- Click author → `/u/:username` (required navigation ability) fileciteturn2file0L21-L23

### 8.4 PostTweetPage (`/compose`)
UI:
- Textarea with character counter (0/240 max) fileciteturn2file1L97-L101
- Submit → `POST /tweets`
- On success: route to `/home` and refresh feed

### 8.5 PostReplyPage (`/tweet/:tweetId/reply`)
UI:
- Show the original tweet card (from cached feed or placeholder)
- Textarea + counter
- Submit:
  - Create reply tweet using reply convention (see Section 6)
  - Save in localStorage replies store
  - Route to `/tweet/:tweetId/replies`

### 8.6 RepliesPage (`/tweet/:tweetId/replies`)
UI:
- Show original tweet
- List replies (from local replies store)
- “Reply” button routes to reply compose

### 8.7 MyProfilePage (`/profile`)
UI:
- Me card: username + bio + profile picture (if any)
- “Edit profile” modal/panel:
  - Update bio, username, profile picture URL
  - Submit → `PATCH /users/me` fileciteturn2file1L145-L147
- Optional: show my recent tweets (from feed cache filtered by author)

### 8.8 UserProfilePage (`/u/:username`)
UI:
- User header with username
- Action buttons:
  - Follow/unfollow (idempotent) fileciteturn2file1L103-L106
  - Block/unblock (idempotent) fileciteturn2file1L107-L112
- Show user tweets:
  - If backend has no “user tweets” endpoint, show filtered feed cache; otherwise call the existing endpoint if available.
- If 403 due to block: show “You can’t view this profile.”

### 8.9 NotFoundPage (`*`)
UI:
- Friendly error message + button back to `/home` (if logged in) or `/login`.

---

## 9) Shared layout, navigation, and reusable components

### AppShell (protected)
- Left nav (always visible on protected routes):
  - Home
  - Compose
  - My Profile
  - Logout
This supports the “from each page” navigation requirements. fileciteturn2file0L17-L24

### Components
- `AppShell`
- `TopBar` (optional)
- `TweetCard`
- `UserBadge` (username + small avatar)
- `PrimaryButton`, `GhostButton`, `TextInput`, `Textarea`
- `Toast` system (optional; still keep inline form errors)
- `LoadingState` / `EmptyState`
- `ConfirmDialog` for delete

### Global states
- `AuthContext`: `{ token, me, login(), logout(), isAuthenticated }`
- `IdleTimerProvider` (Section 4)

---

## 10) File & folder structure (recommended)

```
frontend/
  index.html
  vite.config.ts
  src/
    main.tsx
    App.tsx
    routes/
      Router.tsx
      ProtectedRoute.tsx
    layout/
      AppShell.tsx
    pages/
      RegisterPage.tsx
      LoginPage.tsx
      HomeFeedPage.tsx
      PostTweetPage.tsx
      PostReplyPage.tsx
      RepliesPage.tsx
      MyProfilePage.tsx
      UserProfilePage.tsx
      NotFoundPage.tsx
    components/
      TweetCard.tsx
      ...
    api/
      client.ts
      endpoints.ts
    auth/
      AuthContext.tsx
      useAuth.ts
      IdleTimerProvider.tsx
    storage/
      token.ts
      repliesStore.ts
    styles/
      globals.css
    test/
      setup.ts
```

---

## 11) Testing requirements (minimum)

### Routing & access control
- Protected routes redirect to `/login` when no token
- Unknown route shows NotFoundPage
- After login, can navigate to each required page

### Navigation
From each protected page, verify nav links exist and function:
- Home
- My profile
- Logout (redirect to login)
Also verify you can click a tweet author to go to `/u/:username`. fileciteturn2file0L17-L24

### Idle timeout
- With fake timers: after 15 minutes of no activity, user is logged out and redirected. fileciteturn2file0L28-L29

### Core interactions
- Post tweet enforces 240 char limit
- Like/retweet toggles update UI state
- Follow/block buttons call endpoints and update state

---

## 12) Implementation notes / guardrails for codegen

- Do not hardcode API base URL; use `VITE_API_BASE_URL`.
- Centralize auth header injection; do not sprinkle raw `fetch` calls across pages.
- Prefer optimistic UI updates for like/retweet with rollback on failure.
- Keep reply feature local unless backend endpoints are discovered.
- Keep the UI consistent: neon-green focus outlines, dark panels, readable spacing.

---

## 13) Done definition checklist

- [ ] All required pages exist and are routable. fileciteturn2file0L2-L15
- [ ] Protected pages require login. fileciteturn2file0L25-L28
- [ ] Idle timeout logs out user. fileciteturn2file0L28-L29
- [ ] Navigation abilities work from every protected page. fileciteturn2file0L17-L24
- [ ] Basic integration with backend endpoints (auth, feed, tweet actions). fileciteturn2file1L139-L170
