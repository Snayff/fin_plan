# finplan — Claude Code Context

Household financial planning SaaS built around a **Waterfall** model: income → committed spend → discretionary spend → surplus. Multi-member household support, goals, forecasting, and asset/liability tracking.

Full-stack TypeScript monorepo: Fastify backend + React/Vite frontend + shared Zod schemas. Currently in active rebuild phase (`feature/renew_finplan` branch).

---

## Commands

All commands use `bun run`. Never use npm or pnpm.

```bash
# Docker dev environment (primary workflow)
bun run start          # docker compose up -d (postgres:5432, backend:3001, frontend:3000)
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
  backend/    # Fastify + Prisma + tRPC + JWT auth
  frontend/   # React 18 + Vite + Tailwind + TanStack Query + Zustand + RxDB
packages/
  shared/     # Zod schemas and TypeScript types — imported by both apps
docs/
  0. reference/     # User references (AI cheatsheet, etc.)
  1. research/      # Competitor analysis
  2. design/        # Design anchors, philosophy, system, definitions
  3. architecture/  # Architecture, testing approach, auth lifecycle
  4. planning/      # Implementation plan + feature spec folders
  5. built/         # Completed features by category (income/committed/discretionary/surplus/overview/ui/infrastructure)
```

---

## Conventions

- **Package manager:** Bun — use `bun add`, `bun install`, `bun run`
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`. Prefix intentionally unused vars with `_`
- **Linting:** ESLint zero warnings — always run `bun run lint` before committing
- **Shared schemas:** Zod schemas live in `packages/shared/src/schemas/` — never duplicate between apps
- **Database changes:** Always use `bun run db:migrate` (interactive Prisma migrations) — never edit schema without a migration
- **No hardcoded colours:** Always use Tailwind design tokens — never hex values or `rgba()` in component code
- **No dashed borders:** Never use `border-dashed` in component code. The design system uses solid borders exclusively. Only two exceptions exist: `SnapshotDot` (auto vs manual distinction) and `CashflowYearBar` (today marker). All add/ghost buttons must follow the `GhostAddButton` pattern with solid borders.

---

## Panel Layout

All pages use `TwoPanelLayout`. Panel headers follow strict patterns defined in `docs/2. design/design-system.md` § 3.1.

- **Left panel headers** must use the `PageHeader` component — never inline markup
- **Left panel scroll structure:** Every left panel must use `flex flex-col h-full` with `PageHeader` as the first child and a `<div className="flex-1 overflow-y-auto">` wrapping all scrollable content below it. Page wrappers must use `h-full` (never `min-h-screen`) to maintain the height constraint chain.
- **Left panel content** (nav lists, summaries, selectors) uses `px-4` horizontal padding to align with `PageHeader`
- **Left panel nav buttons:** `px-4 py-2.5`, accent indicator pattern (`bg-{accent}/14 border-l-2 border-{accent} rounded-r-sm`)
- **Left panel footer:** `border-t border-foreground/10 px-4 py-3`
- **Right panel headers:** `px-4 py-3 border-b border-foreground/5`, title in `<h2>` with `font-heading text-base font-bold text-foreground`
- **Right panel add buttons:** use `GhostAddButton` pattern (`components/tier/GhostAddButton.tsx`) — never custom button styles

---

## Security Conventions

- **Auth middleware required:** Every new route must use `authMiddleware` in `preHandler` unless explicitly public
- **householdId from middleware only:** Never accept householdId from URL params for data scoping — always use `req.householdId!`
- **Throw, don't inline errors:** Use error class hierarchy (`NotFoundError`, `AuthenticationError`, etc.), never `reply.status().send()` for errors
- **Audit all mutations:** Wrap every create/update/delete in `audited()` with `actorCtx(req)`
- **No `any` in security paths:** Auth middleware, token handling, and API client must be fully typed
- **Generic auth messages:** Login/register errors must never reveal whether an account exists
- **Error masking:** Use `NotFoundError` for both "not found" and "not owned" — never reveal resource existence to unauthorised callers

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

Before implementing any feature, read the relevant specs in `docs/`:

| Location                           | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `docs/2. design/design-anchors.md` | Non-negotiable product invariants — read first       |
| `docs/2. design/design-system.md`  | Design tokens, components, typography, color, motion |
| `docs/2. design/definitions.md`    | Canonical tooltip text for financial terms           |
| `docs/3. architecture/`            | Architecture, testing approach, auth lifecycle       |
| `docs/4. planning/[feature]/`      | 22 feature spec folders (spec + plan per feature)    |

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): lint + type-check → test (real postgres service) → build → deploy to Coolify (webhook on push to main).

---

## Design Context

### Users

Household financial planners — typically one person managing finances for a couple or family. They come to finplan during calm, intentional moments (weekend planning sessions, monthly reviews) to understand where money flows and make forward-looking decisions. The job: see the full picture of income → committed spend → discretionary spend → surplus, and feel confident the plan holds together. UK-based, GBP only.

### Brand Personality

**Calm, Empowering, Clear.**

- **Calm**: Silence means everything is fine. No anxiety-inducing alerts, no red/green judgement on financial values. Amber is the only gentle nudge, and it's informational, never blocking.
- **Empowering**: Users leave feeling more in control, not more confused. The interface gives agency through clarity — arithmetic and mechanics, never prescriptive advice.
- **Clear**: Every element earns its place. Three-font system with strict roles (Outfit headings, Nunito Sans body, JetBrains Mono numbers). Four waterfall tiers each with a distinct, semantically protected colour. No ambiguity.

**Emotional goals**: Confidence and control ("I understand my finances"), relief and calm ("this isn't scary"), accomplishment and progress ("I'm getting better at this").

### Aesthetic Direction

**Dark-only interface** on a deep navy base (`#080a14`) with subtle radial ambient glows — never flat black. Cool-toned palette: indigo, violet, electric blue, teal-mint. Colour is used sparingly and meaningfully, never decoratively.

**References**: Monzo/Revolut (friendly financial data presentation, approachable without being childish), Raycast/Arc (beautiful dark interfaces, refined typography, delightful micro-interactions).

**Anti-references**: Generic SaaS dashboards (cookie-cutter blue gradients, corporate feel). Gamified finance apps (badges, streaks, confetti everywhere, infantilizing tone). Overly playful/illustrative interfaces (cartoon illustrations, bubbly shapes, emoji-heavy).

**Visual language**:

- Tier colours are semantically exclusive to their waterfall tier — never repurposed for status or attention
- Callout gradients (blue→purple, purple→teal) for engagement and hero emphasis only — never warnings
- Red = app errors only, green = UI confirmations only — never colour-code financial values
- Amber is the single attention signal — staleness, cashflow notes, nudges
- Generous 8px grid spacing with calm, breathing layouts
- 150–200ms micro-interactions (slide/fade) with ease-out timing, all respecting `prefers-reduced-motion`

### Design Principles

1. **Reinforce the waterfall** — Every design decision should make the income → committed → discretionary → surplus cascade more intuitive. The four tiers and their colours are the visual backbone.
2. **Silence is approval** — If a value is healthy, show nothing. No green checkmarks, no "looking good!" badges. Attention (amber) appears only when something is genuinely noteworthy. Calm is the default state.
3. **Precision without density** — Show exact numbers in tabular monospace, but give them room to breathe. The interface should feel spacious and scannable, not spreadsheet-like. Typography hierarchy does the heavy lifting.
4. **Empower, don't advise** — Surface the arithmetic clearly so users draw their own conclusions. No recommendations, no scoring, no "you should..." language. Use "budgeted", "planned", "allocated" — never "spent" or "paid".
5. **Earn every pixel** — Every colour, icon, and animation serves a specific, targeted purpose. If removing something changes nothing, remove it.
