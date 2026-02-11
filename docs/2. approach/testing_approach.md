# Testing Strategy

## Overview

The test suite is structured in four layers that map to the application's architecture. Tests are co-located with source files (`*.test.ts` next to the module they test) and use factory fixtures for data isolation. The entire suite runs without any external services — no database, no Redis, no network.

**Current state:** 377 tests across 24 test files, all passing.

| Package | Files | Tests | What's covered |
|---------|-------|-------|----------------|
| Backend | 16 | 240 | Utils, services, middleware, routes |
| Shared | 5 | 107 | Zod validation schemas |
| Frontend | 3 | 30 | Zustand store, auth pages |

## Test Layers

### Layer 1: Pure Unit Tests

**Backend utilities** (`apps/backend/src/utils/*.test.ts`)

Tests for functions with no dependencies on Prisma, Fastify, or external services. These are the fastest tests and catch regressions in core business logic.

- `liability.utils.test.ts` — 45 tests covering amortization schedules, interest calculations, payoff projections, minimum payment validation, and boundary values (zero balances, 0% interest, single-payment payoff)
- `jwt.test.ts` — 14 tests for token generation, verification, expiry, and decode
- `password.test.ts` — 5 tests for bcrypt hashing and verification
- `balance.utils.test.ts` — 5 tests for the `endOfDay` date utility
- `errors.test.ts` — 20 tests for all custom error classes (status codes, error codes, inheritance)

**Shared schemas** (`packages/shared/src/schemas/*.test.ts`)

Tests for Zod schemas that are shared between frontend and backend. These validate that schemas accept valid input, reject invalid input, apply defaults, and run refinements/transforms correctly.

- `liability.schemas.test.ts` — 30 tests (create, update, allocate payment schemas)
- `asset.schemas.test.ts` — 26 tests (create, update, update value schemas)
- `transaction.schemas.test.ts` — 21 tests (create, update with UUID and enum validation)
- `category.schemas.test.ts` — 16 tests (color hex validation, defaults)
- `account.schemas.test.ts` — 14 tests (type enum, openingBalance default, currency default)

### Layer 2: Service Tests

**Backend services** (`apps/backend/src/services/*.test.ts`)

Each service test file mocks Prisma (via `src/test/mocks/prisma.ts`) and any utility dependencies, then verifies the service's business logic — data flow, error handling, transaction boundaries.

- `auth.service.test.ts` — 16 tests: registration (hashing, token generation, email normalisation, conflict detection), login (credential validation), token refresh
- `account.service.test.ts` — 16 tests: CRUD, `$transaction` for opening balance, soft vs hard delete, account summary aggregation
- `liability.service.test.ts` — 18 tests: creation with payment validation, transaction allocation (expense-only check, amount tolerance of +/-0.01), payment removal with balance restoration, weighted average interest in summaries
- `asset.service.test.ts` — 14 tests: creation with initial value history entry, value updates, summary with gain calculations (handles null purchaseValue)
- `transaction.service.test.ts` — 14 tests: dynamic filter building, pagination, account ownership verification, category validation
- `dashboard.service.test.ts` — 7 tests: net worth (accounts + assets - liabilities), savings rate, trend data

**Middleware** (`apps/backend/src/middleware/auth.middleware.test.ts`)

- 6 tests: valid token attaches user to request, missing header, invalid format, expired/invalid tokens

### Layer 3: Frontend Tests

**Stores** (`apps/frontend/src/stores/authStore.test.ts`)

- 17 tests for the Zustand auth store: initial state, login (loading states, success, error propagation), logout (state clearing, API call, graceful failure handling), token updates

**Pages** (`apps/frontend/src/pages/auth/*.test.tsx`)

- `LoginPage.test.tsx` — 6 tests: renders fields, form submission calls store, loading state, error display
- `RegisterPage.test.tsx` — 7 tests: renders all fields, client-side password validation (mismatch, too short), successful registration, API error display

### Layer 4: Route Integration Tests

**Routes** (`apps/backend/src/routes/*.test.ts`)

These tests use Fastify's `inject()` method to make HTTP requests against a lightweight test app. The service layer is fully mocked — these tests verify HTTP concerns: status codes, request validation (real Zod schemas from `@finplan/shared`), auth enforcement, response shapes, and cookie handling.

- `auth.routes.test.ts` — 19 tests: register (201, validation, cookie setting), login (200, validation, credential errors), /me (auth enforcement, 404), refresh (body and cookie token sources, missing token), logout (cookie clearing, auth enforcement)
- `account.routes.test.ts` — 10 tests: CRUD with schema defaults verification, auth enforcement, validation errors for invalid type/missing name
- `liability.routes.test.ts` — 15 tests: CRUD, payment allocation with UUID validation, payoff projection, summary, auth enforcement, negative balance/rate bounds validation
- `asset.routes.test.ts` — 16 tests: CRUD, value update with source/date passthrough, history with daysBack query parameter (default 90), summary, auth enforcement, validation for negative values/invalid types

## Test Infrastructure

### Configuration

Each package has its own `vitest.config.ts`:

- **Backend** (`apps/backend/vitest.config.ts`): Node environment, path aliases for `@/` and `@finplan/shared`, setup file for env vars, v8 coverage provider
- **Shared** (`packages/shared/vitest.config.ts`): Minimal config with `globals: true`
- **Frontend** (`apps/frontend/vitest.config.ts`): jsdom environment, path aliases, setup file for DOM mocks

### Setup Files

**Backend** (`apps/backend/src/test/setup.ts`): Sets `process.env` variables before any module loads. This is critical because `config/env.ts` validates environment variables at import time using Zod — if env vars aren't set before the config module is imported, validation fails.

**Frontend** (`apps/frontend/src/test/setup.ts`): Imports `@testing-library/jest-dom` matchers, stubs `fetch`, sets `VITE_API_URL`, and mocks `window.location`.

### Prisma Mock (`apps/backend/src/test/mocks/prisma.ts`)

A deep mock of PrismaClient where every model has mocked `findUnique`, `findMany`, `create`, `update`, `delete`, `aggregate`, and `count` methods. The `$transaction` mock passes itself as the `tx` argument to callbacks, so `tx.model.method()` resolves to the same mocks as `prisma.model.method()`. A `resetPrismaMocks()` function clears all mocks between tests.

### Factory Fixtures (`apps/backend/src/test/fixtures/index.ts`)

Builder functions that produce test data with sensible defaults and auto-incrementing IDs: `buildUser()`, `buildAccount()`, `buildTransaction()`, `buildAsset()`, `buildLiability()`, `buildLiabilityPayment()`, `buildAssetValueHistory()`, `buildCategory()`. Each accepts an overrides object for customisation.

### Fastify Test Helper (`apps/backend/src/test/helpers/fastify.ts`)

`buildTestApp()` creates a lightweight Fastify instance with only the cookie plugin registered. Rate limiting, CSRF protection, and helmet are skipped so tests run fast and deterministically. Route tests register the error handler and specific route plugins on this app, then use `app.inject()` for requests.

### Frontend Test Helpers

- `renderWithProviders()` (`apps/frontend/src/test/helpers/render.tsx`): Wraps components in `QueryClientProvider` + `MemoryRouter`
- `setAuthenticated()` / `setUnauthenticated()` (`apps/frontend/src/test/helpers/auth.ts`): Directly set Zustand store state for testing authenticated/unauthenticated scenarios

## Running Tests

```bash
# Run all tests across the monorepo
npx turbo test

# Run tests for a specific package
cd apps/backend && npx vitest run
cd apps/frontend && npx vitest run
cd packages/shared && npx vitest run

# Watch mode (re-runs on file changes)
cd apps/backend && npx vitest

# Run a specific test file
cd apps/backend && npx vitest run src/services/auth.service.test.ts

# Run with coverage
cd apps/backend && npx vitest run --coverage
```

## Writing New Tests

### Adding a backend service test

1. Create `src/services/<name>.service.test.ts` next to the service file
2. Mock Prisma: `vi.mock("../config/database", () => ({ prisma: prismaMock }));`
3. Import and use `prismaMock` from `../test/mocks/prisma`
4. Import fixtures from `../test/fixtures` and use `buildXxx()` to create test data
5. Call `resetPrismaMocks()` in `beforeEach`
6. Mock any utility dependencies with `vi.mock()`
7. Test success paths, error paths, and edge cases

### Adding a route integration test

1. Create `src/routes/<name>.routes.test.ts` next to the route file
2. Mock the service module (return mock functions for each method)
3. Mock `../middleware/auth.middleware` with a `vi.fn()` that checks for Bearer tokens
4. In `beforeAll`: build test app, register error handler, register routes with prefix, call `app.ready()`
5. Test: valid requests (correct status + response shape), validation failures (400), auth enforcement (401), service error propagation

### Adding a frontend component test

1. Create `<Component>.test.tsx` next to the component
2. Use `renderWithProviders()` from `src/test/helpers/render`
3. Use `@testing-library/user-event` for interactions (type, click)
4. Mock `fetch` or Zustand store methods as needed
5. Assert on visible text, form behaviour, and navigation

### Adding a shared schema test

1. Create `src/schemas/<name>.schemas.test.ts` next to the schema file
2. Test with `schema.parse()` for valid input and `schema.safeParse()` for invalid input
3. Cover: required fields, optional fields, defaults, type coercion, refinements, transforms, boundary values

## Regression Detection

The test suite catches regressions through several mechanisms:

- **Financial calculation boundary tests**: Zero balances, 0% interest rates, single-payment payoffs, and edge cases in amortization ensure calculation changes are immediately caught
- **Schema validation tests**: Any change to Zod schemas (field additions, type changes, removed defaults) breaks the corresponding test
- **Service contract tests**: Mock return values define the expected interface between services and their dependencies — refactoring a service that changes its Prisma queries or error handling will fail these tests
- **Route integration tests with real schemas**: Request bodies are validated by the actual Zod schemas from `@finplan/shared`, so schema changes that break API contracts are caught even when the service layer is mocked
- **Auth enforcement tests**: Every protected route has a "returns 401 without auth" test, so accidentally removing `authMiddleware` from a route is caught

## Future Roadmap

These areas are not yet implemented but are natural next steps:

**More frontend coverage**: Dashboard components, account/liability/asset CRUD pages, protected route guards, React Query cache behaviour.

**E2E tests (Playwright)**: Critical user journeys — registration through first transaction, liability creation through payment allocation, dashboard data accuracy. These would run against a real backend with a test database.

**CI pipeline (GitHub Actions)**: Run linting, type checking, and the full test suite on every pull request. Run E2E tests on merges to main.

**Database integration tests (Testcontainers)**: Spin up a real PostgreSQL instance to test Prisma queries, migrations, and transaction isolation without mocks.

**Performance testing**: Load testing with k6 for API endpoints handling large datasets (10,000+ transactions, complex aggregations).
