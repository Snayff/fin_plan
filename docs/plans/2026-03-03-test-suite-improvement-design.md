# Test Suite Improvement Design

**Date:** 2026-03-03
**Goal:** Regression safety — catch breakage quickly as features are actively built
**Primary risk:** Integration boundary — frontend calling the backend with wrong contracts, or backend changing shapes silently

---

## Problem Statement

The current test suite has two structural weaknesses:

1. **Frontend tests mock at the service module layer.** `mock.module('../services/account.service', ...)` means the actual HTTP contract (URL, method, headers, body shape, response shape) is never exercised. The integration boundary — where the frontend's `api.ts` fetch wrapper calls the backend — is completely untested.

2. **Large coverage gaps in both layers.** Several routes, services, and pages have zero tests, meaning regressions in these areas go undetected until a human notices.

---

## Architecture

**MSW (Mock Service Worker)** is installed in the frontend test environment. It intercepts real `fetch()` calls made by `lib/api.ts` at the network layer.

```
Test
  → frontend service (e.g. accountService.getAccounts())
    → api.ts (fetch wrapper)
      → MSW intercepts fetch
        → returns fixture response (shaped by shared types)
          → service parses response
            → test asserts correct data / state
```

This means:
- If a service calls the wrong URL or method → test fails
- If a service omits the Authorization header → MSW returns 401 → test fails
- If the backend changes its response shape → fixture is updated → tests reflect the change

The `@finplan/shared` Zod schemas and TypeScript types are the **single source of truth** for handler response fixtures.

---

## Scope

### Tier 1 — Infrastructure

Install and configure MSW in `apps/frontend`:

- `bun add -d msw` in the frontend package
- `src/test/msw/handlers.ts` — one handler per API route, grouped by domain
- `src/test/msw/server.ts` — exports `server` (Node.js MSW server)
- Update `src/test/setup.ts` — start/reset/close MSW server around tests

Handler conventions:
- Requests without `Authorization: Bearer ...` return `401 { error: { code: "AUTHENTICATION_ERROR" } }`
- Default handlers return realistic happy-path fixture data typed against the shared types
- Individual tests can override with `server.use(http.get(...))` for error/edge cases

### Tier 2 — Frontend Service Tests

Write tests for each frontend service. Each test file:
- Calls the service method directly (not via a component)
- Asserts the correct data is returned on success
- Asserts 401 responses trigger `useAuthStore.setUnauthenticated()`
- Asserts 4xx/5xx responses throw with the correct error message

Services to cover:
- `account.service.ts`
- `transaction.service.ts`
- `budget.service.ts`
- `goal.service.ts`
- `liability.service.ts`
- `asset.service.ts`
- `auth.service.ts`
- `category.service.ts`
- `household.service.ts`

### Tier 3 — Missing Backend Routes

Add route tests using the existing `buildTestApp` + Fastify `inject` pattern. Each file mocks the corresponding service module and the auth middleware, then exercises all HTTP endpoints.

Missing route files:
- `transaction.routes.ts` — most-used feature, highest regression risk
- `dashboard.routes.ts` — loaded on every login
- `category.routes.ts`
- `households.ts`
- `invite.ts`

### Tier 4 — Missing Backend Services

Add service tests using the existing Prisma mock + fixture builder pattern.

Missing services:
- `household.service.ts`
- `category.service.ts`

### Tier 5 — Frontend Page Coverage

Add page-level tests for untested pages (using the existing `renderWithProviders` + MSW pattern):

- `DashboardPage` — verify summary data renders and loading/error states work
- `AccountsPage` — render list, open create form, trigger delete
- `GoalsPage` — render list, progress display, create/delete
- `LiabilitiesPage` — render list, payoff projection trigger

Upgrade `TransactionsPage` — current test only covers the error/retry state. Add:
- Happy path: renders transaction list
- Filter: applying a filter changes visible rows
- Delete: confirm dialog → API call → row removed

---

## Data Flow Details

### MSW Handler Structure

```typescript
// src/test/msw/handlers.ts
import { http, HttpResponse } from 'msw'

export const accountHandlers = [
  http.get('/api/accounts', ({ request }) => {
    if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
      return HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
    }
    return HttpResponse.json({ accounts: [mockAccount] })
  }),
  // ...
]

export const handlers = [...accountHandlers, ...transactionHandlers, ...]
```

### Frontend Service Test Structure

```typescript
// account.service.test.ts
import { server } from '../test/msw/server'
import { http, HttpResponse } from 'msw'
import { accountService } from './account.service'
import { setAccessToken } from '../test/helpers/auth'

beforeEach(() => setAccessToken('test-token'))
afterEach(() => server.resetHandlers())

it('getAccounts returns accounts list', async () => {
  const result = await accountService.getAccounts()
  expect(result.accounts).toHaveLength(1)
})

it('getAccounts throws on 401', async () => {
  server.use(http.get('/api/accounts', () =>
    HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
  ))
  await expect(accountService.getAccounts()).rejects.toMatchObject({ statusCode: 401 })
})
```

---

## Error Path Coverage

Every service test covers:
- `401` — re-thrown with `statusCode: 401`; authStore's `setUnauthenticated` is called via the API client's interceptor
- `404` — re-thrown with the backend's error message
- `400` (validation error) — re-thrown with the backend's error message
- Network failure — re-thrown

Every route test (backend) covers:
- Missing auth header → 401
- Happy path → correct status code + response shape
- Service throws `NotFoundError` → 404
- Service throws `ValidationError` → 400

---

## What Is Out of Scope

- E2E tests (Playwright) — not prioritized in this effort; can be added later
- Chart component tests — low regression risk, complex to test meaningfully
- Design system (`/design` page) components — not user-facing features
- `email.service.ts` and `audit.service.ts` — side-effect services, lower regression risk
- `tokenBlacklist.ts` — Redis wrapper, integration-tested implicitly via auth service

---

## Success Criteria

After this work:
1. Every frontend service call hits a real `fetch()` that MSW validates at the HTTP level
2. Every backend route has at least one test per HTTP method + auth check
3. The four most-used pages (`Dashboard`, `Accounts`, `Goals`, `Liabilities`) have basic render + error state tests
4. `TransactionsPage` tests cover the happy path and delete flow, not just error state
5. `household.service.ts` and `category.service.ts` have unit tests (given active development on this branch)
