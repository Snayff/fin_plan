# Audit Infrastructure: Implementation Plan

**Source:** [code-architecture-review.md](code-architecture-review.md)
**Scope:** 14 findings across HIGH / MEDIUM / LOW severity. This plan groups them into 7 discrete work packages, ordered by impact and risk.

---

## Work Package 1 — Type-Safety Ratchet

**Findings addressed:** #1 (type-safety opt-out)
**Branch:** `fix/type-safety-ratchet`
**Risk:** Medium (many files touched, but lint + type-check catch regressions)

### Why first

Every other improvement is undermined if `any` can silently bypass validation. This is the single change that raises the quality floor across the entire codebase.

### Tasks

#### 1a. Fix critical `any` usages in backend auth path

These are the security-sensitive escapes that must be typed before the lint rule is tightened.

- **`apps/backend/src/middleware/auth.middleware.ts:28`** — `verifyAccessToken(token) as any`
  - Define a `JwtPayload` interface (or use the one from `jsonwebtoken` types) with `userId`, `jti`, `iat`, `exp` fields
  - Type the return of `verifyAccessToken()` as `JwtPayload`
  - Remove the `|| payload.id || payload.sub` legacy fallback — if old tokens exist, they'll expire within 15 minutes naturally
- **`apps/backend/src/lib/actor-ctx.ts:7-8`** — `(req as any).user!`
  - Use the typed `FastifyRequest` augmentation (already partially declared at `auth.middleware.ts:98-108`)
  - Ensure `request.user` and `request.householdId` are properly typed in the Fastify module augmentation
  - Replace `!` non-null assertions with early-return guards

#### 1b. Fix critical `any` usages in frontend API client

- **`apps/frontend/src/lib/api.ts:223-253`** — `data?: any` on all mutation methods
  - Change signatures to `post<TRes, TReq = unknown>(endpoint: string, data?: TReq, token?: string): Promise<TRes>`
  - Update call sites that currently pass untyped objects — most already know the shape, they just don't declare it

#### 1c. Fix `as any[]` casts in ReviewWizard

- **`apps/frontend/src/components/overview/ReviewWizard.tsx:142-148`** — `return income as any[]`
  - Identify the actual type mismatch (likely different item shapes per tier)
  - Define a `ReviewableItem` union type or shared interface in the component
  - Replace all 4 casts with the proper type

#### 1d. Flip ESLint rule to `warn`

- **`apps/backend/eslint.config.js:10`** — change `'off'` to `'warn'`
- **`apps/frontend/eslint.config.js:18`** — change `'off'` to `'warn'`
- Run `bun run lint` — catalogue remaining warnings
- Fix any remaining warnings that are in auth, API client, or service layers
- Flip to `'error'` once clean

### Verification

```bash
bun run type-check    # zero errors
bun run lint          # zero warnings
cd apps/backend && bun scripts/run-tests.ts   # all pass
```

---

## Work Package 2 — Docker Hardening

**Findings addressed:** #2 (Docker root), #8 (CSRF_SECRET optional)
**Branch:** `fix/docker-hardening`
**Risk:** Low (infra-only, no application logic changes)

### Tasks

#### 2a. Backend Dockerfile — non-root user

- Add after the `COPY` stage and before `EXPOSE`:
  ```dockerfile
  RUN addgroup -g 1001 finplan && adduser -D -u 1001 -G finplan finplan
  RUN chown -R finplan:finplan /workspace
  USER finplan
  ```
- Change `CMD` to only run the server: `CMD ["bun", "src/server.ts"]`

#### 2b. Frontend Dockerfile — non-root nginx

- In the final `nginx:alpine` stage, add:
  ```dockerfile
  COPY --from=builder --chown=nginx:nginx /workspace/apps/frontend/dist /usr/share/nginx/html
  USER nginx
  ```

#### 2c. Separate migration from runtime

- Create `scripts/migrate.sh` in backend:
  ```bash
  #!/bin/sh
  bunx prisma migrate deploy
  ```
- In `docker-compose.yml` (prod), add a one-shot `migrate` service that runs before backend starts, using `depends_on` with `service_completed_successfully`
- Remove `prisma migrate deploy` and `bun src/db/seed.ts` from backend CMD entirely

#### 2d. Make CSRF_SECRET mandatory in production

- **`apps/backend/src/config/env.ts`** — change `CSRF_SECRET` from `.optional()` to required, or add a `.refine()` that requires it when `NODE_ENV === 'production'`

### Verification

```bash
docker compose -f docker-compose.yml config   # valid config
docker compose up -d                           # starts without errors
docker exec finplan-backend whoami             # should NOT be "root"
docker exec finplan-frontend whoami            # should NOT be "root"
```

---

## Work Package 3 — Database Indexes

**Findings addressed:** #3 (missing waterfall indexes)
**Branch:** `fix/waterfall-indexes`
**Risk:** Very low (additive schema change, no data migration)

### Tasks

#### 3a. Add indexes to waterfall models

In `apps/backend/prisma/schema.prisma`, add `@@index([householdId])` to:

- `IncomeSource`
- `CommittedItem`
- `DiscretionaryItem`

#### 3b. Create and apply migration

```bash
cd apps/backend
bun run db:migrate    # name: "add_waterfall_household_indexes"
```

### Verification

```bash
bunx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations ./prisma/migrations
# should show empty diff (migration matches schema)

cd apps/backend && bun scripts/run-tests.ts   # all pass
```

---

## Work Package 4 — Auth Message Hardening

**Findings addressed:** #4 (registration enumeration), #6 (console logging), #9 (audit PII)
**Branch:** `fix/auth-hardening`
**Risk:** Low (string changes + guard additions)

### Tasks

#### 4a. Fix registration enumeration

- **`apps/backend/src/services/auth.service.ts:82`** — change `"User with this email already exists"` to `"Registration could not be completed. Please try again or log in."`

#### 4b. Guard frontend console calls

Add `import.meta.env.DEV &&` before each:

- `ErrorBoundary.tsx:24` — `console.error("ErrorBoundary caught:", ...)`
- `api.ts:200` — `console.error("Token refresh failed:", ...)`
- `authStore.ts:84` — `console.warn("[auth] Unexpected error...", ...)`
- `authStore.ts:145` — `console.error("Logout error:", ...)`

#### 4c. Audit log field denylist

- In `apps/backend/src/services/audit.service.ts`, in the `computeDiff()` function (lines 45-76):
  - Add a `REDACTED_FIELDS` set: `new Set(['password', 'passwordHash', 'email', 'token', 'refreshToken', 'notes'])`
  - Before including a field in the diff, check against the set and skip or replace with `"[REDACTED]"`

### Verification

```bash
bun run lint
bun run type-check
cd apps/backend && bun scripts/run-tests.ts
# Manual: attempt registration with existing email — should get generic message
```

---

## Work Package 5 — Rate Limiting + Env Validation

**Findings addressed:** #5 (waterfall rate limits), #8 (CSRF_SECRET — shared with WP2)
**Branch:** `fix/rate-limiting`
**Risk:** Very low (config additions)

### Tasks

#### 5a. Add rate limits to waterfall mutation routes

In `apps/backend/src/routes/waterfall.routes.ts`, add `config` block to all POST/PATCH/DELETE endpoints:

```typescript
config: { rateLimit: { max: 30, timeWindow: "15 minutes" } }
```

This applies to:

- POST (create) endpoints for income, committed, discretionary items
- PATCH (update) endpoints
- DELETE endpoints
- POST/PATCH/DELETE for periods

Leave GET (read) endpoints on the global limit — reads are cheap.

### Verification

```bash
cd apps/backend && bun scripts/run-tests.ts   # rate limit config doesn't break tests
# Manual: verify rate limit headers appear in responses (X-RateLimit-Limit, X-RateLimit-Remaining)
```

---

## Work Package 6 — Dependency Cleanup

**Findings addressed:** #7 (RxDB dead dependency)
**Branch:** `chore/remove-rxdb`
**Risk:** Very low (removal only)

### Tasks

#### 6a. Remove RxDB

```bash
cd apps/frontend && bun remove rxdb
```

Confirm no imports reference it (already verified: zero usages).

### Verification

```bash
bun run build         # frontend builds without rxdb
bun run type-check    # no type errors
```

---

## Work Package 7 — Architecture Documentation

**Findings addressed:** Patterns to document (from review section)
**Branch:** `docs/architecture-patterns`
**Risk:** None (docs only)

### Tasks

Write the following new docs in `docs/3. architecture/`:

#### 7a. `authorisation-model.md`

Document the 3-layer zero-trust model:

- Layer 1: auth middleware (token + blacklist + membership)
- Layer 2: route handler (Zod + householdId passthrough)
- Layer 3: service (ownership assertion + audit)
- householdId rule: always server-resolved, never from URL params
- Error masking: NotFoundError for both "not found" and "not owned"
- New route rule: must include authMiddleware unless explicitly public
- Public endpoint allow-list

#### 7b. `error-handling.md`

Document:

- Always throw AppError subclasses, never inline `reply.status().send()`
- Error class hierarchy with status codes
- Production vs development response behaviour
- Auth message rule: all login/register failures must be generic

#### 7c. `audit-logging.md`

Document:

- Every mutation wrapped in `audited()` with `actorCtx(req)`
- Field denylist for PII
- Retention policy (90 days)

#### 7d. `data-privacy.md`

Document:

- PII inventory
- Storage rules (hashing, no plaintext)
- Logging rules (never log PII, use userId)
- Cookie policy

#### 7e. `type-safety-policy.md`

Document:

- ESLint `no-explicit-any: 'error'` target
- Shared schema consumption pattern
- No `as any` escapes rule
- Non-null assertion guidance

#### 7f. Update `CLAUDE.md`

Add a Security Conventions section:

```
- Auth middleware required on every new route unless explicitly public
- householdId from middleware only — never from URL params for data scoping
- Throw, don't inline errors — use error class hierarchy
- Audit all mutations via audited() with actorCtx(req)
- No any in security paths — auth middleware, token handling, API client must be fully typed
- Generic auth messages — never reveal whether an account exists
```

### Verification

- Docs are well-formed markdown
- CLAUDE.md conventions section doesn't duplicate existing content
- `bun run lint` still passes (no code changes)

---

## Sequencing

```
WP3 (indexes)  ─────────────────────┐
WP6 (remove rxdb) ──────────────────┤
WP7 (docs) ─────────────────────────┤── can all run in parallel
WP5 (rate limits) ──────────────────┘
WP4 (auth hardening) ───────────────── independent, small
WP2 (docker) ───────────────────────── independent, infra-only
WP1 (type-safety) ─────────────────── largest, do last (or first if preferred)
```

WP1 is the highest-impact but also the most files touched. All other WPs are small, independent, and low-risk — they can be done in any order or in parallel.

---

## Out of Scope (deferred)

These items from the review are acknowledged but not planned for this round:

| Item                            | Reason deferred                                                         |
| ------------------------------- | ----------------------------------------------------------------------- |
| Token blacklist → Redis         | Not needed at current scale (single instance, 15-min TTL)               |
| ReviewWizard split (570 lines)  | Functional as-is; maintainability improvement, not a defect             |
| ItemArea/AssetItemArea dedup    | Style improvement, not urgent                                           |
| Pre-commit hooks                | CI catches issues; nice-to-have for DX                                  |
| CI deploy step hardening        | Covered separately by `ci-self-hosted-runner` plan                      |
| TS project references           | Turbo handles build graph; nice-to-have for IDE experience              |
| Integration tests               | Valuable but a separate initiative; current unit coverage is deliberate |
| Bidirectional schema validation | Architectural improvement for a future data-layer refactor              |
| ADRs                            | Can be written incrementally as decisions are revisited                 |
