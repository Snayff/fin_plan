# Auth Troubleshooting

See [auth-session-lifecycle.md](../auth-session-lifecycle.md) for the session policy and security model.

## Symptom: redirected to login on page refresh

Likely cause: startup bootstrap failed (`/api/auth/refresh` or `/api/auth/me` failed), or refresh cookie missing/blocked.

Checks:

1. Confirm cookie path `/api/auth/refresh` and browser cookie settings
2. Confirm frontend sends `credentials: include`
3. Confirm `CORS_ORIGIN` matches frontend origin

## Symptom: remember me appears ignored

Likely cause: login payload missing `rememberMe: true` or cookie blocked by browser policy.

Checks:

1. Verify request payload in network tab — confirm `rememberMe: true` is present
2. Verify response `Set-Cookie` has `maxAge` when remember me is true

## Symptom: user randomly logged out before expected session expiry

Session policy: 7-day idle timeout, 30-day absolute cap. Either may apply.

Checks:

1. Check `expires_at` and `session_expires_at` on the refresh token row in the DB
2. Confirm `JWT_REFRESH_EXPIRES_IN=7d` and `JWT_EXPIRES_IN=15m` in backend env
3. Confirm token rotation is working — each refresh should issue a new token and revoke the old one
