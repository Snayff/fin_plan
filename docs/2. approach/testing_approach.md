# Testing Approach (Current State)

Last updated: 2026-02-14

This document reflects the **current implemented testing strategy** in the repository.

## 1) Test Runner and Tooling

The codebase uses **Bun test** as the active test runner across packages.

- Backend: `apps/backend` uses Bun tests with a custom isolated runner
- Frontend: `apps/frontend` uses Bun tests + happy-dom + Testing Library
- Shared package: `packages/shared` uses Bun tests for schema validation

Root execution is orchestrated through Turborepo:

- `bun run test` (root) → `turbo run test`

---

## 2) Test Layers Used Today

## Layer A — Utility / Pure Unit Tests

Files in `apps/backend/src/utils/*.test.ts` cover pure logic and helper functions:

- JWT helper behavior
- password hashing helpers
- error class behavior
- liability math/projection utilities
- date helpers

These tests are the fastest and are intended to catch core logic regressions quickly.

## Layer B — Shared Schema Contract Tests

Files in `packages/shared/src/schemas/*.test.ts` validate Zod schemas that are consumed by both frontend and backend.

Coverage pattern:

- valid payload acceptance
- invalid payload rejection
- enum constraints
- defaults/transforms/coercion behavior

This is a key anti-regression layer for API contract consistency.

## Layer C — Backend Service Tests

Files in `apps/backend/src/services/*.test.ts` verify business rules with **mocked Prisma**.

Current pattern:

- `mock.module("../config/database", () => ({ prisma: prismaMock }))`
- optional mocks for utility dependencies
- `resetPrismaMocks()` in `beforeEach`
- success path + validation + not-found/error paths
- transaction boundary checks (`$transaction` behavior)

## Layer D — Backend Route Tests

Files in `apps/backend/src/routes/*.test.ts` are lightweight integration-style HTTP tests via Fastify `inject()`.

These tests typically mock:

- service module
- auth middleware behavior

And verify:

- status codes
- auth enforcement
- request validation behavior (via real route schemas)
- response shape and cookie behavior where applicable

## Layer E — Frontend State/UI Tests

Current frontend tests are focused and intentional:

- Zustand auth store behavior
- auth page rendering + interactions

Helpers:

- `renderWithProviders()` for QueryClient + router wrappers
- `src/test/setup.ts` with happy-dom registration and global mocks

---

## 3) Backend Test Infrastructure

### Isolated test execution

`apps/backend/scripts/run-tests.ts` executes each backend test file in a separate Bun process.

Reason: Bun `mock.module()` patches global module cache; per-file process isolation prevents cross-file mock leakage.

### Shared Prisma mock

`apps/backend/src/test/mocks/prisma.ts` provides deep model mocks + `$transaction` callback support.

### Fixture builders

`apps/backend/src/test/fixtures/index.ts` provides reusable data factories (user/account/transaction/asset/liability/category/etc.).

### Fastify helper

`apps/backend/src/test/helpers/fastify.ts` builds a minimal Fastify app for route tests (cookie plugin only, no heavy production plugins).

---

## 4) Commands (Current)

```bash
# All packages
bun run test

# Backend (isolated file runner)
cd apps/backend && bun run test

# Backend single file
cd apps/backend && bun run test:file src/services/goal.service.test.ts

# Shared package
cd packages/shared && bun test

# Frontend package
cd apps/frontend && bun test --preload ./src/test/setup.ts
```

---

## 5) Conventions for Adding New Tests

### Backend service test

1. Create `*.service.test.ts` beside the service
2. Mock Prisma via `mock.module`
3. Reset mocks in `beforeEach`
4. Cover success + validation + ownership/not-found + edge cases
5. Assert transaction behavior for multi-step writes

### Backend route test

1. Create `*.routes.test.ts` beside the route
2. Mock service and auth middleware
3. Use `buildTestApp()` + `app.inject()`
4. Assert auth, validation errors, response status/body

### Shared schema test

1. Create `*.schemas.test.ts` beside schema file
2. Use `safeParse` for validation assertions
3. Cover required/optional/enum/bounds/transforms

---

## 6) Current Gaps / Next Priorities

1. Expand frontend coverage beyond auth/store into feature pages and components.
2. Add real DB integration tests (e.g., Testcontainers/Postgres) for Prisma query correctness.
3. Add E2E tests for critical journeys (registration → account → transaction → dashboard).
4. Add CI quality gates for test, lint, and type-check on PR.

This layered approach already provides good protection for business rules and API contracts, while leaving room for stronger end-to-end confidence.
