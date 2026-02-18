# Architecture (Current State)

Last updated: 2026-02-14

This document reflects the **implemented architecture** in the repository today (not just the original target vision).

## 1) Monorepo Structure

The project is organized as a Bun/Turborepo monorepo:

- `apps/backend` — Fastify + Prisma API
- `apps/frontend` — React + Vite application
- `packages/shared` — shared Zod schemas + inferred TypeScript types
- `docs` — approach/design/build documentation

### Why this matters

- shared validation/contracts are imported by both backend and frontend
- consistent build/test/lint workflows via root scripts and Turbo
- clear separation between product apps and shared platform code

---

## 2) Backend Architecture (Implemented)

### Stack

- Runtime/tooling: **Bun** runtime with Bun scripts
- Framework: **Fastify**
- Database access: **Prisma** + PostgreSQL
- Validation: **Zod** (largely via `@finplan/shared`)
- Auth/security: JWT access tokens + refresh tokens, cookie + CSRF strategy

### Layering Pattern

Implemented backend follows:

1. **Routes layer** (`src/routes`)
   - HTTP concerns only
   - parse/validate payloads
   - call services
   - shape responses + status codes
2. **Service layer** (`src/services`)
   - business logic
   - ownership checks
   - transaction boundaries (`prisma.$transaction`)
3. **Utility/config/middleware layer** (`src/utils`, `src/config`, `src/middleware`)
   - auth helpers, error classes, cross-cutting concerns

### API Style

- REST-first endpoints under `/api/*`
- consistent JSON response envelopes per route family
- route protection with `authMiddleware`

### Security Baseline in Server

`src/server.ts` registers:

- CORS
- cookie plugin
- CSRF protection
- Helmet
- rate limiting
- global error handler

### Data Model Status

Prisma schema currently includes implemented domains:

- users/auth sessions
- accounts + transactions + categories
- assets
- liabilities
- goals + goal contributions
- budget, recurring rules, forecasts (model-level support)
- devices/audit logs

### Sync / Local-first Status (important)

- WebSocket route for sync exists (`/ws/sync`) as a placeholder
- full RxDB replication + conflict-resolution protocol is **not yet implemented end-to-end**

So: local-first remains a roadmap direction, not current runtime behavior.

---

## 3) Frontend Architecture (Implemented)

### Stack

- React + TypeScript + Vite
- Styling: Tailwind + shadcn/ui patterns
- Server state: TanStack Query
- Client/auth state: Zustand
- API transport: centralized `apiClient`

### Frontend Patterns

- `src/services/*` isolate HTTP calls by domain
- `src/components/*` and `src/pages/*` follow feature-oriented organization
- `src/lib/api.ts` centrally handles:
  - cookies/credentials
  - CSRF token fetching
  - access token injection
  - refresh-token retry on 401

This removes duplicated token plumbing from feature services.

---

## 4) Shared Contract Pattern

`packages/shared` is the single source of truth for core request schemas/types:

- account, transaction, category, asset, liability, goal schemas
- schema-derived TS types exported for both apps

This enforces contract consistency between frontend forms and backend routes.

---

## 5) Architectural Conventions Used Today

1. **Route thin, service thick**
2. **Schema-first validation with shared package**
3. **Per-user ownership checks in services**
4. **Use DB transactions for multi-step writes**
5. **Centralize cross-cutting concerns** (auth, errors, API token handling)

---

## 6) Known Gaps vs Original Vision

These are intentional current-state gaps:

- full local-first sync engine (RxDB replication/conflict resolution)
- advanced forecasting/simulation execution paths
- complete E2E/integration test layers with real infrastructure

The current architecture supports these additions without major structural rewrites.
