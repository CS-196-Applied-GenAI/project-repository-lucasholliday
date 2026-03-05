# plan_frontend.md
> Step-by-step blueprint and iterative build plan for the frontend, based on **spec_frontend.md**. fileciteturn3file0  
> Goal: ship required pages + protected navigation + idle logout, with **≥60% test coverage** (10/10 points).

---

## 1) High-level blueprint (what you will build)

### 1.1 Architecture at a glance
- **React + Vite + TypeScript**
- **React Router** for routes + protected pages
- **AuthContext** for session state (token + current user)
- **IdleTimerProvider** for required inactivity logout fileciteturn3file0L69-L90
- **apiFetch** wrapper to attach JWT and handle 401 globally fileciteturn3file0L95-L116
- **AppShell** layout (left nav + content) present on all protected pages fileciteturn3file0L243-L249
- **Pages required**: register, login, home feed, compose tweet, compose reply, replies list, profile, not found fileciteturn3file0L10-L15

### 1.2 Core flows (end-to-end)
1) **Register → Login → Home**
2) **Home**: view feed + paginate + open user profile + like/retweet/delete/reply/view replies fileciteturn3file0L166-L195
3) **Compose**: create tweet with 240-char limit fileciteturn3file0L200-L210
4) **Profiles**: view/edit your profile; view other profiles and follow/block fileciteturn3file0L223-L242
5) **Security**:
   - No access to protected routes unless logged in fileciteturn3file0L52-L54
   - Idle timeout logs user out fileciteturn3file0L69-L90
6) **Replies**: implemented client-side if backend doesn’t have reply endpoints fileciteturn3file0L128-L152

---

## 2) Testing strategy to hit ≥60% coverage (10/10)

### 2.1 Tooling choice
Use **Jest + React Testing Library** for assignment alignment (prof note), with:
- `@testing-library/react`
- `@testing-library/jest-dom`
- **MSW** for API mocking in tests

Coverage target: **≥60% overall** (Jest summary “All files” line).

### 2.2 What to test (coverage-efficient)
Prioritize modules that are “coverage multipliers”:
- Router + `ProtectedRoute`
- `AuthContext` (login/logout + bootstrapping `/auth/me`)
- `IdleTimerProvider` (fake timers)
- `apiFetch` wrapper (header injection + 401 handling)
- Key pages: Login/Register, HomeFeed, ComposeTweet
- `TweetCard` actions (like/retweet/delete navigation)

### 2.3 Coverage tactics (practical)
- Write tests for shared utilities and wrappers (cheap coverage).
- Prefer integration tests that render page + verify key behavior (counts as many lines covered).
- Keep UI components small + pure; logic in hooks/utilities that are easy to unit-test.

---

## 3) Iterative build plan (first pass: “chunks”)

Each chunk should be a PR-sized slice with tests and passing coverage (not final 60% until later).

### Chunk 0 — Project scaffold + test harness
Deliverables:
- Vite React TS app created under `frontend/`
- Tailwind setup (theme variables + base layout)
- Jest + RTL + MSW configured
- `npm test -- --coverage` works and prints report

Tests:
- “smoke” test that renders `<App />` without crashing

### Chunk 1 — Routing skeleton + NotFound
Deliverables:
- React Router installed
- Routes created (public/protected + `*` NotFound) fileciteturn3file0L41-L67
- Basic placeholder pages for all required routes

Tests:
- Unknown path renders NotFoundPage
- `/home` without auth redirects to `/login` (will fully work after Chunk 2)

### Chunk 2 — Auth foundation (token storage + ProtectedRoute)
Deliverables:
- `token.ts` (get/set/clear localStorage)
- `AuthContext` with `isAuthenticated`
- `ProtectedRoute` enforcement fileciteturn3file0L77-L83
- App boot: if token exists, try `/auth/me`

Tests:
- ProtectedRoute redirects when no token
- When token exists but `/auth/me` returns 401 → token cleared + redirected

### Chunk 3 — API client wrapper (`apiFetch`) + global 401 logout
Deliverables:
- `apiFetch` uses `VITE_API_BASE_URL`
- Injects Authorization header when token exists fileciteturn3file0L109-L116
- Centralized error parsing for 400/403/404/409 fileciteturn3file0L118-L126

Tests:
- `apiFetch` attaches Authorization header
- `apiFetch` on 401 triggers logout handler

### Chunk 4 — Register + Login pages (real)
Deliverables:
- Register form: validate confirm password; call `/auth/register` fileciteturn3file0L156-L165
- Login form: call `/auth/login`, store token, load `/auth/me`, redirect to `/home` fileciteturn3file0L167-L178

Tests:
- Register: mismatch password shows error
- Login: success → token set → navigate to `/home`
- Login: failure shows inline error

### Chunk 5 — AppShell navigation + Logout
Deliverables:
- `AppShell` layout on protected routes
- Nav links: Home, Compose, My Profile, Logout fileciteturn3file0L243-L249
- Logout clears token, calls `/auth/logout` best-effort, redirects to login fileciteturn3file0L69-L90

Tests:
- From a protected page: click “Logout” → redirected to `/login`
- Nav exists on multiple protected pages

### Chunk 6 — Home feed (read-only) + pagination
Deliverables:
- `HomeFeedPage` fetches `/feed?limit=20&offset=0` fileciteturn3file0L199-L195
- “Refresh” re-fetches
- “Load more” increments offset and appends tweets

Tests:
- Feed renders tweets from mocked API
- Load more appends new items

### Chunk 7 — TweetCard interactions (like/retweet/delete + profile navigation)
Deliverables:
- `TweetCard`:
  - Like/unlike endpoints fileciteturn3file0L115-L116
  - Retweet/unretweet endpoints fileciteturn3file0L115-L116
  - Delete only if author == me fileciteturn3file0L185-L188
  - Click author → `/u/:username` fileciteturn3file0L190-L195

Tests:
- Like toggles UI and calls endpoint
- Author click navigates to user profile route

### Chunk 8 — Compose tweet page
Deliverables:
- `/compose` with textarea, 240-char counter, submit disabled if >240 fileciteturn3file0L200-L210
- On submit: `POST /tweets`, redirect to `/home`

Tests:
- Character limit enforced
- Successful submit routes to home

### Chunk 9 — Profile pages (me + user)
Deliverables:
- `/profile`: shows me + edit form → `PATCH /users/me` fileciteturn3file0L215-L222
- `/u/:username`: follow/block toggles + error states for 403/404 fileciteturn3file0L223-L242

Tests:
- Profile edit submits PATCH
- Follow button calls endpoint

### Chunk 10 — Replies pages (client-side store)
Deliverables:
- `/tweet/:tweetId/reply` + `/tweet/:tweetId/replies` fileciteturn3file0L200-L218
- Local storage `repliesStore` keyed by tweetId fileciteturn3file0L128-L152

Tests:
- Submitting a reply adds it to replies list

### Chunk 11 — Idle timeout (security requirement) + final coverage push
Deliverables:
- `IdleTimerProvider` logs out after 15 minutes idle fileciteturn3file0L69-L90
- Add/expand tests until Jest coverage ≥60%

Tests:
- With fake timers: idle causes logout redirect

---

## 4) Second pass: break chunks into smaller “safe” steps

Below, each chunk is decomposed into implementable steps that are small enough for safe codegen + testing.

### Chunk 0 (Scaffold) → steps
0.1 Create `frontend/` Vite React TS project; ensure `npm run dev` works  
0.2 Add Tailwind; define basic theme tokens and default layout container  
0.3 Add Jest + RTL + jest-dom; make 1 render test  
0.4 Add MSW test server setup; make 1 demo handler test  
0.5 Add coverage script and verify report generation

### Chunk 1 (Routing skeleton) → steps
1.1 Install React Router; create `Router.tsx` with all routes mapped to placeholder pages  
1.2 Implement NotFoundPage for `*` route  
1.3 Add router tests: unknown path → NotFound  
1.4 Add `ProtectedRoute` placeholder (always redirects for now)

### Chunk 2 (Auth foundation) → steps
2.1 Implement `storage/token.ts` get/set/clear + tests  
2.2 Implement `AuthContext` minimal: token in state + login/logout methods  
2.3 Implement `ProtectedRoute` using `isAuthenticated`  
2.4 Add bootstrapping: if token exists, call `/auth/me` to populate user  
2.5 Test: token + 401 on `/auth/me` clears token and redirects

### Chunk 3 (apiFetch) → steps
3.1 Implement `api/client.ts` with base URL + JSON helpers  
3.2 Add header injection using token getter  
3.3 Standardize error parsing to `{ status, message }`  
3.4 Add tests for header + 401 behavior (unit tests, no React render required)

### Chunk 4 (Register/Login) → steps
4.1 Build Register form UI only + validation test  
4.2 Wire Register to MSW handler; test success path (redirect)  
4.3 Build Login form UI only + test render  
4.4 Wire Login to MSW; test success stores token and navigates  
4.5 Wire `/auth/me` fetch; test me is stored in context

### Chunk 5 (AppShell/Nav) → steps
5.1 Build AppShell layout with nav links (no styling perfection)  
5.2 Wrap protected routes in AppShell  
5.3 Implement logout button → clears token + navigate login  
5.4 Test: nav visible on protected pages  
5.5 Test: logout redirects

### Chunk 6 (Feed read-only) → steps
6.1 Build `TweetCard` read-only display component  
6.2 Build HomeFeedPage fetch/render list with loading/empty state  
6.3 Add Refresh button re-fetch test  
6.4 Add Load more pagination test

### Chunk 7 (TweetCard actions) → steps
7.1 Add “click author” navigation; test route change  
7.2 Add Like button → endpoint call; test call + optimistic UI  
7.3 Add Retweet button → endpoint call; test call + optimistic UI  
7.4 Add Delete button (only for me); test conditional rendering + call

### Chunk 8 (Compose tweet) → steps
8.1 Build Compose UI + char counter; test 240 limit and disabled state  
8.2 Wire submit to `/tweets`; test navigate back to home

### Chunk 9 (Profiles) → steps
9.1 Build MyProfilePage rendering from `me`  
9.2 Add edit form + submit PATCH; test PATCH call  
9.3 Build UserProfilePage route + header  
9.4 Add follow/unfollow button; test calls  
9.5 Add block/unblock button; test calls  
9.6 Add 403/404 UI states; test with MSW responses

### Chunk 10 (Replies) → steps
10.1 Implement `storage/repliesStore.ts` with get/add + tests  
10.2 Build PostReplyPage UI; test save reply writes store  
10.3 Build RepliesPage list; test reads store and renders

### Chunk 11 (Idle timeout + coverage) → steps
11.1 Implement IdleTimerProvider activity listeners + timer logic  
11.2 Add fake-timers test: idle triggers logout redirect  
11.3 Run coverage report; identify low-coverage modules  
11.4 Add tests to push overall coverage ≥60% (focus Router/Auth/apiFetch/TweetCard)

---

## 5) Third pass: “micro-steps” (right-sized for safe implementation)

These are the smallest steps that still move the project forward meaningfully. Use them as sequential prompts/PRs.

### Micro-step set A — Setup (5 tiny PRs)
A1 Create Vite TS app; commit baseline  
A2 Add Tailwind + global styles; commit  
A3 Add Jest+RTL+jest-dom; add `App.test.tsx` render test; commit  
A4 Add MSW test server (`test/server.ts`) + one demo handler test; commit  
A5 Add `npm test -- --coverage` script; confirm report exists; commit

### Micro-step set B — Router + placeholders (4 tiny PRs)
B1 Add Router with all routes + placeholder components; commit  
B2 Add NotFoundPage and test unknown route; commit  
B3 Add ProtectedRoute that redirects if no token (stub token getter); commit  
B4 Add initial navigation assertion test: protected route redirects; commit

### Micro-step set C — Auth core (6 tiny PRs)
C1 Implement token storage util + unit tests; commit  
C2 Implement AuthContext (token state + login/logout); commit  
C3 Wire ProtectedRoute to AuthContext; add redirect tests; commit  
C4 Add `/auth/me` bootstrap call when token present; commit  
C5 Add test for bootstrap success (me appears in UI); commit  
C6 Add test for bootstrap 401 clears token + redirects; commit

### Micro-step set D — API client (4 tiny PRs)
D1 Implement `apiFetch` base URL + JSON parsing; unit tests for success  
D2 Add Authorization header injection; unit test checks header  
D3 Add standardized error object for 400/403/404/409; unit tests  
D4 Add 401 handling hook callback (logout); unit test

### Micro-step set E — Auth pages (6 tiny PRs)
E1 Register UI + confirm password validation test  
E2 Register API wiring + success redirect test  
E3 Login UI + render test  
E4 Login API wiring + token storage test  
E5 Login + `/auth/me` integration test (stores me)  
E6 Login failure test shows inline message

### Micro-step set F — AppShell + logout (5 tiny PRs)
F1 AppShell layout skeleton with nav links  
F2 Wrap protected pages in AppShell  
F3 Implement logout button behavior  
F4 Test: nav renders on home/profile/compose  
F5 Test: logout redirects to login and clears token

### Micro-step set G — Feed + TweetCard (8 tiny PRs)
G1 TweetCard read-only renders text/author  
G2 HomeFeedPage fetches feed and renders list (MSW)  
G3 Test loading/empty state  
G4 Add Refresh button + test  
G5 Add Load more pagination + test append  
G6 Add author click navigation + test  
G7 Add Like toggle + test endpoint call + optimistic UI  
G8 Add Retweet toggle + test endpoint call + optimistic UI  
G9 Add Delete for own tweet + test conditional + call

### Micro-step set H — Compose + Profiles (8 tiny PRs)
H1 Compose page UI + 240 char enforcement test  
H2 Compose submit posts tweet + routes home test  
H3 MyProfilePage renders me + test  
H4 Edit profile form submits PATCH + test  
H5 UserProfilePage renders username param  
H6 Follow/unfollow toggle + test  
H7 Block/unblock toggle + test  
H8 403/404 states tests

### Micro-step set I — Replies + idle timeout + coverage (7 tiny PRs)
I1 repliesStore util + unit tests  
I2 PostReplyPage saves reply to store + test  
I3 RepliesPage reads store + renders list + test  
I4 Add “Reply”/“View replies” buttons in TweetCard to route pages + tests  
I5 Implement IdleTimerProvider timer logic  
I6 Fake timers test: idle triggers logout + redirect  
I7 Coverage push: add tests to reach ≥60% (target Router/Auth/apiFetch/TweetCard)

---

## 6) “Are the steps right-sized?” sanity check

### Small enough (safe)
- Most PRs change 1 module or 1 page + 1–2 tests.
- Every step has a clear verification path (tests + behavior).

### Big enough (progress)
- Each micro-step ends with visible movement: new route, new test, new UI, or real API wiring.

### Built for coverage
- Early focus on router/auth/api wrappers yields big coverage gains.
- Page-level tests cover many lines quickly.

---

## 7) Definition of done (frontend assignment)
- Required pages implemented and navigable fileciteturn3file0L10-L15
- Navigation works from every protected page fileciteturn3file0L17-L24
- Protected pages gated by login fileciteturn3file0L52-L54
- Idle timeout auto-logout implemented + tested fileciteturn3file0L69-L90
- Jest coverage report shows **≥60% overall**

