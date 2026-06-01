# Coverage → 90% — Continuation Handoff

> Living handoff for any AI/engineer continuing the coverage push. Read this first,
> then `docs/4. planning/coverage-90-percent/implementation-plan.md` for the phased plan.
> Branch: `claude/ci-suite-test-coverage-1GCmh`.

---

## 1. What this work is

Bring **every package to ≥ 90% coverage on both lines and functions**, rolled out as an
**incremental ratchet**: floors only ever rise, CI stays green throughout, gains are
locked in after each batch so they can't regress.

### Current state (true whole-codebase coverage)

| Package           | Lines  | Functions | Floor (lines/fn) | Status                               |
| ----------------- | ------ | --------- | ---------------- | ------------------------------------ |
| `packages/shared` | 98.9%  | 100%      | 90 / 90          | ✅ **at target**                     |
| `apps/backend`    | ~75.3% | 90.2%     | 73 / 90          | functions ✅ met; **lines climbing** |
| `apps/frontend`   | ~72.6% | ~55%      | 70 / 53          | **in progress**                      |

Numbers live in `coverage-baseline.json`; floors in `scripts/check-coverage.ts`.

---

## 2. Critical context you MUST know

1. **The gate measures TRUE whole-codebase coverage** (merged lcov), not the old
   per-file-mean. The per-file-mean was abandoned because adding a test file for an
   untested module _lowers_ the average — 90% was literally unreachable by writing tests.
   Don't reintroduce it. All measurement goes through `scripts/run-lcov-coverage.ts`.

2. **Backend tests need a real Postgres.** A handful of service/journey tests use a live
   DB (not the prisma mock). In a fresh container there is none, so 8 files fail until you
   start one. Use the committed helper:

   ```bash
   bun run coverage:backend      # ensures finplan_test DB + schema, runs the emitter
   ```

   If `bun run start` (docker stack) isn't available, stand one up manually — see
   `scripts/coverage-backend-local.sh` for the exact connection string
   (`postgresql://finplan:finplan_dev_password@127.0.0.1:5432/finplan_test`). Export
   `DATABASE_URL` to that before running backend tests directly.

3. **Two test harness styles — match the file you're extending:**
   - **Backend services:** mock prisma via `mock.module("../config/database", ...)` with
     `prismaMock` from `src/test/mocks/prisma`. Mutations often also mock `audited()`.
   - **Backend routes:** Fastify `app.inject(...)`; mock the service layer + auth
     middleware. Register `errorHandler` on the test app when asserting 4xx status codes.
   - **Frontend services:** either MSW (real `apiClient`, see `*.service.test.ts`) or a
     mocked `apiClient` via `mock.module("@/lib/api", ...)`. With the mocked-apiClient
     style, guard `beforeEach` resets as `fn?.mockClear?.()` — the global test setup can
     null mocks otherwise.
   - **Frontend components/hooks:** bun test + MSW; `src/test/setup.ts` is preloaded.

4. **Lint in tests:** the backend ESLint config disables `no-explicit-any` for `src/**`
   only when run from inside the workspace (which the fixed pre-commit hook and CI both
   do). `as any` is fine in test files.

5. **The local Postgres is ephemeral** — it dies with the container/session. Restart it
   per session; it is NOT committed state.

---

## 3. The per-batch loop (follow exactly)

```bash
# 0. (backend only) ensure DB is up
bun run coverage:backend >/dev/null    # or start PG per scripts/coverage-backend-local.sh

# 1. Find the next target — lowest-covered files first
bun run coverage:gaps:backend          # or :frontend / :shared

# 2. Pick ONE file/area. Read the source AND its existing test. Identify uncovered
#    branches/methods (run that single test with --coverage-reporter=lcov to see exact
#    uncovered DA: line numbers).

# 3. Write MEANINGFUL tests — happy AND unhappy paths. Assert behaviour, not internals.
#    Match the existing file's mocking style. NO snapshot padding for coverage's sake.

# 4. Run just that test until green:
#    backend:  DATABASE_URL=... bun test --preload ./src/test/setup.ts <file>
#    frontend: bun test <file>

# 5. Lint + type-check:
cd <workspace> && bunx eslint <files> --max-warnings 0
cd /home/user/fin_plan && bun run type-check

# 6. Commit the batch (one logical area per commit, descriptive message).

# 7. After a few batches, lock in gains:
bun scripts/emit-coverage-slice.ts <pkg-key> <pkg-dir> coverage-current.json   # measure
#    (merge all three slices if you have them, else edit the one package entry)
bun scripts/bump-baseline.ts coverage-current.json --margin 2  # raises baseline, prints floors
#    Paste the suggested floors into scripts/check-coverage.ts. Cap each at 90.
#    Commit coverage-baseline.json + check-coverage.ts together.

# 8. Push.
```

**Always** run lint + type-check before committing (project rule). Keep batches small and
reviewable — never a mega-diff. Re-run the full package suite periodically as a regression
check (`bun scripts/run-tests.ts` in the workspace).

---

## 4. Prioritised remaining work

Ranked by value-per-effort. Re-run `coverage:gaps:*` for live numbers — these shift as
batches land.

### Backend — lines 75→90 (functions already met)

The gap is concentrated in large services. Use the prisma-mock style; read each method,
find uncovered branches via single-file lcov.

1. `services/waterfall.service.ts` (~63% lines, 999 LOC) — biggest single line gap. Tier
   CRUD, summary aggregation, confirm flows. High value, slow.
2. `services/cashflow.service.ts` (~80%, 860 LOC) — projection/aggregation branches.
3. `services/gifts.service.ts` (~65%, 1072 LOC) — allocation/rollover/budget logic.
4. `services/import.service.ts` `importHousehold` (~66%, 570-line method) — the create_new
   and overwrite branches, FK-error paths. Heavy mocking; do last of the services.
5. `services/assets.service.ts` (~68%) — asset/account balance + summary branches.
6. Smaller mop-up: `middleware/auth.middleware.ts`, `middleware/errorHandler.ts`,
   `config/env.ts`, `utils/jwt.ts` — a few uncovered branches each.

### Frontend — lines 72→90 AND functions 55→90 (both gaps)

Lead with high-value, easily-tested logic before the component long tail.

1. **Services** (thin, pure): mostly done; sweep any remaining `src/services/*.ts`.
2. **Hooks** (`src/hooks/`): `useWaterfall.ts` (35%), `useAssets.ts` (48%),
   `useGifts.ts` (49%), `usePlanner.ts` (30%), `useReviewSession.ts` (29%),
   `useExportImport.ts` (51%). These hold real logic — high value. Test with a
   QueryClient wrapper + MSW; check existing hook tests for the pattern.
3. **Pure component helpers**: `components/tier/formatAmount.ts` ✅ done; look for similar
   `format*`/util modules co-located with components.
4. **Components** (the long tail, lowest value-per-test): `components/assets/*`,
   `components/overview/*`, `components/gifts/*`, `components/settings/*`,
   `features/search/*`. Many are near-0%. Render + interaction tests via MSW. Group by
   feature folder; one folder per batch.

When a package's **floor reaches 90/90**, `bump-baseline.ts` prints a 🎉 line. At that
point pin the floor at 90 (don't let the margin push it above the target).

---

## 5. Definition of done

- [x] Gate on true coverage; ratchet + tooling; local DB helper
- [x] `packages/shared` at 90/90
- [x] `apps/backend` **functions** at 90
- [ ] `apps/backend` **lines** at 90
- [ ] `apps/frontend` lines + functions at 90
- [ ] `bump-baseline.ts` reports all-at-target
- [ ] **User action:** add `Frontend Test`, `Shared Test`, `Coverage Gate` as **required
      status checks** on the `stage` branch (CI running ≠ merge-blocking)

---

## 6. Key files

| File                                | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `scripts/run-lcov-coverage.ts`      | per-file isolated lcov run + merge (shared core) |
| `scripts/emit-coverage-slice.ts`    | CI slice emitter; doubles as the test gate       |
| `scripts/coverage-report.ts`        | gap-finder (`coverage:gaps:*`, `--table`)        |
| `scripts/check-coverage.ts`         | floor + 1pp ratchet + 90/90 target reporting     |
| `scripts/bump-baseline.ts`          | lock-in helper (raises baseline, prints floors)  |
| `scripts/coverage-backend-local.sh` | local Postgres + backend coverage                |
| `coverage-baseline.json`            | per-package locked baselines                     |
| `.github/workflows/ci.yml`          | the three test jobs + Coverage Gate              |
