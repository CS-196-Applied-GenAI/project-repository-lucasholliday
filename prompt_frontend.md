# prompt_frontend.md
> A sequence of **TDD-first** prompts for a code-generation LLM to implement the frontend incrementally, following **plan_frontend.md** and **spec_frontend.md**. fileciteturn4file0  
> Stack: React + Vite + TypeScript + Tailwind, React Router, Jest + React Testing Library + MSW. fileciteturn4file0L37-L51  
> Requirements reminder: required pages + navigation + protected access + idle timeout. fileciteturn4file4L1-L29

---

## Global instructions (apply to every prompt)
- **Work in `frontend/`** (create it if it doesn’t exist yet).
- Use **TDD**: write/adjust tests first, then implement, then refactor lightly.
- Keep diffs small; avoid “big-bang” refactors.
- **No orphan code**: every new module must be imported/used by the running app or tests in the same step.
- Always end by ensuring:
  - `npm test -- --coverage` passes (coverage can be low early, but tests must pass).
  - `npm run dev` boots without runtime errors.
- Use env var `VITE_API_BASE_URL` for backend base URL. fileciteturn4file5L66-L68

---

# Micro-step set A — Setup (5 tiny PRs)

## Prompt A1 — Create Vite + React + TypeScript baseline
```text
You are implementing the frontend for a Twitter-like app per spec_frontend.md. Create a new Vite React TypeScript project under ./frontend.

Requirements:
1) Use React 18 + TypeScript.
2) Add a minimal <App /> component and render it from main.tsx.
3) Ensure `npm install`, `npm run dev`, and `npm run build` succeed from ./frontend.

Testing (start immediately):
- Add a single minimal test (even before Jest is fully set up) is okay to defer to A3, but DO add a basic “App renders” test as soon as the test runner exists.

Deliverable: a clean baseline commit with no extra dependencies yet besides Vite/React defaults.
```
---

## Prompt A2 — Add Tailwind + Neon Garden base styles
```text
Add Tailwind CSS to the Vite React TS app in ./frontend and implement a minimal “Neon Garden” dark theme baseline consistent with spec_frontend.md.

Requirements:
- Create src/styles/globals.css and wire it into the app.
- Base background near-black, primary accent green, readable text.
- Add a simple layout container class (max width and center).
- Update App to show a styled welcome screen (no routing yet) to visually confirm Tailwind works.

Testing:
- Add/keep a simple render test that checks the welcome text is present (if Jest isn’t installed yet, keep this as TODO but don’t break future work).

No orphan styling files: globals.css must be imported by main.tsx or App.tsx.
```
---

## Prompt A3 — Add Jest + React Testing Library + jest-dom (first real tests)
```text
Set up Jest + React Testing Library + @testing-library/jest-dom for the ./frontend app.

Requirements:
- Add jest config suitable for Vite + TS (use ts-jest or babel-jest; choose one and keep it consistent).
- Add src/test/setup.ts to configure jest-dom matchers and reference it in Jest config.
- Add/replace the App render test so it runs under Jest and passes.

Testing:
- Ensure `npm test` passes.
- Ensure `npm test -- --coverage` runs and outputs a coverage report (even if low).

No orphan test config: test script must exist in package.json, setup file must be loaded.
```
---

## Prompt A4 — Add MSW for API mocking in tests (infrastructure)
```text
Add Mock Service Worker (MSW) to ./frontend for mocking backend API calls in tests.

Requirements:
- Create src/test/server.ts with setupServer(...) and export server.
- In src/test/setup.ts, start/stop/reset the MSW server in beforeAll/afterEach/afterAll.
- Add one small “demo” test that uses MSW to intercept a GET request (can be to /health) and asserts a component renders the mocked response.

Constraints:
- Keep the demo component/test very small.
- Ensure MSW code is actually used by the tests in this step (not just installed).

Deliverable: tests passing with MSW wired into the Jest environment.
```
---

## Prompt A5 — Coverage script + CI-friendly commands
```text
Add and verify coverage tooling and scripts in ./frontend.

Requirements:
- package.json scripts:
  - "test": runs Jest
  - "test:coverage": runs Jest with coverage
- Ensure `npm run test:coverage` prints a coverage summary line for “All files”.

Also:
- Add a short README snippet in ./frontend/README.md describing dev/test commands.

No orphan docs: README should match actual scripts.
```
---

# Micro-step set B — Router + placeholders (4 tiny PRs)

## Prompt B1 — Add React Router and placeholder pages for all required routes
```text
Implement routing skeleton per spec_frontend.md.

Routes required:
Public:
- /register -> RegisterPage
- /login -> LoginPage
Protected:
- / (redirect to /home if logged in else /login)
- /home -> HomeFeedPage
- /compose -> PostTweetPage
- /tweet/:tweetId/reply -> PostReplyPage
- /tweet/:tweetId/replies -> RepliesPage
- /profile -> MyProfilePage
- /u/:username -> UserProfilePage
Catch-all:
- * -> NotFoundPage

Implementation:
- Create src/routes/Router.tsx to define routes.
- Create placeholder pages under src/pages/* that render a unique heading.
- Wire <Router /> into App.tsx.

Testing:
- Add a test that renders the router at /login and confirms the Login page heading exists.
- Add a test that renders /register and confirms the Register page heading exists.

No orphan pages: every placeholder page must be used by a route.
```
---

## Prompt B2 — Implement NotFoundPage and test unknown path
```text
Implement NotFoundPage UI and routing behavior.

Requirements:
- NotFoundPage should show a friendly message and a link/button back to /login (public-safe).
- Ensure Router routes unknown paths to NotFoundPage.

Testing:
- Add a test that renders the router at /some/unknown/path and asserts the NotFound message appears.

Keep it small and minimal styling consistent with the dark/green theme.
```
---

## Prompt B3 — Add a first version of ProtectedRoute (stub auth)
```text
Create src/routes/ProtectedRoute.tsx that protects private routes.

For now (stub):
- Consider the user authenticated if localStorage has a token key "chirper_token".
- If not authenticated, redirect to /login.
- Otherwise render children via <Outlet /> or a wrapper pattern.

Wire it:
- In Router.tsx, wrap protected routes under <ProtectedRoute />.

Testing:
- Test that /home redirects to /login when no token is in localStorage.
- Test that /home renders HomeFeedPage heading when token exists in localStorage.

No orphan ProtectedRoute: it must be used by Router and tested.
```
---

## Prompt B4 — Add initial navigation assertion test (still placeholder UI)
```text
Add a small test suite that verifies key routing behaviors are stable.

Testing:
- /home without token => ends on /login (assert login heading)
- /home with token => shows Home heading
- /u/someuser with token => shows UserProfile heading and includes the username in the UI (add this small UI change)

Keep this step purely test + tiny UI adjustments; no new modules.
```
---

# Micro-step set C — Auth core (6 tiny PRs)

## Prompt C1 — token storage utility + unit tests
```text
Implement token storage helpers with unit tests.

Create src/storage/token.ts:
- getToken(): string | null
- setToken(token: string): void
- clearToken(): void

Use localStorage key: "chirper_token".

Testing:
- Unit tests for get/set/clear behavior (no React render required).
- Ensure tests clean up localStorage between cases.

Wire:
- Update ProtectedRoute stub from B3 to use getToken() instead of direct localStorage access.
```
---

## Prompt C2 — AuthContext minimal (token state + login/logout)
```text
Implement AuthContext to centralize auth state.

Create src/auth/AuthContext.tsx:
- Provides: token, isAuthenticated, login(token), logout()
- login(token): sets token in state and storage
- logout(): clears token in state and storage

Add src/auth/useAuth.ts convenience hook.

Wire:
- Wrap <Router /> in <AuthProvider> in App.tsx.
- Update ProtectedRoute to use AuthContext (isAuthenticated) instead of storage directly.

Testing:
- Add a small test that renders a component inside AuthProvider and verifies login() flips isAuthenticated to true.
- Add a test that logout() clears token and flips isAuthenticated to false.

No orphan context: it must be used by ProtectedRoute.
```
---

## Prompt C3 — ProtectedRoute uses AuthContext + redirect tests
```text
Refine ProtectedRoute to rely fully on AuthContext.

Requirements:
- If !isAuthenticated => <Navigate to="/login" replace />
- If authenticated => render protected content

Testing:
- Update/keep existing routing tests to confirm behavior still works when token is set via storage before render (AuthProvider should initialize from storage).

Implementation detail:
- AuthProvider should initialize token state from getToken() at startup.
```
---

## Prompt C4 — Add /auth/me bootstrap (token present)
```text
Implement “bootstrap current user” when a token exists.

Create minimal user model:
- In AuthContext, add `me` state (username, bio?, profile_picture?).
- On mount, if token exists, call GET /auth/me (using a temporary fetch for now; apiFetch will come later).
- If success, set me.
- If 401, call logout() and redirect to /login (redirect can be handled by ProtectedRoute after logout).

Testing:
- Use MSW to mock GET {VITE_API_BASE_URL}/auth/me.
- Test: with a token, the call happens and me.username appears somewhere in UI (add a small “Signed in as …” line to a protected placeholder page).
```
---

## Prompt C5 — Test bootstrap success path thoroughly (integration)
```text
Add a focused integration test for bootstrap success.

Test flow:
- Put a token in localStorage before rendering.
- MSW returns { username: "lucas", bio: null, profile_picture: null } for /auth/me.
- Render router at /home.
- Assert Home page renders AND “Signed in as lucas” is visible.

Keep production UI minimal; the goal is verified wiring + coverage.
```
---

## Prompt C6 — Test bootstrap 401 clears token + redirects
```text
Implement and test bootstrap failure.

Requirements:
- If /auth/me returns 401:
  - AuthProvider must call logout() (clears token)
  - App should end up on /login when visiting a protected route

Testing:
- With token in localStorage
- MSW returns 401 for /auth/me
- Render router at /home
- Assert login page is shown and localStorage token is cleared
```
---

# Micro-step set D — API client (4 tiny PRs)

## Prompt D1 — Implement apiFetch base URL + JSON parsing + unit tests
```text
Create src/api/client.ts with apiFetch() wrapper.

Requirements:
- Base URL from import.meta.env.VITE_API_BASE_URL
- apiFetch(path, options):
  - Joins base URL + path
  - Sets "Content-Type: application/json" when body exists
  - JSON stringifies body automatically
  - Parses JSON responses
  - Returns parsed JSON for 2xx
  - Throws a typed error for non-2xx

Testing (unit tests):
- Mock global fetch and assert:
  - It calls the right URL
  - It JSON stringifies bodies
  - It parses JSON responses correctly
```
---

## Prompt D2 — Add Authorization header injection + unit test
```text
Enhance apiFetch to automatically attach Authorization header.

Requirements:
- Read token via getToken() (storage util)
- If token exists, add header: Authorization: Bearer <token>

Testing:
- Unit test verifies Authorization header is present when token is set.
- Unit test verifies it is absent when no token exists.
```
---

## Prompt D3 — Standardize error parsing for 400/403/404/409 + tests
```text
Standardize apiFetch errors.

Requirements:
- Define ApiError type:
  - status: number
  - message: string (best-effort: from JSON {detail|message}, else fallback)
- For non-2xx responses, throw ApiError.
- Keep it consistent across all status codes.

Testing:
- Unit tests for a 400 JSON error response
- Unit tests for a 404 non-JSON response fallback message
```
---

## Prompt D4 — Global 401 handling hook (logout callback) + tests
```text
Implement global 401 handling without circular imports.

Design:
- apiFetch accepts an optional configuration set once:
  - setApiUnauthorizedHandler(fn: () => void)
- If a response is 401, call the handler (if set), then throw ApiError.

Wire:
- In AuthProvider, set the unauthorized handler to call logout().
- Replace the temporary fetch in AuthProvider’s /auth/me with apiFetch.

Testing:
- Unit test apiFetch calls handler on 401.
- Integration test: token present + /auth/me returns 401 -> logout happens -> /home redirects to /login (reuse earlier tests).
```
---

# Micro-step set E — Auth pages (6 tiny PRs)

## Prompt E1 — Register UI + confirm password validation test
```text
Implement RegisterPage UI with client-side validation first.

UI requirements (minimal):
- username input
- password input
- confirm password input
- helper text for password rules (8 chars + uppercase/lowercase/digit)
- submit button

Validation:
- If confirm != password, show inline error and do not submit.

Testing:
- Render RegisterPage
- Type mismatched passwords
- Click submit
- Assert inline error appears

No API call in this step.
```
---

## Prompt E2 — Register API wiring + success redirect test
```text
Wire RegisterPage to POST /auth/register using apiFetch.

Requirements:
- On submit, call apiFetch("/auth/register", { method: "POST", body: { username, password } })
- On success: show “Account created” (can be a simple message) and navigate to /login
- On 409: show “Username already taken” inline

Testing (MSW):
- Success: mock 200 and assert navigation to /login
- Conflict: mock 409 and assert error message is shown

Make sure the page still passes validation tests from E1.
```
---

## Prompt E3 — Login UI + render test
```text
Implement LoginPage UI only.

UI:
- username input
- password input
- submit button
- place for inline error

Testing:
- Render LoginPage
- Assert fields and submit button exist

No API call in this step.
```
---

## Prompt E4 — Login API wiring + token storage test
```text
Wire LoginPage to POST /auth/login.

Assume backend returns JSON containing a token (e.g., { token: "..." }). If backend uses a different key, handle both {token} and {access_token} defensively.

On success:
- call auth.login(token)
- navigate to /home

Testing (MSW):
- Mock /auth/login success returns token
- Assert token stored (getToken() returns it)
- Assert route is /home

On failure (401):
- Show inline “Invalid username/password” message.
- Test this case.
```
---

## Prompt E5 — Login + /auth/me integration test (me is stored)
```text
Refine login flow to fetch /auth/me after login and store `me` in AuthContext.

Implementation:
- After login(), call apiFetch("/auth/me")
- Store result as me
- Then navigate to /home

Testing:
- MSW: /auth/login returns token; /auth/me returns {username:"lucas"...}
- Assert “Signed in as lucas” appears on /home
```
---

## Prompt E6 — Login failure UX + regression tests
```text
Improve inline error handling without adding complexity.

Requirements:
- Clear prior errors when user edits inputs again
- Disable submit while request in flight (optional)
- Ensure all prior tests still pass

Add one test:
- After a failed login, typing into username clears the error message.
```
---

# Micro-step set F — AppShell + logout (5 tiny PRs)

## Prompt F1 — AppShell layout skeleton with nav links
```text
Implement AppShell layout for protected routes.

Requirements:
- Create src/layout/AppShell.tsx
- Left nav links:
  - Home (/home)
  - Compose (/compose)
  - My Profile (/profile)
  - Logout button (no behavior yet)
- Render an <Outlet /> for main content

Wire:
- In Router.tsx, nest all protected routes under AppShell.

Testing:
- With token + /home, assert nav links are present in DOM.
```
---

## Prompt F2 — Ensure AppShell wraps all protected pages
```text
Ensure every protected route uses AppShell consistently.

Testing:
- Render router at /home, /compose, /profile with auth.
- Assert AppShell nav exists on each page.

Keep it minimal: just expand tests and fix route nesting if needed.
```
---

## Prompt F3 — Implement logout button behavior
```text
Implement logout button in AppShell.

Behavior:
- Best-effort call POST /auth/logout (ignore errors)
- Then auth.logout()
- Navigate to /login

Testing (MSW):
- With auth enabled, render /home, click Logout
- Assert the login page is shown and token cleared

Ensure no dangling promises in tests.
```
---

## Prompt F4 — Navigation link wiring (click-through tests)
```text
Add tests that click through the nav links.

Testing:
- Starting at /home, click Compose -> /compose page heading visible
- Click My Profile -> /profile page heading visible
- Click Home -> /home page heading visible

Keep UI simple; focus on robust navigation behavior.
```
---

## Prompt F5 — Regression pass: nav exists everywhere protected
```text
Add one regression test that iterates through a list of protected paths and asserts AppShell nav appears.

Paths:
- /home, /compose, /profile, /u/testuser, /tweet/1/reply, /tweet/1/replies

This directly supports the requirement that navigation is present from every in-app page.
```
---

# Micro-step set G — Feed + TweetCard (9 tiny PRs)

## Prompt G1 — TweetCard read-only renders tweet text/author
```text
Create a TweetCard component (read-only first).

Requirements:
- src/components/TweetCard.tsx
- Props: tweet { id, author_username, text }
- Render author as a clickable element (link later), and render text.

Testing:
- Unit test renders author and text.
- No API calls, no router navigation yet.
```
---

## Prompt G2 — HomeFeedPage fetches /feed and renders list (MSW)
```text
Implement HomeFeedPage to fetch feed and render TweetCards.

Requirements:
- On mount, call apiFetch("/feed?limit=20&offset=0")
- Render list of TweetCard for each returned tweet.
- Show a loading state while fetching.
- If empty list, show “No tweets yet” message.

Testing:
- MSW mock GET /feed returns 2 tweets
- Assert two TweetCards render
- Test loading state briefly (can assert “Loading…” appears then disappears)
```
---

## Prompt G3 — Empty state test
```text
Add test for empty feed.

Testing:
- MSW returns []
- Assert “No tweets yet” is displayed

Keep implementation minimal; no new features.
```
---

## Prompt G4 — Refresh button + test
```text
Add a Refresh button to HomeFeedPage that re-fetches the first page.

Requirements:
- Button labeled “Refresh”
- Clicking triggers apiFetch again with offset=0 and replaces list (not append)

Testing:
- MSW: first call returns tweet A, second call returns tweet B
- Click Refresh
- Assert tweet B appears and tweet A no longer appears
```
---

## Prompt G5 — Load more pagination + append test
```text
Add “Load more” pagination behavior to HomeFeedPage.

Requirements:
- Maintain offset state (0, 20, 40, …)
- “Load more” calls /feed?limit=20&offset=<next>
- Append results to the existing list

Testing:
- MSW: offset=0 returns [A], offset=20 returns [B]
- Click Load more
- Assert both A and B are visible
```
---

## Prompt G6 — Author click navigation + test
```text
Wire TweetCard author click to navigate to /u/:username.

Implementation:
- Use <Link to={`/u/${author_username}`}> or useNavigate

Testing:
- Render HomeFeedPage with one tweet by "alice"
- Click "alice"
- Assert UserProfilePage renders and includes "alice" on screen
```
---

## Prompt G7 — Like toggle + optimistic UI + test
```text
Add Like/Unlike button to TweetCard.

Requirements:
- Show a Like button
- When clicked:
  - Optimistically toggle likedByMe boolean in UI state
  - Call POST /tweets/:id/like if now liked
  - Call DELETE /tweets/:id/like if now unliked
- If API call fails, rollback UI and show a small inline error (no toast system needed yet).

Testing (MSW):
- Like success: click Like -> endpoint called, UI indicates liked
- Unlike success: click again -> delete endpoint called, UI indicates not liked
- Failure case: mock 500 -> UI rolls back and shows error message
```
---

## Prompt G8 — Retweet toggle + optimistic UI + test
```text
Add Retweet/Unretweet toggle to TweetCard.

Requirements:
- Button “Retweet” toggles retweetedByMe
- POST /tweets/:id/retweet when toggling on
- DELETE /tweets/:id/retweet when toggling off
- Optimistic UI + rollback on failure

Testing:
- Similar to Like tests: success + failure rollback
```
---

## Prompt G9 — Delete button for own tweets + tests
```text
Add Delete button to TweetCard that only appears for the tweet author.

Requirements:
- Compare tweet.author_username to auth.me.username
- If equal, show Delete button
- On click:
  - Call DELETE /tweets/:id
  - On success, remove tweet from list in HomeFeedPage (pass a callback or manage via parent)
  - On 403/404, show inline error

Testing:
- When me.username == author, Delete visible
- Clicking Delete calls endpoint and removes tweet from DOM
- When me.username != author, Delete not visible
```
---

# Micro-step set H — Compose + Profiles (8 tiny PRs)

## Prompt H1 — Compose page UI + 240-char enforcement test
```text
Implement PostTweetPage (/compose) UI only.

Requirements:
- Textarea
- Character counter “X/240”
- Disable submit when text length is 0 or > 240 (240 max per spec)
- Inline error when >240 (optional)

Testing:
- Type 241 chars -> submit disabled and error shows
- Type 240 chars -> submit enabled
```
---

## Prompt H2 — Compose submit posts tweet + routes home test
```text
Wire PostTweetPage to POST /tweets using apiFetch.

Behavior:
- On submit success: navigate to /home and refresh feed (simple approach: navigate then HomeFeed fetch on mount is enough)
- On 400: show inline validation error

Testing (MSW):
- Mock POST /tweets success and assert navigation to /home
- Mock 400 and assert error appears
```
---

## Prompt H3 — MyProfilePage renders me + test
```text
Implement MyProfilePage (/profile) read-only display of current user.

Requirements:
- Show username, bio (or “No bio”), profile picture if present (or placeholder)
- Uses auth.me

Testing:
- With MSW /auth/me returning username "lucas", render /profile and assert it displays lucas and placeholder bio text.
```
---

## Prompt H4 — Edit profile form submits PATCH + test
```text
Add an edit profile form to MyProfilePage.

Requirements:
- Inputs for bio, username, profile_picture (URL string)
- Submit calls PATCH /users/me with changed fields
- On success, update auth.me locally to reflect changes

Testing (MSW):
- Mock PATCH success returning updated user
- Change bio and submit
- Assert updated bio shows on screen
```
---

## Prompt H5 — UserProfilePage renders username param + test
```text
Implement UserProfilePage (/u/:username) base UI.

Requirements:
- Read :username param
- Render header “Profile: {username}”
- For now, show placeholder “Tweets coming soon”

Testing:
- Render router at /u/alice with auth and assert “Profile: alice” is visible.
```
---

## Prompt H6 — Follow/unfollow toggle + test
```text
Add Follow/Unfollow button to UserProfilePage.

Requirements:
- Button toggles between “Follow” and “Unfollow” based on local state
- POST /users/:username/follow when following
- DELETE /users/:username/follow when unfollowing
- Handle 400/403/404 with inline error

Testing (MSW):
- Follow success toggles UI and calls endpoint
- Unfollow success toggles back and calls endpoint
```
---

## Prompt H7 — Block/unblock toggle + test
```text
Add Block/Unblock button to UserProfilePage.

Requirements:
- POST /users/:username/block and DELETE /users/:username/block
- If blocked, hide follow button (optional) and show message “You blocked this user.”
- Handle 403 by showing “Action not allowed”

Testing:
- Block success shows blocked message
- Unblock success removes blocked message
```
---

## Prompt H8 — 403/404 states tests (profile visibility)
```text
Add explicit UI for 403/404 on UserProfilePage actions and/or profile visibility.

Requirements:
- If an action call returns 403: show “Action not allowed”
- If 404: show “User not found”

Testing:
- MSW returns 404 for follow -> “User not found” appears
- MSW returns 403 for block -> “Action not allowed” appears
```
---

# Micro-step set I — Replies + idle timeout + coverage (7 tiny PRs)

## Prompt I1 — repliesStore util + unit tests
```text
Implement client-side replies store in localStorage.

Create src/storage/repliesStore.ts:
- getReplies(tweetId: string): Reply[]
- addReply(tweetId: string, reply: Reply): void
Where Reply includes:
- id (string)
- author_username (string)
- text (string)
- created_at (string ISO)

Testing:
- Unit tests for add/get behaviors and isolation by tweetId.
```
---

## Prompt I2 — PostReplyPage saves reply + test
```text
Implement PostReplyPage (/tweet/:tweetId/reply).

Requirements:
- Read tweetId from params
- Textarea + counter (same 240 char limit)
- On submit:
  - Save reply to repliesStore under tweetId
  - Navigate to /tweet/:tweetId/replies
- Show a minimal “original tweet” placeholder card (can be just tweetId for now)

Testing:
- Render /tweet/1/reply
- Enter reply text, submit
- Assert navigation to /tweet/1/replies and the reply appears there (you can implement RepliesPage minimally or mock it for this step, but no orphan code—prefer implementing RepliesPage too if needed for the test).
```
---

## Prompt I3 — RepliesPage reads store + renders list + test
```text
Implement RepliesPage (/tweet/:tweetId/replies).

Requirements:
- Read tweetId param
- Render list of replies from repliesStore(tweetId)
- Include “Reply” button linking back to /tweet/:tweetId/reply
- Include minimal original tweet placeholder

Testing:
- Pre-seed repliesStore with 2 replies for tweetId=1
- Render /tweet/1/replies and assert both replies show
- Click “Reply” button and assert it navigates to /tweet/1/reply
```
---

## Prompt I4 — Wire TweetCard “Reply” + “View replies” buttons + tests
```text
Add “Reply” and “View replies” buttons to TweetCard and wire to routes.

Requirements:
- Reply button navigates to /tweet/:id/reply
- View replies navigates to /tweet/:id/replies

Testing:
- Render a TweetCard in HomeFeed
- Click Reply -> PostReplyPage visible
- Click View replies -> RepliesPage visible
```
---

## Prompt I5 — Implement IdleTimerProvider timer logic
```text
Implement required inactivity timeout logout behavior.

Create src/auth/IdleTimerProvider.tsx:
- Listens to events: mousemove, keydown, scroll, click, touchstart
- Tracks last activity; throttles storage updates (1 per 5s)
- If idle for 15 minutes (configurable constant), perform logout:
  - Best-effort POST /auth/logout
  - auth.logout()
  - Navigate to /login (or rely on ProtectedRoute redirect after logout)

Wire:
- Wrap the protected app tree (AppShell/Router) with IdleTimerProvider, so it applies across all in-app pages.

No tests yet in this step; keep implementation small and isolated.
```
---

## Prompt I6 — Fake timers test: idle triggers logout + redirect
```text
Add a robust test for IdleTimerProvider using Jest fake timers.

Test scenario:
- Seed token + me so user is authenticated
- Render /home inside IdleTimerProvider
- Use jest.useFakeTimers()
- Advance time by 15 minutes without firing activity events
- Assert user is logged out and login page is shown (or isAuthenticated false + ProtectedRoute redirect)

Also add a test:
- Fire a mousemove event before 15 minutes and ensure it resets the timer.

Keep test deterministic and avoid flakiness.
```
---

## Prompt I7 — Coverage push to ≥60% (target router/auth/apiFetch/tweetcard)
```text
Run `npm run test:coverage` and push overall “All files” coverage to at least 60%.

Strategy:
- Identify lowest-covered important modules:
  - Router.tsx / ProtectedRoute.tsx
  - AuthContext.tsx / IdleTimerProvider.tsx
  - api/client.ts
  - TweetCard.tsx
- Add focused tests that cover key branches:
  - ProtectedRoute redirects when not authenticated
  - apiFetch error parsing branches (400/404/401)
  - TweetCard rollback branches on failed like/retweet
  - Logout best-effort behavior (logout endpoint failing still clears token)

Constraints:
- Do not add new features. Only add tests and minimal code tweaks required to make code testable (e.g., dependency injection for timeouts).
- End by pasting the coverage summary output into a comment in the repo (or save it in docs/coverage.txt).

Definition of done:
- `npm run test:coverage` passes
- Coverage “All files” line is ≥60% (this is the grading threshold for 10/10 points).
```
---
