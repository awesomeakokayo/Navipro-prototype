# NaviProAI — Prototype

Short overview
- Static frontend prototype for NaviProAI screens (Login, Dashboard, Onboarding, Course Recommendation, etc.).
- Frontend expects a backend at: `https://naviproai-1.onrender.com`.
- Pages are plain HTML/CSS/JS. Use a static server (or VS Code Live Server) to test locally.


Quick start (local)
1. Open a terminal in the `Prototype` folder.
2. Run a simple server:
   - Python 3: `python -m http.server 3000`
   - Or use VS Code Live Server.
3. Open pages in browser, e.g. `http://localhost:3000/login/index.html`.


Project layout
- /login
  - index.html — login page
  - script.js — login form handling; Google button; fragment handoff for dashboard
  - auth.js — helpers: isAuthenticated(), verifyToken(), requireAuth()
  - config.js — sets `window.backendURL = https://naviproai-1.onrender.com`
  - callback.html — OAuth callback (debug-friendly)
  - style.css, Images/
- /Dashboard
  - index.html, script.js — dashboard UI; initializeUserSession(), consumeAuthFragment()
  - style.css, Images/
- /Create Account
  - index.html, script.js, config.js, style.css, Images/
- /Course Recommendation
  - index.html, script.js — listens for postMessage from Dashboard; fallback fetch
  - style.css, Images/
- /onboarding
  - index.html, script.js, style.css, Images/
- /roadmap
  - index.html, script.js, style.css, Images/
- /Navi
  - index.html, script.js, style.css, Images/
- /Account Verification, /Verify Email, /Forgot Password
  - index.html, script.js (when present), style.css, Images/


Auth summary (current behavior)
- Backend issues JWT and on Google login sets an httpOnly cookie:
  - Controller: sets `res.cookie('jwt', result.access_token, { httpOnly: true, secure, sameSite })` then redirects.
- Frontend tries to store tokens in localStorage when available (keys used across app: `token`, `access_token`, `jwt`).
- Frontend also stores user id in localStorage (`user_id`, `userId`).
- If backend returns only `user_id` (and uses httpOnly cookie for token), frontend must call `/auth/me` with `credentials: 'include'` to recover authenticated session or backend must include `user_id` in redirect.


Why login can redirect back to login page
- Dashboard/auth code requires a bearer token for protected endpoints.
- If callback supplies `user_id` but no token in localStorage (token was set only as httpOnly cookie), frontend sees `{hasToken: false, hasUserId: true}` and may redirect to login.
- Two safe fixes:
  1. Backend: append `?user_id=<id>` to the frontend redirect so callback can persist user id; frontend then calls `/auth/me` with `credentials:'include'` to finish recovery (recommended).
  2. Frontend: make `verifyToken()` tolerant — if `user_id` exists but no token, call `/auth/me` with credentials included once to recover token or treat cookie-based session as valid.


Recommended backend change (example)
- Append user id to redirect after OAuth callback:
```ts
const redirectWithId = `${result.redirectUrl}?user_id=${encodeURIComponent(result.user._id)}`;
res.cookie('jwt', result.access_token, { httpOnly: true, secure: true, sameSite: 'none' });
res.redirect(redirectWithId);
```
- Ensure SameSite/CORS settings allow cookie to be sent on the cross-site redirect if frontend is on a different origin.


Frontend callback flow (what `login/callback.html` should do)
- Parse query params and hash fragment, extract `access_token` and `user_id` (or `token`/`jwt`).
- Store token under `token`, `access_token`, `jwt` when present.
- Store user id under `user_id`, `userId` when present.
- If token missing but user_id present, call `/auth/me` with `credentials: 'include'` to obtain user info and token (persist if provided).
- Redirect to dashboard using `location.replace()` to avoid keeping token in history.


Debugging checklist
- On callback page, copy `window.location.href` and parsed query/hash params.
- On callback page, confirm localStorage snapshot:
  - token: localStorage.getItem('token')
  - user_id: localStorage.getItem('user_id')
- On Dashboard, run in console:
```javascript
console.log({
  token: localStorage.getItem('token'),
  access_token: localStorage.getItem('access_token'),
  jwt: localStorage.getItem('jwt'),
  user_id: localStorage.getItem('user_id'),
  userId: localStorage.getItem('userId')
});
```
- If only `user_id` exists:
  - Check network tab for `/auth/me` requests and response status/body.
  - If cookie used, ensure `fetch('/auth/me', { credentials: 'include' })` returns user data.


Temporary frontend fallback (if backend cannot be changed immediately)
- Update `auth.verifyToken()` to:
  - If token present → verify by bearer `/auth/me`.
  - Else if user_id present → call `/auth/me` with `credentials:'include'`; if returns user data (or token) persist them and allow session.
  - If `/auth/me` fails with network/TLS errors, treat as transient and retry rather than immediate logout.
  

Video recommendations integration
- Dashboard posts `{ type: 'weeklyVideos', videos: [...] }` to Course Recommendation iframe via `postMessage`.
- Course Recommendation page listens for the message and renders videos; fallback: fetch own recommendations after 1.5s.

Security notes
- Prefer httpOnly cookies for tokens in production to prevent XSS leak.
- If token must be exposed to JS (temporary), prefer fragment (#access_token=...) over query param. Removing tokens from URL history via `history.replaceState` or `location.replace()` is important.
- Never paste real tokens into public forums.

Useful dev commands
- Serve prototype locally:
  - Python: `python -m http.server 3000`
  - Node (http-server): `npx http-server -p 3000`
- In browser console:
  - Check auth state: `auth.isAuthenticated()` and `await auth.verifyToken()` (if `auth` exposed globally)
  - LocalStorage snapshot (see snippet above).

If you want me to:
- Create or patch `README.md` files per folder (I can add them now).
- Patch `login/callback.html` to implement the robust debug + extraction flow and auto-call `/auth/me`.
- Patch `auth.js` to try cookie-based `/auth/me` when token missing.

Contact / Next step
- If you provide callback page console logs (redirect URL, parsed params, /auth/me response), I will produce precise edits to `callback.html` and `auth.js` to make Google login consistently persist `user_id` and token.