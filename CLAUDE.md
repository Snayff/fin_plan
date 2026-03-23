# FinPlan — Claude Code Context

Household financial planning SaaS built around a **Waterfall** model: income → committed spend → discretionary spend → surplus. Multi-member household support, goals, forecasting, and asset/liability tracking.

Full-stack TypeScript monorepo: Fastify backend + React/Vite frontend + shared Zod schemas. Currently in active rebuild phase (`feature/renew_finplan` branch).

---

## Commands

All commands use `bun run`. Never use npm or pnpm.

```bash
# Docker dev environment (primary workflow)
bun run start          # docker compose up -d (postgres:5432, redis, backend:3001, frontend:3000)
bun run stop           # docker compose down
bun run restart        # stop + start
bun run docker:logs    # follow all service logs

# Outside Docker (individual apps)
bun run dev            # all apps via Turbo watch mode

# Database
bun run db:migrate     # Prisma interactive migration
bun run db:seed        # seed the database
bun run db:studio      # open Prisma Studio

# Quality
bun run lint           # ESLint — zero warnings required
bun run type-check     # tsc --noEmit across all packages
bun run test           # all test suites
bun run build          # full monorepo build via Turbo
```

---

## Architecture

```
apps/
  backend/    # Fastify + Prisma + tRPC + Redis + JWT auth
  frontend/   # React 18 + Vite + Tailwind + TanStack Query + Zustand + RxDB
packages/
  shared/     # Zod schemas and TypeScript types — imported by both apps
docs/
  renew-finplan/   # Active specs (feature-specs.md, design-system.md, implementation-plan.md)
  implemented/     # Completed feature tracking (implemented.md)
```

---

## Conventions

- **Package manager:** Bun — use `bun add`, `bun install`, `bun run`
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`. Prefix intentionally unused vars with `_`
- **Linting:** ESLint zero warnings — always run `bun run lint` before committing
- **Shared schemas:** Zod schemas live in `packages/shared/src/schemas/` — never duplicate between apps
- **Database changes:** Always use `bun run db:migrate` (interactive Prisma migrations) — never edit schema without a migration

---

## Testing

Backend uses a **custom isolated per-file test runner** — do not use bare `bun test` for the backend:

```bash
# Run all backend tests
cd apps/backend && bun scripts/run-tests.ts

# Filter by pattern
cd apps/backend && bun scripts/run-tests.ts auth

# With coverage
cd apps/backend && bun scripts/run-tests.ts --coverage
```

Each test file runs in its own subprocess to prevent mock leakage between tests. Frontend uses MSW for HTTP mocking.

---

## Docs & Specs

Before implementing any feature, read the relevant section of the specs in `docs/renew-finplan/`:

| File                            | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `feature-specs.md`              | Authoritative UX and behavior specs — read this first |
| `design-system.md`              | Design tokens, components, typography, color, motion  |
| `implementation-plan.md`        | Phase-by-phase rollout with task breakdown            |
| `backlog/`                      | 17 detailed future feature specs                      |
| `../implemented/implemented.md` | What's live — single source of truth                  |

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): lint + type-check → test (real postgres + redis services) → build → deploy to Coolify (webhook on push to main).
