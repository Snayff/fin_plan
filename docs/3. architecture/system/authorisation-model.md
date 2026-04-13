# Authorisation Model

Three-layer zero-trust authorisation. Every data request passes through all three layers before any response is returned.

## Layer 1: Auth Middleware

Runs as `preHandler` on every protected route (`authMiddleware`).

1. Extract and verify JWT from `Authorization: Bearer <token>` header.
2. Check token JTI against the in-memory blacklist (revoked tokens).
3. Resolve user from database by `userId` from token payload.
4. Resolve `activeHouseholdId` from the user record.
5. **Zero Trust check:** Verify user is still a member of the active household via `Member` table lookup. If membership is gone, clear the stale `activeHouseholdId` and reject.
6. Attach `request.user` (userId, email, name, role) and `request.householdId` to the request.

A lightweight variant (`userOnlyAuth`) skips household resolution for routes that operate outside a household context (e.g. creating or listing households).

**Source:** `apps/backend/src/middleware/auth.middleware.ts`

## Layer 2: Route Handler

1. Validate request body/params/query with Zod schemas.
2. Pass `req.householdId!` (set by middleware) to the service layer.
3. **Never accept `householdId` from URL params or request body for data scoping.** The middleware-resolved value is the only trusted source.

## Layer 3: Service

1. Fetch the target resource by ID.
2. Call `assertOwned(item, householdId, label)` before any mutation. This checks both existence and ownership in a single guard.
3. Wrap mutations in `audited()` with `actorCtx(req)` for audit logging.

**Source:** `apps/backend/src/services/waterfall.service.ts` (pattern used across all services)

## Error Masking

`assertOwned` throws `NotFoundError` for both "not found" and "not owned" cases. This prevents an unauthorised caller from discovering whether a resource exists.

```typescript
function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}
```

Never use `AuthorizationError` for resource ownership checks — that would leak existence information.

## Public Endpoints

These routes do **not** require `authMiddleware`:

- `GET /health` — healthcheck
- `POST /api/auth/register` — registration
- `POST /api/auth/login` — login
- `POST /api/auth/refresh` — token refresh (uses httpOnly cookie, not Bearer)
- `GET /api/auth/csrf-token` — CSRF token issuance

Every other route **must** include `authMiddleware` (or `userOnlyAuth`) in its `preHandler` array.

## Hardening Consideration

Currently, auth middleware is applied per-route via `preHandler`. A global `onRequest` hook that requires explicit opt-out for public routes (allow-list) would prevent accidental unprotected route registration. This is a future improvement — not yet implemented.
