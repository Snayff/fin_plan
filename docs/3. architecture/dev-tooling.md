# Dev Tooling — Hooks, Watch Mode, Coverage

> Local-and-CI feedback loop for finplan.

## Pre-commit hook

Runs `lint-staged`, which runs `eslint --fix --max-warnings=0` on staged `*.{ts,tsx,js,mjs,cjs}` files only. Config lives in `.lintstagedrc.js` (monorepo-aware: groups files by workspace and passes the correct `eslint.config.js` per workspace). Typical run ≤ 5 s for 1–5 files.

**Bypass:** `git commit --no-verify` — sanctioned escape hatch. CI re-runs full lint on PRs, so a bypass cannot reach `stage`/`prod` un-checked.

## Pre-push hook

Runs `bun run type-check` (full workspace, via Turbo). Typical run 10–25 s.

**Bypass:** `git push --no-verify` — same policy as pre-commit. CI re-runs type-check.

## Backend test watch mode

```bash
cd apps/backend
bun scripts/run-tests.ts --watch              # all files
bun scripts/run-tests.ts auth --watch         # files matching "auth"
```

- Re-runs affected test file(s) on save, in a fresh `bun test` subprocess (preserves the per-file isolation guarantee).
- Source → test mapping uses a filename heuristic: `foo.service.ts` → `foo.service.test.ts`. When no sibling exists and a filter is active, falls back to all test files matching the filter.

## Coverage floor & ratchet

Coverage is enforced across **three suites** — `apps/backend`, `apps/frontend`, and `packages/shared`. Each suite runs in its own CI job, emits a single-package "slice" (`coverage-current.json`), and the **Coverage Gate** job merges the slices and runs `check-coverage.ts` against them.

- **Baseline:** `coverage-baseline.json` at the repo root — per-package functions/lines percentages. Current baselines: backend 66.5 / 77.9, frontend 40.7 / 56.6, shared 100 / 99.5.
- **Floor:** per-package minimums in `scripts/check-coverage.ts` (`floors`), each set a few points below its baseline. Packages without an override fall back to the default floor (functions ≥ 63%, lines ≥ 74%). Current floors: backend 63 / 74, frontend 38 / 54, shared 99 / 97.
- **Ratchet:** any drop > 1 pp on any metric for any package fails CI — this, not the floor, is what catches gradual erosion.

> **Note on the metric.** The isolated runners (backend, frontend) average each test file's "All files" row, so the gate figure is a **per-file mean**, not whole-codebase coverage — it understates reality (a file hit by ten tests still only shows in each one's narrow summary). For honest numbers use the gap-finder below. True coverage as of 2026-05-31: backend 69.0 / 84.1, frontend 72.6 / 55.0, shared 98.9 / 100.

### Climbing to 90% (incremental ratchet)

Target is **≥ 90% on both lines and functions for every package**, reached without ever turning CI red. `check-coverage.ts` prints each package's distance to the 90/90 target on every run (informational — never fails).

- **Gap-finder** (true whole-codebase coverage, the prioritized worklist):
  ```bash
  bun run coverage:gaps:backend     # or :frontend / :shared — lowest-covered files first
  ```
- **Lock-in helper** — after a batch of tests lands and coverage rises:
  ```bash
  bun scripts/bump-baseline.ts coverage-current.json   # raises baseline, prints new floors
  ```
  It raises each `coverage-baseline.json` entry to the new figure (so the 1pp ratchet now defends it) and prints suggested floors — a 2pp margin below the raised baseline, **capped at 90**. Paste the floors into `check-coverage.ts` and commit both together. Floors only ever rise; the target is reached the moment a package's floor hits 90/90.

See `docs/4. planning/coverage-90-percent/implementation-plan.md` for the phased rollout.

**Updating the baseline.** When a refactor legitimately moves code or test coverage rises, run `bump-baseline.ts` (or edit `coverage-baseline.json` by hand) in the same PR. Reviewers see the diff explicitly.

**Running locally:**

```bash
# Per suite — each writes its slice to coverage-current.json at the repo root
cd apps/backend && bun scripts/run-tests.ts --coverage
cd apps/frontend && bun scripts/run-tests.ts --coverage
cd packages/shared && bun run test:coverage:ci

# Check a single slice, or merge several first (mirrors the CI gate)
bun scripts/check-coverage.ts coverage-current.json
bun scripts/merge-coverage.ts coverage-current.json slice-a.json slice-b.json slice-c.json
```

> **Branch protection.** The new jobs (`Frontend Test`, `Shared Test`, `Coverage Gate`) only block merges once added as **required status checks** on `stage` in GitHub branch-protection settings — CI running a job is not the same as gating on it.
