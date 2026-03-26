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

## Troubleshooting

See [troubleshooting/auth.md](troubleshooting/auth.md) for symptom/cause/fix reference.
