# finplan — Critical Code & Architecture Review

**Date:** 2026-04-08
**Scope:** Code quality, architectural design, implementation patterns, security, privacy.
**Out of scope:** UX, features, product decisions.
**Method:** Three parallel Explore agents analysed backend, frontend, and shared/infra/tooling. Findings cite file:line where possible.

---

## Overall Score: **6.8 / 10**

A well-intentioned, modern TypeScript monorepo with good foundational instincts (Zod-everywhere, JWT rotation, Turbo + Bun, custom isolated test runner) — but execution is uneven. Type-safety escape hatches, scattered authorisation logic, and god-components erode the quality the architecture is trying to enforce. **Production-adjacent, not production-ready** for handling real financial data without targeted hardening on auth, IDOR, secrets, and data hygiene.

---

## Scorecard

### Backend (Fastify + Prisma + JWT + Redis)

| Area                    | Score      | Headline                                                              |
| ----------------------- | ---------- | --------------------------------------------------------------------- |
| Architecture & layering | **7/10**   | Clear layers but authorisation leaks across them                      |
| Security                | **6.5/10** | Solid primitives, brittle execution; IDOR + in-memory blacklist risks |
| Privacy                 | **7/10**   | PII in logs, no retention policy                                      |
| Database / Prisma       | **7.5/10** | Good schema, missing waterfall indexes, latent N+1                    |
| Error handling          | **7/10**   | Custom errors good; Prisma errors leak field names                    |
| Testing                 | **6.5/10** | Coverage breadth without IDOR/integration depth                       |
| Code quality            | **6/10**   | `as any`, `!`, magic numbers, 200+ line service methods               |
| Pattern consistency     | **6.5/10** | Auth checks inline in some routes, in services in others              |

### Frontend (React 18 + Vite + TanStack Query + Zustand + RxDB)

| Area                            | Score    | Headline                                                               |
| ------------------------------- | -------- | ---------------------------------------------------------------------- |
| Architecture & folder structure | **7/10** | Good separation, leaky cache-key abstractions                          |
| State management                | **6/10** | Redundant Zustand state, overly broad TQ invalidation, **RxDB unused** |
| Type safety                     | **5/10** | `no-explicit-any: 'off'`, `as any[]` casts in ReviewWizard             |
| Component patterns              | **6/10** | 570-line god component, ~zero `React.memo`, prop-drilling              |
| Security (frontend)             | **7/10** | httpOnly cookies + CSRF good; error message leakage                    |
| Privacy                         | **8/10** | No third-party analytics, minimal local PII                            |
| API client / data layer         | **7/10** | Generic `data?: any`, no request timeout, single retry                 |
| Routing & auth guards           | **8/10** | Hydration race condition possible                                      |
| Testing                         | **7/10** | 71 test files, unit-heavy, no integration flows                        |
| Performance                     | **6/10** | No memoisation, full-tree re-renders, full D3 import                   |
| Pattern consistency             | **6/10** | Naming drift across feature areas                                      |

### Cross-cutting (Shared / Tooling / Infra)

| Area                 | Score    | Headline                                                                |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| Monorepo structure   | **7/10** | No TS project references, no shared dev-tools package                   |
| Shared Zod schemas   | **8/10** | Comprehensive; rarely used to validate **responses** in frontend        |
| TypeScript config    | **6/10** | Root tsconfig too thin; per-package duplication                         |
| Linting & formatting | **7/10** | `no-explicit-any` disabled; no import-order/security plugins            |
| CI/CD                | **7/10** | Clean pipeline; bare-SSH deploy with no exit-code check                 |
| Docker               | **8/10** | Multi-stage good; **runs as root**, migrations every boot               |
| Env & secrets        | **6/10** | Weak `JWT_SECRET` validation, optional `CSRF_SECRET`, no rotation       |
| Dependency hygiene   | **7/10** | Good `overrides`; CVE suppression on ajv ReDoS (acceptable)             |
| Dev experience       | **7/10** | Backend watch doesn't react to `packages/shared` changes                |
| Documentation        | **8/10** | README + CLAUDE.md strong; no ADRs, no API docs                         |
| Git hygiene          | **8/10** | `.gitignore` complete; no commit-lint / branch protection visible       |
| Testing infra        | **7/10** | Per-file isolation runner is clever; lacks timeouts + integration tests |

---

## Critical Findings (fix first)

### 1. Authorisation is scattered → IDOR risk

- `apps/backend/src/middleware/auth.middleware.ts:42-77` resolves `activeHouseholdId` and silently repairs stale memberships — implicit trust downstream.
- Some routes verify `params.householdId === request.householdId` inline (`households.ts:142, 199`), others trust the auth middleware (`waterfall.routes.ts`, `assets.service.ts:27-35` only checks asset→household, not user→household for _that_ call).
- Service helpers (`assertOwner`, `assertMember`) are duplicated across services rather than enforced as middleware.
- **Fix:** Single `requireHouseholdAccess(role)` preHandler factory; remove inline checks; have services assume the route guard already ran.

### 2. Token blacklist is in-memory

- `apps/backend/src/utils/tokenBlacklist.ts` — survives only until next restart. Revoked access tokens become valid again on a deploy.
- **Fix:** Move to Redis (already a dependency) with TTL keyed on `jti`.

### 3. Import endpoint has no structural payload limits

- `apps/backend/src/services/import.service.ts:46-68` parses with Zod after a 5 MB body limit, but no depth/object-count cap. A pathologically nested 5 MB JSON can blow up parser memory.
- **Fix:** Add explicit max-depth + max-keys limits; reject before `safeParse`. Consider streaming for larger payloads.

### 4. `.env` committed for backend (with real-shaped secrets)

- `apps/backend/.env` is present in the working tree with a `JWT_SECRET` long enough to pass validation. Even though it isn't in history (`git log --all -- ".env"` is empty), this is one careless `git add` away.
- `JWT_SECRET` validator (`config/env.ts:15-31`) blocks obvious strings but accepts low-entropy 32-char inputs (`AAAA...`).
- `CSRF_SECRET` is `optional()`.
- **Fix:** Delete `apps/backend/.env`, ensure `.env` is gitignored at every level, make `CSRF_SECRET` mandatory in production, add a small entropy check (Shannon ≥ 4.0) or accept only base64/hex of length 64.

### 5. Type-safety is opt-out

- ESLint disables `@typescript-eslint/no-explicit-any` in **both** `apps/backend/eslint.config.js:10` and `apps/frontend/eslint.config.js:18`.
- `apps/backend/src/lib/actor-ctx.ts:7-8` — `(req as any).user!.userId`.
- `apps/backend/src/middleware/auth.middleware.ts:28` — `verifyAccessToken(token) as any` then trusts `payload.userId || payload.id || payload.sub` (legacy fallback that widens attack surface if a legacy secret leaks).
- `apps/frontend/src/components/ReviewWizard.tsx:142-148` — `return income as any[]` to paper over discriminated-union mismatches.
- `apps/frontend/src/services/api.ts:223-253` — `post<T>(endpoint, data?: any, token?)` makes the entire client untyped at the request body.
- **Fix:** Set rule to `'error'`; type `FastifyRequest` augmentation properly; make `ApiClient` methods `<TReq, TRes>` and bind to shared Zod-derived types.

### 6. Information leakage in error responses

- `apps/backend/src/middleware/errorHandler.ts:100-126` — Prisma `P2002` returns `"A record with this <fields> already exists"` (reveals which columns are unique).
- `auth.service.ts:82` — `"User with this email already exists"` enables account enumeration.
- `auth.service.ts:151` — distinct `"User not found"` vs invalid-password message.
- Frontend `LoginPage.tsx:44` then renders the raw API message verbatim.
- **Fix:** Generic `"Invalid email or password"` for all login failures; generic `"Record already exists"` for unique violations; never echo unsanitised server messages in the frontend.

### 7. Docker production images run as root

- `apps/backend/Dockerfile` and the nginx final stage of the frontend Dockerfile have no `USER` directive.
- Migrations + seed run on **every** backend container start (`CMD` line in `apps/backend/Dockerfile`).
- **Fix:** Add a non-root user; split migration into a one-shot init container or release step; never run `seed.ts` automatically in prod.

---

## High-Value Improvements (next)

### Backend

- **Add `@@index([householdId])`** to `IncomeSource`, `CommittedItem`, `DiscretionaryItem` in `prisma/schema.prisma`. These are scanned per-request in `waterfall.service.ts`.
- **Cascade User → activeHouseholdId** properly (currently relies on the auth middleware's silent repair).
- **Audit log hygiene:** `auth.routes.ts:163` stores raw email in `LOGIN_FAILED` metadata; `audit.service.ts:45-76` JSON-diffs with no field denylist. Add a denylist (`password`, `email`, `tokens`, `notes`) and a 90-day retention job.
- **Rate limiting:** `/auth/refresh` is 10/15m — too generous. Tighten to 3-5/15m. Waterfall write endpoints have no rate limit at all. Audit-log read endpoint (`audit-log.routes.ts`) has no rate limit.
- **Standardise error flow:** stop mixing `reply.status(400).send(...)` with `throw new AppError(...)`. Pick the latter.
- **Break up `importService.importHousehold()`** (200+ lines, lines 78-280 of `import.service.ts`) into `validate → members → waterfall → finalise`.
- **Integration tests:** add at least one supertest-driven test that exercises full login → refresh → access → logout, plus deliberate cross-household IDOR attempts.

### Frontend

- **Kill RxDB or commit to it.** Currently in `package.json` with **zero usages** in the codebase. Either delete (saves bundle size) or actually wire offline-first sync.
- **Split `ReviewWizard.tsx`** (570 lines) into `WizardContainer` / `StepRenderer` / `ItemCard`. Move the inline Framer Motion variants out of the render path.
- **De-duplicate `ItemArea.tsx` (301 lines) and `AssetItemArea.tsx` (238 lines)** — same shape, slightly different bookkeeping.
- **Optimistic mutations + granular invalidation:** `useAssets.ts:37` invalidates the entire `["assets"]` tree on every mutation. Move to per-type / per-id invalidation and `onMutate` rollback.
- **`ApiClient` hardening:** add `AbortController` timeout (e.g. 15s), exponential backoff for 5xx, proper typed request bodies, refresh CSRF token on 419/403 instead of caching forever.
- **Hydration race:** `App.tsx:99-102` fires `initializeAuth()` without an `isHydrated` flag — `NewUserRedirect` can flash the wrong route. Gate routing on a "hydrated" boolean from the auth store.
- **Console logging in production:** `authStore.ts:84,200` and `api.ts:145-162` log without `import.meta.env.DEV` guards.
- **Form library:** `react-hook-form` is in deps but `LoginPage.tsx` uses raw `useState`. Pick one approach and apply it everywhere.

### Cross-cutting

- **TypeScript project references** in root `tsconfig.json` so Turbo + tsc + Vite all see the same dependency graph and `packages/shared` edits hot-reload through the backend.
- **Unify per-package tsconfigs** — currently every app re-overrides target/module/lib, defeating inheritance.
- **ESLint additions:** `eslint-plugin-import` (no-cycle, order, no-relative-parent-imports across package boundaries) and `eslint-plugin-security`. Re-enable linting on test files.
- **Pre-commit hook (lefthook or husky)** — lint + type-check + format on staged files. CI is currently the only feedback loop.
- **CI deploy step** (`ci.yml:198`) is a bare SSH login that assumes a remote agent acts on it. Replace with an explicit remote command, capture exit code, and fail the job on non-zero.
- **Consume schemas bidirectionally:** the frontend has `@finplan/shared` Zod schemas available but rarely `.parse()`s API responses. A single `apiClient` wrapper that validates responses against the shared schema would catch backend/frontend drift at the boundary.
- **ADRs:** add `docs/3. architecture/ADRs/` recording why Fastify, Prisma, Zustand, RxDB, custom test runner, etc. — these are decisions a future engineer (or you in six months) will want context on.
- **API documentation:** generate an OpenAPI spec from Zod schemas (`zod-to-openapi`) — closes the documentation gap and gives the frontend a typed client for free.

---

## Patterns Worth Keeping

These are doing real work — don't regress:

- Per-file subprocess test isolation (`apps/backend/scripts/run-tests.ts`) — correct fix for Bun's `mock.module()` leakage.
- Refresh-token **rotation with family tracking** and reuse detection (`auth.service.ts:242-341`).
- Zod-validated env (`config/env.ts`) with explicit weak-secret blocklist.
- Dependency `overrides` block in root `package.json` — proactive transitive-dep pinning.
- Audit-log decorator pattern wrapping mutations in a transaction.
- Skip-to-content link and labelled inputs in `Layout.tsx` — accessibility baseline taken seriously.
- Docs structure (`0. reference` → `5. built`) is the clearest part of the repo.

---

## Suggested Sequencing

If you act on this, a roughly low-risk order:

1. **Secrets & Docker hardening** (Critical #4, #7) — repo-only changes, immediately reduce blast radius.
2. **Authorisation middleware + IDOR tests** (Critical #1) — refactor with tests as the safety net.
3. **Token blacklist → Redis** (Critical #2) — small, isolated change.
4. **Type-safety ratchet** (Critical #5) — flip `no-explicit-any` to `warn`, fix the worst offenders, then `error`.
5. **Error response sanitisation** (Critical #6) — touches both backend and frontend.
6. **Import payload limits** (Critical #3) — narrow surface.
7. **Index additions + N+1 audit** — query performance.
8. **Frontend god-component split + RxDB decision** — largest refactor, best done last on stable foundations.

---

## Verification

This is a review, not an implementation — there is nothing to run. To validate any subsequent fix:

- `bun run lint` — must remain zero-warning.
- `bun run type-check` — should be cleaner after the type-safety ratchet, not noisier.
- `cd apps/backend && bun scripts/run-tests.ts` — add IDOR + integration cases here.
- Manual: attempt cross-household reads with two test users via REST client; expect 403.
- `bunx prisma migrate diff` after any schema change to confirm intent.
- `docker compose -f docker-compose.yml config` after Dockerfile changes; inspect resulting user, healthcheck, and CMD.
