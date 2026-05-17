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

- **Baseline:** `coverage-baseline.json` at the repo root — per-package functions/lines percentages (currently functions: 68.9%, lines: 79.4%).
- **Floor:** fixed minimum enforced in `scripts/check-coverage.ts` (functions ≥ 63%, lines ≥ 74%).
- **Ratchet:** any drop > 1 pp on any metric for any package fails CI.

**Updating the baseline.** When a refactor legitimately moves code or test coverage rises, update `coverage-baseline.json` in the same PR. Reviewers see the diff explicitly.

**Running locally:**

```bash
cd apps/backend && bun scripts/run-tests.ts --coverage
bun scripts/check-coverage.ts coverage-current.json
```
