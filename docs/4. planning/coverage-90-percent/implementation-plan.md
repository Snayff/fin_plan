# Coverage → 90% — Implementation Plan

> Goal: bring **every package to ≥ 90% coverage on both lines and functions**, rolled
> out as an **incremental ratchet** (CI stays green throughout; floors climb as tests
> land). Owner: engineering.

## Progress log

The gate now measures **true whole-codebase coverage** (merged lcov) — the per-file-mean
was abandoned because it could never be driven to 90% by writing tests. Tooling, the
ratchet, and the local backend-coverage helper are landed.

| Package           | Start (true) | Latest          | Floor         | Target                           |
| ----------------- | ------------ | --------------- | ------------- | -------------------------------- |
| `packages/shared` | 98.9 / 100   | **98.9 / 100**  | 90/90         | ✅ met                           |
| `apps/backend`    | 71.8 / 84.7  | **75.3 / 90.2** | 90 fn / 73 ln | functions ✅ met; lines climbing |
| `apps/frontend`   | 72.6 / 55.0  | in progress     | 53 / 70       | pending                          |

Landed batches (all happy + unhappy paths, ratcheted in):

- **backend:** actor-ctx, isa-tax-year, retention, auth.service (token lifecycle),
  member.service, snapshot, subcategory, isa-forecast, household.service (joinViaInvite +
  member removal), forecast helpers, import.restoreFromBackup, gifts routes, waterfall
  routes (mutations + periods), assets routes → **functions hit the 90% milestone.**
- **frontend:** formatAmount, securityActivity.service, household.service endpoints.

Remaining to 90%: **backend lines** (~75→90, concentrated in the big services —
waterfall/cashflow/gifts/import) and **all of frontend** (hooks, components, the rest of
the services). See the phased breakdown below.

---

## 1. Where we actually are

The original CI figures (frontend 40.7% / 56.6%) were misleading: the gate uses a
**per-file mean** — it averages the "All files" row Bun prints for each isolated test
run, and that row only reflects the modules a single test file touched. It systematically
understates real coverage.

To get honest numbers, `scripts/coverage-report.ts` runs each test file with an lcov
reporter and **merges the reports per source file** (max hit-count per line, max
functions-hit per file). True whole-codebase coverage, measured 2026-05-31:

| Package           | Lines (true) | Functions (true) | Gate metric (per-file mean) |
| ----------------- | ------------ | ---------------- | --------------------------- |
| `packages/shared` | **98.9%**    | **100%**         | 99.5 / 100                  |
| `apps/backend`    | **69.0%**    | **84.1%**        | 77.9 / 66.5                 |
| `apps/frontend`   | **72.6%**    | **55.0%**        | 56.6 / 40.7                 |

**Takeaways**

- `packages/shared` is already past 90% on both metrics — only branch gaps remain.
- The real gaps are **backend lines (69%)** and **frontend functions (55%)**.
- Frontend lines are ~73%, _not_ 40% — the headline number was a metric artifact.

> **Decision (2026-05-31):** the CI gate keeps the per-file-mean metric (familiar,
> already wired, cheap). `coverage-report.ts` is retained as a **diagnostic gap-finder**
> — its `--table` output is the prioritized worklist for each batch below. The 90% target
> is tracked against the per-file-mean figures the gate already records.

---

## 2. The ratchet mechanism (landed)

Three pieces, all committed:

1. **`scripts/check-coverage.ts`** — floor + 1pp ratchet (existing) **plus** a
   non-failing `reportProgress()` that prints each package's distance to the 90/90
   target on every run. The gate fails only on a floor breach or a >1pp drop.
2. **`scripts/bump-baseline.ts`** — run after a test batch lands. Raises each
   `coverage-baseline.json` entry to the new current figure (locking in the gain so the
   ratchet now defends it) and prints the new suggested floors (a 2pp margin below the
   raised baseline, **capped at 90**). Never lowers a baseline.
3. **`scripts/coverage-report.ts`** — true-coverage gap-finder (`bun run coverage:gaps:<pkg>`).

**The loop per batch:**

```
1. bun run coverage:gaps:<pkg>      # find the lowest-covered files → pick targets
2. write tests for those files
3. bun run lint && bun run type-check
4. <pkg> test --coverage            # regenerate the slice
5. bun scripts/bump-baseline.ts coverage-current.json   # lock in, get new floors
6. paste suggested floors into check-coverage.ts; commit baseline + floors together
```

Because floors only ever rise and are capped at 90, CI stays green and the target is
reached the moment a package's floor hits 90/90.

---

## 3. Phased rollout

Each phase is a reviewable batch. Run lint + type-check + the coverage loop after **each**
file group, never in one mega-commit (per CLAUDE.md "implement batch changes incrementally").

### Phase 0 — tooling & gate (DONE)

- `coverage-report.ts`, `bump-baseline.ts`, target reporting, npm scripts, this plan.

### Phase 1 — `packages/shared` to 90/90 (smallest, fastest)

- True coverage already 98.9 / 100. Only a handful of branch lines uncovered
  (`assets.schemas.ts` 29-31, `gifts.schemas.ts` 51-54).
- Action: add the missing schema-edge tests; bump shared floor to **90/90**.
- Exit: shared floor = 90/90, green.

### Phase 2 — `apps/backend` to ≥90% (lines are the gap: 69%)

Order by risk and gap size (from the gap-finder table):

1. **Auth / middleware / security** — `auth.middleware.ts` (47%), `auth.service.ts`
   (50%), `password.ts`, `tokenBlacklist.ts`, `errorHandler.ts`. Security-critical → first.
2. **Routes** — `waterfall.routes.ts` (56%), `gifts.routes.ts` (57%), `auth.routes.ts` (73%).
3. **High-LOC services** — `waterfall.service.ts` (58%), `assets.service.ts` (57%),
   `gifts.service.ts` (65%), `import.service.ts` (66%), `household.service.ts` (69%),
   `cashflow.service.ts` (80%).
4. **Utils** — `frequency.ts`, `isa-tax-year.ts`, `isa-forecast.ts`.

- Bump baseline + floors after each group. Exit: backend floor = 90/90.

### Phase 3 — `apps/frontend` core (functions are the gap: 55%)

High-risk, high-value modules first — these are mostly untested today:

- `lib/api.ts` (10%), `lib/jwt.ts` (0%), `services/auth.service.ts`,
  `services/household.service.ts` (18%), `services/securityActivity.service.ts` (11%),
  `stores/authStore.ts`.
- **Sign-off gate:** report core coverage to the user before grinding the component tail.

### Phase 4 — `apps/frontend` remainder to ≥90%

Group by feature folder; each folder is a batch:

- `hooks/` — `useWaterfall.ts` (35%), `useAssets.ts` (48%), `useGifts.ts` (49%),
  `usePlanner.ts` (30%), `useReviewSession.ts` (29%), `useExportImport.ts` (51%).
- `components/assets/`, `components/overview/`, `components/gifts/`,
  `components/settings/`, `components/tier/`, `features/search/` — the long tail of
  near-zero-coverage components (`IsaProgress.tsx` 0%, `ConfigBudgetPanel.tsx` 4%, …).
- Exit: frontend floor = 90/90.

### Phase 5 — lock in

- All three floors at 90/90; `bump-baseline` prints the 🎉 all-at-target line.
- Update `docs/3. architecture/dev-tooling.md`.
- **User action:** add `Frontend Test`, `Shared Test`, `Coverage Gate` as **required
  status checks** on `stage` branch protection (CI running ≠ merge-blocking).

---

## 4. Effort & risk

- **Volume:** frontend functions alone is ~570 uncovered functions across ~260 files —
  this is the bulk of the work and is genuinely large. Backend is ~3k uncovered lines.
- **Risk of low-value tests:** chasing 90% can incentivise shallow render-only tests.
  Mitigate by leading each phase with the _high-risk_ modules (auth, services, stores)
  and using behavioural assertions, not snapshot padding.
- **Flake surface:** frontend uses MSW; new async/store tests must await settled state.
- **Untestable glue:** `db/seed.ts`, `prisma/`, and `scripts/` are excluded from the
  true-coverage denominator (see `isIncludedSource` in `coverage-report.ts`). If a file
  genuinely can't be unit-tested, exclude it there rather than writing a hollow test.

---

## 5. Definition of done

- [ ] `packages/shared` floor 90/90
- [ ] `apps/backend` floor 90/90
- [ ] `apps/frontend` floor 90/90
- [ ] `bump-baseline` reports all-at-target
- [ ] dev-tooling.md updated
- [ ] required status checks confirmed on `stage`
