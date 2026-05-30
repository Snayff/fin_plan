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

> **Note on the metric.** The isolated runners (backend, frontend) average each test file's "All files" row, so the suite figure is a per-file mean rather than a whole-codebase percentage. Frontend reads low (≈40/57) for this reason — compare against its own baseline, not the backend's.

**Updating the baseline.** When a refactor legitimately moves code or test coverage rises, update the relevant package entry in `coverage-baseline.json` in the same PR. Reviewers see the diff explicitly.

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
