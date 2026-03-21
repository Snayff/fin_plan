# Token Refresh and Session Lifecycle Guide

## Overview

The authentication flow keeps users signed in across page refreshes while enforcing secure session boundaries.

Current policy:

1. Access token lifetime: `15 minutes` (default).
2. Sliding idle session timeout: `7 days`.
3. Absolute session cap: `30 days` from login/register.
4. `Remember me` controls cookie persistence across browser restarts.

## Security Model

1. Access tokens are stored in memory only (Zustand state).
2. Refresh tokens are stored in an httpOnly cookie and never exposed to JavaScript.
3. Refresh token rotation is enabled on every `/api/auth/refresh` call.
4. Reuse detection revokes the full token family if a revoked refresh token is reused.

## Startup Auth Bootstrap (Fixes Refresh Logout)

On app load:

1. Frontend enters `authStatus = initializing`.
2. App calls `initializeAuth()` once.
3. `initializeAuth()` calls `/api/auth/refresh` (cookie-based).
4. If refresh succeeds, frontend calls `/api/auth/me` with the new access token.
5. Store transitions to `authenticated`.
6. If refresh fails, store transitions to `unauthenticated`.

While `authStatus = initializing`, the router shows a neutral loading screen and does not redirect to `/login`.

## Remember Me Behavior

Login supports:

```json
{
  "email": "user@example.com",
  "password": "your-password",
  "rememberMe": true
}
```

Behavior:

1. `rememberMe = false` (default): refresh cookie is a session cookie (clears on browser close).
2. `rememberMe = true`: refresh cookie is persistent with `maxAge` bounded by the remaining allowed session lifetime.

## Refresh Token Lifecycle Rules

For each refresh token row:

1. `expires_at`: sliding idle timeout boundary.
2. `session_expires_at`: absolute session boundary.
3. `remember_me`: cookie persistence preference.

On refresh:

1. Reject if token is revoked.
2. Reject if token is idle-expired (`expires_at < now`).
3. Reject if token exceeds absolute cap (`session_expires_at < now`).
4. Revoke old token.
5. Issue new access + refresh token.
6. Set new `expires_at = min(now + 7 days, session_expires_at)`.
7. Keep same `session_expires_at` and `remember_me`.

## Environment Configuration

```env
# apps/backend/.env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Notes:

1. JWT refresh expiry remains `7d` by default.
2. Database/session checks enforce absolute cap independently.
3. Cookie `secure` is enabled in production.

## Manual Verification Scenarios

### 1) Page refresh persistence

1. Login successfully.
2. Navigate to `/dashboard`.
3. Hard refresh browser.
4. Expected: user remains authenticated and stays in app.

### 2) Remember me unchecked

1. Login with `Remember me` unchecked.
2. Close browser completely.
3. Reopen app.
4. Expected: user must login again.

### 3) Remember me checked

1. Login with `Remember me` checked.
2. Close browser completely.
3. Reopen app before 7 days idle and before 30 days absolute.
4. Expected: user remains logged in.

### 4) Idle timeout

1. Login and do not use app for >7 days.
2. Return and trigger any API call.
3. Expected: refresh fails and user is redirected to login.

### 5) Absolute cap

1. Keep using app regularly for >30 days from initial login.
2. Trigger refresh after cap is reached.
3. Expected: forced re-authentication.

## Troubleshooting

### Symptom: redirected to login on refresh

Likely cause: startup bootstrap failed (`/api/auth/refresh` or `/api/auth/me` failed), or refresh cookie missing/blocked.

Checks:

1. Confirm cookie path `/api/auth/refresh` and browser cookie settings.
2. Confirm frontend sends `credentials: include`.
3. Confirm `CORS_ORIGIN` matches frontend origin.

### Symptom: remember me appears ignored

Likely cause: login payload missing `rememberMe: true` or cookie blocked by browser policy.

Checks:

1. Verify request payload in network tab.
2. Verify response `Set-Cookie` has `maxAge` when remember me is true.

## Summary

The system now supports:

1. Reliable auth persistence across refresh.
2. Memory-only access tokens.
3. HttpOnly refresh cookie persistence with optional remember-me.
4. Sliding idle timeout and absolute session cap.
