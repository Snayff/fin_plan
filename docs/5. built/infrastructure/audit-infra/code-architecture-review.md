# finplan — Code & Architecture Review

**Dates:** 2026-04-08 (initial audit), 2026-04-09 (verification & corrections)
**Scope:** Code quality, architectural design, implementation patterns, security, privacy.
**Out of scope:** UX, features, product decisions.
**Method:** Three parallel agents analysed backend, frontend, and shared/infra/tooling. A second pass verified every critical claim against the actual codebase, correcting overblown findings and identifying unacknowledged strengths.

---

## Overall Score: **7.1 / 10**

A modern TypeScript monorepo with strong foundational instincts — Zod-everywhere, JWT rotation with family tracking, 3-layer zero-trust auth, 100% audit-logged mutations, custom per-file test isolation. The architecture is sound and the security posture is better than it first appeared. The main drag is **type-safety escape hatches** (`no-explicit-any: 'off'` in both apps) that undermine the discipline the rest of the system tries to enforce, plus infrastructure gaps in Docker and database indexing.

---

## Scorecard

### Backend (Fastify + Prisma + JWT + Redis)

| Area                    | Score   | Headline                                                                      |
| ----------------------- | ------- | ----------------------------------------------------------------------------- |
| Architecture & layering | **7.5** | Clean 3-layer separation with distributed zero-trust auth                     |
| Security                | **7.5** | Robust auth model; server-resolved householdId; error masking; token rotation |
| Privacy                 | **7**   | PII in audit log metadata, no retention policy                                |
| Database / Prisma       | **7**   | Good schema design; missing `@@index([householdId])` on waterfall models      |
| Error handling          | **7.5** | Custom error hierarchy; production responses generic; registration enum leaks |
| Testing                 | **6.5** | Good unit coverage; no integration tests (documented as deliberate deferral)  |
| Code quality            | **6**   | `as any`, `!`, magic numbers, 200+ line service methods                       |
| Pattern consistency     | **7.5** | Auth/audit/error patterns are systematic across all route files               |

### Frontend (React 18 + Vite + TanStack Query + Zustand)

| Area                            | Score | Headline                                                                         |
| ------------------------------- | ----- | -------------------------------------------------------------------------------- |
| Architecture & folder structure | **7** | Good separation; leaky cache-key abstractions                                    |
| State management                | **6** | Redundant Zustand state, overly broad TQ invalidation, **RxDB unused**           |
| Type safety                     | **5** | `no-explicit-any: 'off'`, `as any[]` casts in ReviewWizard, untyped API client   |
| Component patterns              | **6** | 570-line ReviewWizard, ~zero `React.memo`, prop-drilling                         |
| Security (frontend)             | **7** | httpOnly cookies + CSRF with recovery; minor error message pass-through          |
| Privacy                         | **7** | No third-party analytics, minimal local PII; 4/5 console calls unguarded in prod |
| API client / data layer         | **7** | Generic `data?: any`, no request timeout, single retry                           |
| Routing & auth guards           | **8** | Solid protected routes; minor hydration race condition                           |
| Testing                         | **7** | 71 test files, unit-heavy, no integration flows                                  |
| Performance                     | **6** | No memoisation, full-tree re-renders on stale data, full D3 import               |
| Pattern consistency             | **6** | Naming drift across feature areas                                                |

### Cross-cutting (Shared / Tooling / Infra)

| Area                 | Score   | Headline                                                                          |
| -------------------- | ------- | --------------------------------------------------------------------------------- |
| Monorepo structure   | **7**   | No TS project references (mitigated by Turbo), no shared dev-tools package        |
| Shared Zod schemas   | **8**   | Comprehensive; rarely used to validate **responses** in frontend                  |
| TypeScript config    | **6.5** | Root tsconfig thin; per-package duplication; project refs nice-to-have with Turbo |
| Linting & formatting | **7**   | `no-explicit-any` disabled; no import-order/security plugins                      |
| CI/CD                | **7**   | Clean pipeline; bare-SSH deploy with no exit-code check                           |
| Docker               | **8**   | Multi-stage good; **runs as root**, migrations every boot                         |
| Env & secrets        | **7**   | `.env` properly gitignored with placeholders; `CSRF_SECRET` optional              |
| Dependency hygiene   | **7**   | Good `overrides`; CVE suppression on ajv ReDoS (acceptable)                       |
| Dev experience       | **7**   | Backend watch doesn't react to `packages/shared` changes                          |
| Documentation        | **8**   | README + CLAUDE.md strong; no ADRs, no API docs                                   |
| Git hygiene          | **8**   | `.gitignore` complete; no commit-lint / branch protection visible                 |
| Testing infra        | **7**   | Per-file isolation runner is clever; lacks timeouts + integration tests           |

---

## Strengths (don't regress)

### Zero-trust authorisation (3 layers)

Every request traverses three independent security layers:

```
Layer 1: authMiddleware
  ├─ Verify JWT + check blacklist (lines 28, 38)
  ├─ Resolve user from database (line 43)
  └─ Verify household membership — "Zero Trust" (lines 56-77)
      → Sets request.householdId from DB, NOT from URL params

Layer 2: Route handler
  ├─ Zod schema validation
  └─ Pass verified req.householdId! to service

Layer 3: Service layer
  ├─ Resource ownership assertion (assertOwned / verifyItemOwnership)
  ├─ Business logic
  └─ Audit log via audited() wrapper
```

`householdId` is resolved **server-side** from the authenticated user's `activeHouseholdId` — it cannot be spoofed via URL params. Routes that accept `:householdId` as a param explicitly verify it matches `req.householdId` before proceeding.

### Error masking

The error class hierarchy uses `NotFoundError` for both "resource doesn't exist" and "resource not owned by caller" — deliberately masking IDOR attempts as 404s.

### Audit logging consistency

100% of create/update/delete operations propagate `actorCtx(req)` and are wrapped in the `audited()` decorator. Consistent across all route files.

### Other patterns worth keeping

- Per-file subprocess test isolation (`apps/backend/scripts/run-tests.ts`) — correct fix for Bun's `mock.module()` leakage.
- Refresh-token **rotation with family tracking** and reuse detection (`auth.service.ts:242-341`).
- Zod-validated env (`config/env.ts`) with explicit weak-secret blocklist.
- Dependency `overrides` block in root `package.json` — proactive transitive-dep pinning.
- CSRF recovery — `api.ts:140` clears cached CSRF token on 403, forcing refetch.
- Skip-to-content link and labelled inputs in `Layout.tsx` — accessibility baseline.
- Docs structure (`0. reference` → `5. built`) is the clearest part of the repo.

---

## Findings

### HIGH severity

#### 1. Type-safety is opt-out

ESLint disables `@typescript-eslint/no-explicit-any` in **both** `apps/backend/eslint.config.js:10` and `apps/frontend/eslint.config.js:18`. This undermines the value of having Zod schemas in `packages/shared`.

Worst offenders:

- `auth.middleware.ts:28` — `verifyAccessToken(token) as any` at a critical security boundary
- `actor-ctx.ts:7-8` — `(req as any).user!.userId`
- `api.ts:223-253` — all mutation methods `data?: any` (untyped request bodies)
- `ReviewWizard.tsx:142-148` — `return income as any[]` hiding discriminated-union mismatches

**Fix:** Flip to `'warn'` → fix auth middleware + API client → flip to `'error'`.

#### 2. Docker production images run as root

Both `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` have no `USER` directive. Backend CMD runs `prisma migrate deploy && bun src/db/seed.ts && bun src/server.ts` on every start — seed should not run in prod.

**Fix:** Add non-root users; separate migration into a deploy step; never run `seed.ts` automatically.

#### 3. Missing database indexes on waterfall models

`IncomeSource`, `CommittedItem`, `DiscretionaryItem` have **no `@@index([householdId])`** in `prisma/schema.prisma`. These are high-query tables — `waterfall.service.ts` filters by `householdId` on every request.

**Fix:** Add `@@index([householdId])` to all three models. Run `bun run db:migrate`.

#### 4. Registration enables email enumeration

`auth.service.ts:82` — `"User with this email already exists"` reveals whether an email is registered. Login errors are already generic (`"Invalid email or password"`), but registration is not.

**Fix:** Change to generic `"Registration failed. Please try again or log in."`.

### MEDIUM severity

#### 5. Waterfall endpoints lack per-route rate limiting

Waterfall POST/PATCH/DELETE routes have no endpoint-specific rate limits. Only the global limit applies (100/15min), which is too permissive for write operations.

**Fix:** Add `config: { rateLimit: { max: 30, timeWindow: "15 minutes" } }` to waterfall mutation routes.

#### 6. Frontend console logging in production

4 of 5 console calls in auth/API code (`ErrorBoundary.tsx:24`, `api.ts:200`, `authStore.ts:84,145`) lack `import.meta.env.DEV` guards. These will leak error details in production browser DevTools.

**Fix:** Gate all console calls behind `import.meta.env.DEV`.

#### 7. RxDB is a dead dependency

Listed in `apps/frontend/package.json:47` (`rxdb: ^15.38.2`) with **zero imports or usage** anywhere in the codebase.

**Fix:** `cd apps/frontend && bun remove rxdb`.

#### 8. `CSRF_SECRET` optional in production

`config/env.ts:62` — `CSRF_SECRET: z.string().min(32).optional()`. Should be mandatory when `NODE_ENV === 'production'`.

**Fix:** Add `.refine()` or conditional check in env validation.

#### 9. Audit log PII hygiene

`auth.routes.ts:163` stores raw email in `LOGIN_FAILED` metadata. `audit.service.ts:45-76` JSON-diffs with no field denylist — PII (email, notes) can appear in change records. No retention policy exists.

**Fix:** Add field denylist to `computeDiff()`. Implement 90-day retention cleanup job.

### LOW severity

#### 10. Token blacklist is in-memory

`tokenBlacklist.ts:7` — `new Map<string, number>()`. Survives only until restart; revoked tokens become valid again. Acceptable at current scale (15-min TTL, single-digit entries) but won't survive multi-instance deployment.

**Fix (when scaling):** Migrate to Redis-backed blacklist with TTL keyed on `jti`.

#### 11. ReviewWizard is 570 lines

`ReviewWizard.tsx` handles wizard state, item confirmation, mutations, and snapshot creation in one file. Functional but hard to maintain.

**Fix (when convenient):** Split into `WizardContainer` / `StepRenderer` / `ItemCard`.

#### 12. ItemArea / AssetItemArea duplication

`ItemArea.tsx` (301 lines) and `AssetItemArea.tsx` (238 lines) follow the same pattern with slightly different bookkeeping.

**Fix (when convenient):** Extract shared pattern into a reusable component.

#### 13. No pre-commit hooks

CI catches lint/type-check issues, but developers get no local feedback before pushing.

**Fix:** Add lefthook or husky with lint + type-check on staged files.

#### 14. CI deploy step has no safety checks

`ci.yml:198` — bare SSH login to remote, no explicit command, no exit-code check. Assumes Coolify handles everything.

**Fix:** Add explicit deploy trigger command + capture exit code + fail job on non-zero.

---

## Zero Trust Assessment

| Principle                             | Status           | Evidence                                                                                                      |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Every request authenticated           | YES              | `authMiddleware` on all protected routes; only `/health` and auth endpoints exempt                            |
| Every request authorised for resource | YES              | 3-layer: token → membership → resource ownership                                                              |
| Tokens validated every request        | YES              | JWT verified + blacklist checked on every call                                                                |
| Defence in depth                      | YES              | Auth middleware, route-level checks, service-level assertions — independent layers                            |
| Least privilege                       | PARTIAL          | Role checks exist (`assertOwner`, `assertOwnerOrAdmin`) but no granular permissions beyond owner/admin/member |
| Fail closed                           | YES              | Missing/invalid token → 401; missing membership → 403; missing resource → 404 (masks IDOR)                    |
| Internal calls trusted                | YES (acceptable) | Services trust routes have validated householdId — routes are the only entry point                            |

**Gap:** No "deny by default" for new routes. A developer could add a route without `authMiddleware` and it would be unprotected. Consider a Fastify `onRequest` hook that requires explicit opt-out for public routes.

---

## Patterns to Document

These patterns exist in the codebase but are not documented. They should be added to `docs/3. architecture/` to ensure future adherence and prevent regression.

### `authorisation-model.md` (NEW)

- **3-layer model:** auth middleware (token + membership) → route (Zod + pass householdId) → service (ownership assertion + audit)
- **householdId rule:** Always from `req.householdId!` (server-resolved), never from URL params for data access
- **Error masking:** `NotFoundError` for both "not found" and "not owned"
- **New route rule:** Must include `authMiddleware` unless explicitly public; document the public endpoint allow-list
- **Deny by default:** Consider a global `onRequest` hook requiring opt-out

### `error-handling.md` (NEW)

- **Always throw:** Use `throw new AppError(...)` subclasses, never `reply.status().send()` inline
- **Hierarchy:** `NotFoundError` (404), `AuthenticationError` (401), `AuthorizationError` (403), `ValidationError` (400), `ConflictError` (409)
- **Production rule:** Generic messages only; detailed in development only
- **Auth messages:** All login/register failures must be generic — no account enumeration

### `audit-logging.md` (NEW)

- **Every mutation wrapped in `audited()`** with `actorCtx(req)`
- **Field denylist:** `password`, `email`, `tokens`, `notes` must never appear in audit diff metadata
- **Retention:** 90-day retention for audit logs and IP/user-agent data

### `data-privacy.md` (NEW)

- **PII inventory:** email, name, dateOfBirth, IP address, user agent
- **Storage:** Passwords bcrypt-hashed (cost 10), refresh tokens SHA-256 hashed, no plaintext secrets
- **Logging:** Never log email, password, or token values; use userId for correlation
- **Cookies:** httpOnly, secure (prod), sameSite=strict, no localStorage for tokens

### `type-safety-policy.md` (NEW)

- **ESLint target:** `no-explicit-any: 'error'`
- **Shared schemas:** API client methods typed `<TReq, TRes>` from `@finplan/shared` Zod types
- **No `as any`:** Fix the type, don't cast — especially in auth and API client paths
- **Non-null assertions:** Prefer early-return guards or `??` over `!`

### Add to `CLAUDE.md` — Security Conventions

```
- Auth middleware required on every new route unless explicitly public
- householdId from middleware only — never from URL params for data scoping
- Throw, don't inline errors — use error class hierarchy
- Audit all mutations via audited() with actorCtx(req)
- No any in security paths — auth middleware, token handling, API client must be fully typed
- Generic auth messages — never reveal whether an account exists
```

---

## Verification

To validate any subsequent fix:

- `bun run lint` — must remain zero-warning
- `bun run type-check` — should be cleaner after type-safety ratchet, not noisier
- `cd apps/backend && bun scripts/run-tests.ts` — all existing tests pass
- `bunx prisma migrate diff` after schema changes
- `docker compose -f docker-compose.yml config` after Dockerfile changes
