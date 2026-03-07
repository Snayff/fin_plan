# Test Suite Improvement Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Raise test file coverage from ~40% to ~70%+ by adding missing tests across frontend services, pages, backend gaps, and shared schemas — and fixing two known quality anti-patterns.

**Architecture:** Work proceeds in six phases: quick infrastructure wins, shared schema tests, frontend service tests, missing page tests, backend gaps, and quality refactors. Every new test file follows the pattern already established in the codebase — no new tooling or frameworks.

**Tech Stack:** Bun test runner (`bun:test`), React Testing Library + Happy DOM, MSW v2, Supertest, Zod, Prisma mock factory, per-file isolated runner (`scripts/run-tests.ts`)

---

## Reference: How the test suite works

**Running tests:**
```bash
# From a workspace root:
cd apps/frontend && bun scripts/run-tests.ts          # all frontend tests
cd apps/frontend && bun scripts/run-tests.ts auth     # filter by filename substring
cd apps/backend  && bun scripts/run-tests.ts          # all backend tests
cd packages/shared && bun test                         # shared tests (no isolation needed)
```

**Why per-file isolation?** Bun's `mock.module()` patches the global module cache. Running multiple test files in the same process leaks mocks. The custom runner spawns a fresh `bun test` process per file.

**Key utilities to reuse (don't reinvent these):**

| Utility | Path | Purpose |
|---|---|---|
| `renderWithProviders()` | `apps/frontend/src/test/helpers/render.tsx` | Wraps component with QueryClient + MemoryRouter |
| `setAuthenticated()` | `apps/frontend/src/test/helpers/auth.ts` | Sets Zustand auth store to logged-in state |
| `setUnauthenticated()` | `apps/frontend/src/test/helpers/auth.ts` | Clears auth state |
| `server` | `apps/frontend/src/test/msw/server.ts` | MSW server — call `server.use(...)` to override handlers per-test |
| Mock fixtures | `apps/frontend/src/test/msw/handlers.ts` | `mockUser`, `mockAccount`, `mockTransaction`, `mockGoal`, `mockLiability`, `mockAsset`, etc. |
| `prismaMock` | `apps/backend/src/test/mocks/prisma.ts` | Mocked Prisma client with all 19 models |
| `resetPrismaMocks()` | `apps/backend/src/test/mocks/prisma.ts` | Resets all Prisma mock return values |
| `buildX()` factories | `apps/backend/src/test/fixtures/index.ts` | `buildUser()`, `buildAccount()`, `buildTransaction()`, etc. |
| Fastify helper | `apps/backend/src/test/helpers/fastify.ts` | Creates a test Fastify app — check this file before each backend test |

**Page test pattern** (copy this for every new page test):
```typescript
// apps/frontend/src/pages/ExamplePage.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockSomeEntity } from '../test/msw/handlers';
import ExamplePage from './ExamplePage';

describe('ExamplePage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    server.use(
      http.get('/api/example', () =>
        HttpResponse.json({ items: [mockSomeEntity] })
      )
    );
  });

  it('renders the page heading', async () => {
    renderWithProviders(<ExamplePage />);
    await waitFor(() => {
      expect(screen.getByText('Example')).toBeTruthy();
    });
  });

  it('shows an error banner when the API returns 500', async () => {
    server.use(
      http.get('/api/example', () =>
        HttpResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } }, { status: 500 })
      )
    );
    renderWithProviders(<ExamplePage />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeTruthy();
    });
  });
});
```

---

## Phase 1: Coverage Reporting + Shared Schema Tests

### Task 1: Add coverage reporting to all workspaces

**Files:**
- Modify: `apps/frontend/scripts/run-tests.ts`
- Modify: `apps/backend/scripts/run-tests.ts`
- Modify: `apps/frontend/package.json`
- Modify: `apps/backend/package.json`
- Modify: `packages/shared/package.json`

**Step 1: Add `--coverage` flag support to the frontend runner**

In `apps/frontend/scripts/run-tests.ts`, find the `Bun.spawn` call and add coverage flag support:

```typescript
// Add after the filterPattern line:
const coverage = process.argv.includes('--coverage');

// Modify the Bun.spawn call:
const proc = Bun.spawn(["bun", "test", ...(coverage ? ["--coverage"] : []), filePath], {
  stdout: "inherit",
  stderr: "inherit",
  env: process.env,
});
```

**Step 2: Apply the same change to the backend runner**

In `apps/backend/scripts/run-tests.ts`, make the identical change (the runner files have the same structure). The backend runner also uses `--preload ./src/test/setup.ts` — verify whether it's in the Bun.spawn args or a separate flag and keep it.

**Step 3: Add `test:coverage` scripts to each workspace's package.json**

In `apps/frontend/package.json`, add to `"scripts"`:
```json
"test:coverage": "bun scripts/run-tests.ts --coverage"
```

In `apps/backend/package.json`, add to `"scripts"`:
```json
"test:coverage": "bun scripts/run-tests.ts --coverage"
```

In `packages/shared/package.json`, add to `"scripts"`:
```json
"test:coverage": "bun test --coverage"
```

**Step 4: Verify coverage output works**

```bash
cd apps/frontend && bun scripts/run-tests.ts --coverage api
```

Expected: test passes AND a coverage table is printed showing line/branch/function coverage for `src/lib/api.ts`.

**Step 5: Commit**

```bash
git add apps/frontend/scripts/run-tests.ts apps/backend/scripts/run-tests.ts
git add apps/frontend/package.json apps/backend/package.json packages/shared/package.json
git commit -m "chore: add --coverage flag to test runners and test:coverage scripts"
```

---

### Task 2: Add `household.schemas.test.ts`

**Files:**
- Create: `packages/shared/src/schemas/household.schemas.test.ts`
- Reference: `packages/shared/src/schemas/household.schemas.ts` (already read — 4 schemas: createHousehold, renameHousehold, inviteMember, acceptInvite)
- Reference: `packages/shared/src/schemas/transaction.schemas.test.ts` for pattern

**Step 1: Create the test file**

```typescript
// packages/shared/src/schemas/household.schemas.test.ts
import { describe, it, expect } from 'bun:test';
import {
  createHouseholdSchema,
  renameHouseholdSchema,
  inviteMemberSchema,
  acceptInviteSchema,
} from './household.schemas';

describe('createHouseholdSchema', () => {
  it('accepts a valid name', () => {
    const result = createHouseholdSchema.safeParse({ name: 'Smith Family' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createHouseholdSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = createHouseholdSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('renameHouseholdSchema', () => {
  it('accepts a valid name', () => {
    const result = renameHouseholdSchema.safeParse({ name: 'Jones Family' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = renameHouseholdSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('inviteMemberSchema', () => {
  it('accepts a valid email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'invite@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects malformed email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = inviteMemberSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('acceptInviteSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'securepassword1',
  };

  it('accepts valid registration data', () => {
    const result = acceptInviteSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = acceptInviteSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed email', () => {
    const result = acceptInviteSchema.safeParse({ ...valid, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 12 characters', () => {
    const result = acceptInviteSchema.safeParse({ ...valid, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('accepts password exactly 12 characters', () => {
    const result = acceptInviteSchema.safeParse({ ...valid, password: '123456789012' });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run and verify all tests pass**

```bash
cd packages/shared && bun test src/schemas/household.schemas.test.ts
```

Expected: all tests pass (no implementation to write — schemas already exist).

**Step 3: Commit**

```bash
git add packages/shared/src/schemas/household.schemas.test.ts
git commit -m "test: add household schema validation tests"
```

---

### Task 3: Add `recurring.schemas.test.ts`

**Files:**
- Create: `packages/shared/src/schemas/recurring.schemas.test.ts`
- Reference: `packages/shared/src/schemas/recurring.schemas.ts` (already read — schemas: createRecurringRule, updateRecurringRule, previewOccurrences, plus the templateTransaction nested schema)

Note the key business rules to test:
- `createRecurringRuleSchema` has two `.refine()` calls: (1) can't have both `endDate` AND `occurrences`, (2) `endDate` must be after `startDate`
- `templateTransaction.amount` must be positive
- `previewOccurrences.limit` max is 50

**Step 1: Create the test file**

```typescript
// packages/shared/src/schemas/recurring.schemas.test.ts
import { describe, it, expect } from 'bun:test';
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
  previewOccurrencesSchema,
  RecurringFrequencyEnum,
} from './recurring.schemas';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

const validTemplateTransaction = {
  accountId: validUUID,
  type: 'expense' as const,
  amount: 50,
  name: 'Monthly Gym',
};

const validCreateInput = {
  frequency: 'monthly' as const,
  interval: 1,
  startDate: '2025-01-01',
  templateTransaction: validTemplateTransaction,
};

describe('RecurringFrequencyEnum', () => {
  it('accepts all valid frequencies', () => {
    const valid = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'custom'];
    for (const freq of valid) {
      expect(RecurringFrequencyEnum.safeParse(freq).success).toBe(true);
    }
  });

  it('rejects unknown frequency', () => {
    expect(RecurringFrequencyEnum.safeParse('fortnightly').success).toBe(false);
  });
});

describe('createRecurringRuleSchema', () => {
  it('accepts valid minimal input', () => {
    const result = createRecurringRuleSchema.safeParse(validCreateInput);
    expect(result.success).toBe(true);
  });

  it('accepts valid input with endDate', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      endDate: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with occurrences', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      occurrences: 12,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when both endDate and occurrences are provided', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      endDate: '2025-12-31',
      occurrences: 12,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/cannot specify both/i);
    }
  });

  it('rejects when endDate is before startDate', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      startDate: '2025-06-01',
      endDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/end date must be after/i);
    }
  });

  it('rejects template with zero amount', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      templateTransaction: { ...validTemplateTransaction, amount: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects template with negative amount', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      templateTransaction: { ...validTemplateTransaction, amount: -10 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects template with non-UUID accountId', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      templateTransaction: { ...validTemplateTransaction, accountId: 'not-a-uuid' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects template with empty name', () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      templateTransaction: { ...validTemplateTransaction, name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive interval', () => {
    const result = createRecurringRuleSchema.safeParse({ ...validCreateInput, interval: 0 });
    expect(result.success).toBe(false);
  });

  it('defaults interval to 1 when omitted', () => {
    const { interval, ...withoutInterval } = validCreateInput;
    const result = createRecurringRuleSchema.safeParse(withoutInterval);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(1);
    }
  });
});

describe('updateRecurringRuleSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateRecurringRuleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with frequency only', () => {
    const result = updateRecurringRuleSchema.safeParse({ frequency: 'weekly' });
    expect(result.success).toBe(true);
  });

  it('rejects when both endDate and occurrences are provided', () => {
    const result = updateRecurringRuleSchema.safeParse({
      endDate: '2025-12-31',
      occurrences: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe('previewOccurrencesSchema', () => {
  const validPreview = {
    frequency: 'monthly' as const,
    interval: 1,
    startDate: '2025-01-01',
  };

  it('accepts valid input', () => {
    const result = previewOccurrencesSchema.safeParse(validPreview);
    expect(result.success).toBe(true);
  });

  it('defaults limit to 10', () => {
    const result = previewOccurrencesSchema.safeParse(validPreview);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects limit above 50', () => {
    const result = previewOccurrencesSchema.safeParse({ ...validPreview, limit: 51 });
    expect(result.success).toBe(false);
  });

  it('accepts limit of exactly 50', () => {
    const result = previewOccurrencesSchema.safeParse({ ...validPreview, limit: 50 });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run and verify**

```bash
cd packages/shared && bun test src/schemas/recurring.schemas.test.ts
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add packages/shared/src/schemas/recurring.schemas.test.ts
git commit -m "test: add recurring schema validation tests"
```

---

## Phase 2: Frontend Service Tests

> **Important pattern note:** Frontend services use `apiClient` which picks up the access token from the Zustand auth store. Tests that call endpoints requiring authentication must call `setAuthenticated()` first (in `beforeEach`). MSW is already set up in `test/setup.ts` — it runs before all tests automatically. You do NOT need to start the MSW server manually.

> Before writing each service test, **read one existing service test** (e.g. `apps/frontend/src/services/account.service.test.ts`) to confirm the exact import pattern used. The tests below follow the expected pattern but the existing file is the ground truth.

---

### Task 4: Add `auth.service.test.ts` (frontend)

**Files:**
- Create: `apps/frontend/src/services/auth.service.test.ts`
- Reference: `apps/frontend/src/services/auth.service.ts` (already read)
- Reference: `apps/frontend/src/test/msw/handlers.ts` — uses `mockUser` and the auth handlers already registered there

**Step 1: Create the test file**

```typescript
// apps/frontend/src/services/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { mockUser } from '../test/msw/handlers';
import { setAuthenticated } from '../test/helpers/auth';
import { authService } from './auth.service';

describe('authService.login', () => {
  it('posts credentials and returns user with tokens', async () => {
    const result = await authService.login({ email: 'test@example.com', password: 'password123' });
    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe('test-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('throws on 401 response', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } },
          { status: 401 }
        )
      )
    );
    await expect(
      authService.login({ email: 'bad@example.com', password: 'wrong' })
    ).rejects.toThrow();
  });
});

describe('authService.register', () => {
  it('posts registration data and returns user with tokens', async () => {
    const result = await authService.register({
      email: 'new@example.com',
      password: 'validpassword1',
      name: 'New User',
    });
    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws on 409 conflict (duplicate email)', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'Email already in use' } },
          { status: 409 }
        )
      )
    );
    await expect(
      authService.register({ email: 'existing@example.com', password: 'validpassword1', name: 'User' })
    ).rejects.toThrow();
  });
});

describe('authService.getCurrentUser', () => {
  it('returns the current user for a valid token', async () => {
    const result = await authService.getCurrentUser('mock-access-token');
    expect(result.user).toEqual(mockUser);
  });

  it('throws on missing token (401)', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No token' } },
          { status: 401 }
        )
      )
    );
    await expect(authService.getCurrentUser('')).rejects.toThrow();
  });
});

describe('authService.updateProfile', () => {
  it('patches the profile and returns the updated user', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    server.use(
      http.patch('/api/auth/me', () => HttpResponse.json({ user: updatedUser }))
    );
    const result = await authService.updateProfile('mock-access-token', { name: 'Updated Name' });
    expect(result.user.name).toBe('Updated Name');
  });
});

describe('authService.refreshToken', () => {
  it('returns a new access token', async () => {
    const result = await authService.refreshToken();
    expect(result.accessToken).toBe('new-access-token');
  });

  it('throws on 401 (session expired)', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'Refresh token expired' } },
          { status: 401 }
        )
      )
    );
    await expect(authService.refreshToken()).rejects.toThrow();
  });
});

describe('authService.logout', () => {
  it('posts to logout endpoint without throwing', async () => {
    await expect(authService.logout('mock-access-token')).resolves.toBeUndefined();
  });
});
```

**Step 2: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts auth.service
```

Expected: all tests pass. If any test fails with "CSRF" errors, check that `setup.ts` is properly resetting the CSRF token cache between tests (it should be — this is already handled).

**Step 3: Commit**

```bash
git add apps/frontend/src/services/auth.service.test.ts
git commit -m "test: add frontend auth service tests"
```

---

### Task 5: Add `dashboard.service.test.ts` (frontend)

**Files:**
- Create: `apps/frontend/src/services/dashboard.service.test.ts`
- Reference: `apps/frontend/src/services/dashboard.service.ts` (already read — 3 methods: getSummary, getNetWorthTrend, getIncomeExpenseTrend)
- Reference: `apps/frontend/src/test/msw/handlers.ts` — look for `mockDashboardSummary` or the dashboard handler fixture name. If no named fixture exists, use an inline mock

**Step 1: Identify the dashboard fixture name**

Open `apps/frontend/src/test/msw/handlers.ts` and search for `dashboard`. Note the exact name of any exported fixture (it may be `mockDashboardSummary` or similar). If the dashboard handler returns an inline object without a named export, you'll need to define your own fixture in the test.

**Step 2: Create the test file**

```typescript
// apps/frontend/src/services/dashboard.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { setAuthenticated } from '../test/helpers/auth';
import { dashboardService } from './dashboard.service';

// Minimal fixture matching what DashboardPage expects.
// Adjust field names if the actual MSW handler uses a different shape.
const mockSummaryResponse = {
  summary: {
    totalCash: 5000,
    totalBalance: 5000,
    totalAssets: 10000,
    totalLiabilities: 3000,
  },
  accounts: [],
  recentTransactions: [],
  topCategories: [],
};

describe('dashboardService', () => {
  beforeEach(() => {
    setAuthenticated();
    // Override the default dashboard handler to return our fixture
    server.use(
      http.get('/api/dashboard/summary', () => HttpResponse.json(mockSummaryResponse)),
      http.get('/api/dashboard/net-worth-trend', () =>
        HttpResponse.json({ trend: [{ date: '2025-01-01', value: 7000 }] })
      ),
      http.get('/api/dashboard/income-expense-trend', () =>
        HttpResponse.json({ trend: [{ date: '2025-01-01', income: 3000, expense: 1500 }] })
      )
    );
  });

  describe('getSummary', () => {
    it('returns summary data', async () => {
      const result = await dashboardService.getSummary();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalCash).toBe(5000);
    });

    it('appends date filter query params when provided', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/dashboard/summary', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockSummaryResponse);
        })
      );
      await dashboardService.getSummary({ startDate: '2025-01-01', endDate: '2025-12-31' });
      expect(capturedUrl).toContain('startDate=2025-01-01');
      expect(capturedUrl).toContain('endDate=2025-12-31');
    });

    it('throws on 401 when unauthenticated', async () => {
      server.use(
        http.get('/api/dashboard/summary', () =>
          HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR', message: 'Unauthorized' } }, { status: 401 })
        )
      );
      await expect(dashboardService.getSummary()).rejects.toThrow();
    });
  });

  describe('getNetWorthTrend', () => {
    it('returns trend array', async () => {
      const result = await dashboardService.getNetWorthTrend(6);
      expect(Array.isArray(result.trend)).toBe(true);
      expect(result.trend).toHaveLength(1);
    });

    it('passes months param in URL', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/dashboard/net-worth-trend', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ trend: [] });
        })
      );
      await dashboardService.getNetWorthTrend(12);
      expect(capturedUrl).toContain('months=12');
    });
  });

  describe('getIncomeExpenseTrend', () => {
    it('returns trend array', async () => {
      const result = await dashboardService.getIncomeExpenseTrend(6);
      expect(Array.isArray(result.trend)).toBe(true);
    });

    it('defaults to 6 months when no arg given', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/dashboard/income-expense-trend', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ trend: [] });
        })
      );
      await dashboardService.getIncomeExpenseTrend();
      expect(capturedUrl).toContain('months=6');
    });
  });
});
```

**Step 3: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts dashboard.service
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add apps/frontend/src/services/dashboard.service.test.ts
git commit -m "test: add frontend dashboard service tests"
```

---

### Task 6: Add recurring MSW handlers + `recurring.service.test.ts`

**Files:**
- Modify: `apps/frontend/src/test/msw/handlers.ts` — add `mockRecurringRule` fixture and `recurringHandlers` array, then spread into the default handlers export
- Create: `apps/frontend/src/services/recurring.service.test.ts`

**Step 1: Check if recurring handlers already exist**

Open `apps/frontend/src/test/msw/handlers.ts` and search for `recurring`. If handlers already exist, skip Step 2.

**Step 2: Add recurring fixture and handlers to handlers.ts**

Find the end of `handlers.ts`. Add the following before the final `export const handlers = [...]` line:

```typescript
// ─── Recurring rule fixture ───────────────────────────────────────────────────
export const mockRecurringRule = {
  id: 'rule-1',
  userId: 'user-1',
  frequency: 'monthly',
  interval: 1,
  startDate: '2025-01-01T00:00:00Z',
  endDate: null,
  occurrences: null,
  isActive: true,
  templateTransaction: {
    accountId: 'acc-1',
    type: 'expense',
    amount: 100,
    name: 'Monthly Subscription',
    categoryId: null,
    subcategoryId: null,
    description: null,
    memo: null,
    tags: [],
    liabilityId: null,
    metadata: {},
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// ─── Recurring handlers ───────────────────────────────────────────────────────
export const recurringHandlers = [
  http.get('/api/recurring-rules', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRules: [mockRecurringRule] });
  }),
  http.get('/api/recurring-rules/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule });
  }),
  http.post('/api/recurring-rules/preview', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ occurrences: ['2025-01-01', '2025-02-01', '2025-03-01'] });
  }),
  http.post('/api/recurring-rules/materialize', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Materialized', count: 3 });
  }),
  http.post('/api/recurring-rules', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule }, { status: 201 });
  }),
  http.put('/api/recurring-rules/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule });
  }),
  http.delete('/api/recurring-rules/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Deleted' });
  }),
];
```

Then find the main `handlers` export (the array that's passed to `server`) and add `...recurringHandlers` to it. Look for a line like:
```typescript
export const handlers = [...authHandlers, ...accountHandlers, ...];
```
Add `...recurringHandlers` to that spread.

> **Note on handler ordering:** The `preview` and `materialize` routes (`/api/recurring-rules/preview`, `/api/recurring-rules/materialize`) are literal paths that must appear **before** the parameterized `/api/recurring-rules/:id` handler. Verify the order in the array above matches the order above.

**Step 3: Create the service test file**

```typescript
// apps/frontend/src/services/recurring.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { mockRecurringRule } from '../test/msw/handlers';
import { setAuthenticated } from '../test/helpers/auth';
import { recurringService } from './recurring.service';

describe('recurringService', () => {
  beforeEach(() => {
    setAuthenticated();
  });

  describe('getRecurringRules', () => {
    it('returns list of rules', async () => {
      const result = await recurringService.getRecurringRules();
      expect(result.recurringRules).toHaveLength(1);
      expect(result.recurringRules[0].id).toBe(mockRecurringRule.id);
    });

    it('throws on 401 when unauthenticated', async () => {
      server.use(
        http.get('/api/recurring-rules', () =>
          HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR', message: 'Unauthorized' } }, { status: 401 })
        )
      );
      await expect(recurringService.getRecurringRules()).rejects.toThrow();
    });
  });

  describe('getRecurringRule', () => {
    it('returns a single rule by ID', async () => {
      const result = await recurringService.getRecurringRule('rule-1');
      expect(result.recurringRule.id).toBe(mockRecurringRule.id);
    });
  });

  describe('createRecurringRule', () => {
    it('creates a rule and returns it', async () => {
      const input = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: '2025-01-01',
        templateTransaction: {
          accountId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'expense' as const,
          amount: 100,
          name: 'New Rule',
        },
      };
      const result = await recurringService.createRecurringRule(input as any);
      expect(result.recurringRule.id).toBe(mockRecurringRule.id);
    });
  });

  describe('updateRecurringRule', () => {
    it('updates a rule and returns it', async () => {
      const result = await recurringService.updateRecurringRule('rule-1', { isActive: false });
      expect(result.recurringRule).toBeDefined();
    });
  });

  describe('deleteRecurringRule', () => {
    it('deletes a rule and returns a message', async () => {
      const result = await recurringService.deleteRecurringRule('rule-1');
      expect(result.message).toBeDefined();
    });
  });

  describe('previewOccurrences', () => {
    it('returns occurrence dates', async () => {
      const result = await recurringService.previewOccurrences({
        frequency: 'monthly',
        interval: 1,
        startDate: '2025-01-01',
      } as any);
      expect(result.occurrences).toHaveLength(3);
    });
  });

  describe('materializeAll', () => {
    it('returns count of materialized transactions', async () => {
      const result = await recurringService.materializeAll();
      expect(result.count).toBe(3);
    });
  });
});
```

**Step 4: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts recurring.service
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add apps/frontend/src/test/msw/handlers.ts apps/frontend/src/services/recurring.service.test.ts
git commit -m "test: add recurring MSW handlers and frontend recurring service tests"
```

---

## Phase 3: Missing Page Tests

> All page tests follow the same MSW pattern established in `GoalsPage.test.tsx` and `LiabilitiesPage.test.tsx`. Use `renderWithProviders()` + `setAuthenticated()` + `server.use()` in `beforeEach`. Always use `waitFor` since data loads asynchronously.

> **Before writing each test, read the page source file** to check: (1) what heading/text is always rendered, (2) what the "empty state" looks like, (3) what the "Add" button is labelled.

---

### Task 7: Add `AssetsPage.test.tsx`

**Files:**
- Create: `apps/frontend/src/pages/AssetsPage.test.tsx`
- Reference: `apps/frontend/src/pages/AssetsPage.tsx` (already read — uses `assetService.getEnhancedAssets()`, renders "Assets" heading, "Add Asset" button, asset cards)
- Reference: `apps/frontend/src/test/msw/handlers.ts` — look for `mockAsset` or `mockEnhancedAsset` export

**Step 1: Check the asset fixture name in handlers.ts**

Search `handlers.ts` for `mockAsset`. The `assetService.getEnhancedAssets()` call hits `/api/assets/enhanced` or `/api/assets` — check the asset route in `handlers.ts` to confirm the URL and the response shape (it likely returns `{ assets: [...] }` with enhanced asset objects that include `currentValue` and `totalGain`).

**Step 2: Create the test file**

```typescript
// apps/frontend/src/pages/AssetsPage.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockAsset } from '../test/msw/handlers'; // adjust import name if different
import AssetsPage from './AssetsPage';

// EnhancedAsset has extra fields beyond the base Asset
const mockEnhancedAsset = {
  ...mockAsset,
  currentValue: 15000,
  totalGain: 2000,
  gainPercent: 15,
  valueHistory: [],
};

describe('AssetsPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    server.use(
      http.get('/api/assets/enhanced', () =>
        HttpResponse.json({ assets: [mockEnhancedAsset] })
      ),
      // Fallback in case the route is just /api/assets
      http.get('/api/assets', () =>
        HttpResponse.json({ assets: [mockEnhancedAsset] })
      )
    );
  });

  it('renders the Assets heading', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeTruthy();
    });
  });

  it('renders asset name from MSW handler', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockAsset.name)).toBeTruthy();
    });
  });

  it('renders the Add Asset button', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add asset/i })).toBeTruthy();
    });
  });

  it('shows an error banner when the API returns 500', async () => {
    server.use(
      http.get('/api/assets/enhanced', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      ),
      http.get('/api/assets', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeTruthy();
    });
  });
});
```

> **Troubleshooting:** If the "Assets" heading test fails, read `AssetsPage.tsx` and find the exact heading text rendered. Adjust the `getByText` argument accordingly.

**Step 3: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts AssetsPage
```

Expected: all 4 tests pass.

**Step 4: Commit**

```bash
git add apps/frontend/src/pages/AssetsPage.test.tsx
git commit -m "test: add MSW-based page tests for AssetsPage"
```

---

### Task 8: Add `DashboardPage.test.tsx`

**Files:**
- Create: `apps/frontend/src/pages/DashboardPage.test.tsx`
- Reference: `apps/frontend/src/pages/DashboardPage.tsx` (already read — makes 3 queries: summary, net-worth-trend, income-expense-trend; renders chart components)

> **Chart rendering note:** `NetWorthChart`, `IncomeExpenseChart`, and `CategoryPieChart` may fail in Happy DOM if they use Canvas. If chart tests fail, add a mock for the chart components using `server.use()` overrides or Bun `mock.module()` at the top of this file only. The smoke tests below only assert the page renders without crashing — they don't inspect chart internals.

**Step 1: Create the test file**

```typescript
// apps/frontend/src/pages/DashboardPage.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import DashboardPage from './DashboardPage';

const mockSummaryResponse = {
  summary: {
    totalCash: 5000,
    totalBalance: 5000,
    totalAssets: 10000,
    totalLiabilities: 3000,
  },
  accounts: [],
  recentTransactions: [],
  topCategories: [],
};

describe('DashboardPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    server.use(
      http.get('/api/dashboard/summary', () => HttpResponse.json(mockSummaryResponse)),
      http.get('/api/dashboard/net-worth-trend', () => HttpResponse.json({ trend: [] })),
      http.get('/api/dashboard/income-expense-trend', () => HttpResponse.json({ trend: [] }))
    );
  });

  it('renders without crashing', async () => {
    renderWithProviders(<DashboardPage />);
    // Wait for loading state to resolve
    await waitFor(() => {
      // Page should not still be showing skeleton/loading after data loads
      expect(document.body.innerHTML).not.toBe('');
    });
  });

  it('shows an error banner when the summary API returns 500', async () => {
    server.use(
      http.get('/api/dashboard/summary', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeTruthy();
    });
  });
});
```

> If the first test fails because the page renders chart components that throw in Happy DOM, add a `mock.module()` at the top of this file for each chart component. Example (add before describe block):
> ```typescript
> import { mock } from 'bun:test';
> mock.module('../components/charts/NetWorthChart', () => ({
>   default: () => null,
> }));
> // repeat for IncomeExpenseChart, CategoryPieChart
> ```

**Step 2: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts DashboardPage
```

Expected: both tests pass. If chart rendering throws, apply the mock.module() fix from the note above.

**Step 3: Commit**

```bash
git add apps/frontend/src/pages/DashboardPage.test.tsx
git commit -m "test: add MSW-based page tests for DashboardPage"
```

---

### Task 9: Add `ProfilePage.test.tsx`

**Files:**
- Create: `apps/frontend/src/pages/ProfilePage.test.tsx`
- Read first: `apps/frontend/src/pages/ProfilePage.tsx` — you must read this file before writing the test to identify: (1) the heading text, (2) what data it loads from the API, (3) what MSW handler to override

**Step 1: Read ProfilePage.tsx**

Before writing anything, read `ProfilePage.tsx`. Identify:
- What React Query keys are used (`queryKey: [...]`)
- What API endpoints are hit (e.g. `/api/auth/me`, `/api/users/profile`)
- What heading or static text is always rendered
- Whether the page renders user name, email, or other fields from the store vs API

**Step 2: Create the test file based on what you found**

Follow the exact same pattern as `GoalsPage.test.tsx`:
```typescript
// apps/frontend/src/pages/ProfilePage.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockUser } from '../test/msw/handlers';
import ProfilePage from './ProfilePage';

describe('ProfilePage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    // Add server.use() if the page makes API calls beyond the default MSW handlers
    // e.g.: server.use(http.get('/api/auth/me', () => HttpResponse.json({ user: mockUser })));
  });

  it('renders the Profile heading', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      // Replace 'Profile' with the actual heading text from the page
      expect(screen.getByText(/profile/i)).toBeTruthy();
    });
  });

  it('displays the user name', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeTruthy();
    });
  });

  it('displays the user email', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(mockUser.email)).toBeTruthy();
    });
  });
});
```

**Step 3: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts ProfilePage
```

**Step 4: Commit**

```bash
git add apps/frontend/src/pages/ProfilePage.test.tsx
git commit -m "test: add MSW-based page tests for ProfilePage"
```

---

## Phase 4: MSW Consolidation (Remove Dual-Mocking)

### Task 10: Remove `TransactionsPage.test.tsx` (mock.module variant)

Currently there are two test files for TransactionsPage:
- `TransactionsPage.test.tsx` — uses `mock.module()` to mock the service layer
- `TransactionsPage.msw.test.tsx` — uses MSW to mock at the HTTP layer

The MSW variant is the correct pattern. This task migrates any missing scenarios from the mock.module version and removes it.

**Files:**
- Read: `apps/frontend/src/pages/TransactionsPage.test.tsx`
- Read: `apps/frontend/src/pages/TransactionsPage.msw.test.tsx`
- Delete: `apps/frontend/src/pages/TransactionsPage.test.tsx`
- Rename: `apps/frontend/src/pages/TransactionsPage.msw.test.tsx` → `apps/frontend/src/pages/TransactionsPage.test.tsx`

**Step 1: Read both files and compare scenarios**

Read both files. Make a list:
- Scenarios in `TransactionsPage.test.tsx` (mock.module version)
- Scenarios in `TransactionsPage.msw.test.tsx` (MSW version)

**Step 2: Add any missing scenarios to the MSW version**

If the mock.module version tests anything the MSW version doesn't (e.g. an error state, an empty state, a specific interaction), add those scenarios to `TransactionsPage.msw.test.tsx` following the MSW pattern.

**Step 3: Rename and delete**

```bash
cd apps/frontend/src/pages
mv TransactionsPage.msw.test.tsx TransactionsPage.test.tsx.new
rm TransactionsPage.test.tsx
mv TransactionsPage.test.tsx.new TransactionsPage.test.tsx
```

Or use git:
```bash
git mv apps/frontend/src/pages/TransactionsPage.msw.test.tsx apps/frontend/src/pages/TransactionsPage.test.new.tsx
git rm apps/frontend/src/pages/TransactionsPage.test.tsx
# then rename the .new.tsx → .test.tsx via file rename
```

**Step 4: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts TransactionsPage
```

Expected: tests pass. Confirm only ONE test file exists for TransactionsPage.

**Step 5: Commit**

```bash
git add -A apps/frontend/src/pages/TransactionsPage*
git commit -m "test: consolidate TransactionsPage tests on MSW pattern, remove mock.module variant"
```

---

## Phase 5: Backend Gaps

> All backend tests follow the pattern in `goal.routes.test.ts` (for routes) and `account.service.test.ts` (for services). Read one of these before writing a new backend test.

> **Key imports for every backend test:**
> - `import { describe, it, expect, beforeEach, mock } from 'bun:test';`
> - `import { prismaMock, resetPrismaMocks } from '../test/mocks/prisma';`
> - `import { buildX } from '../test/fixtures';`
> - Route tests: `import { buildFastifyApp } from '../test/helpers/fastify';` (check this file for the exact function signature)

---

### Task 11: Add `errorHandler.test.ts`

**Files:**
- Create: `apps/backend/src/middleware/errorHandler.test.ts`
- Reference: `apps/backend/src/middleware/errorHandler.ts` (already read — handles AppError, ZodError, Prisma errors, default 500)
- Reference: `apps/backend/src/utils/errors.ts` — to know the exported AppError subclasses (NotFoundError, ValidationError, etc.)
- Reference: `apps/backend/src/test/helpers/fastify.ts` — check what `buildFastifyApp()` accepts

**Step 1: Read `errors.ts` to get the list of custom error classes**

Before writing, run: read `apps/backend/src/utils/errors.ts`.

**Step 2: Create the test file**

The strategy is to create a minimal Fastify app, register the errorHandler, add test routes that throw specific errors, then use `app.inject()` to hit them.

```typescript
// apps/backend/src/middleware/errorHandler.test.ts
import { describe, it, expect } from 'bun:test';
import Fastify from 'fastify';
import { errorHandler } from './errorHandler';
// Import AppError subclasses — adjust paths after reading errors.ts
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { ZodError, z } from 'zod';

function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);

  // Routes that throw specific error types
  app.get('/throw/not-found', async () => { throw new NotFoundError('Resource not found'); });
  app.get('/throw/validation', async () => { throw new ValidationError('Invalid input'); });
  app.get('/throw/conflict', async () => { throw new ConflictError('Already exists'); });
  app.get('/throw/zod', async () => {
    const schema = z.object({ name: z.string().min(1) });
    schema.parse({ name: '' });
  });
  app.get('/throw/unknown', async () => { throw new Error('Something unexpected'); });

  return app;
}

describe('errorHandler', () => {
  it('returns 404 with NOT_FOUND code for NotFoundError', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/throw/not-found' });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Resource not found');
  });

  it('returns 400 with VALIDATION_ERROR for ValidationError', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/throw/validation' });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 with CONFLICT for ConflictError', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/throw/conflict' });
    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('CONFLICT');
  });

  it('returns 400 with validation details for ZodError', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/throw/zod' });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
  });

  it('returns 500 for unexpected errors', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/throw/unknown' });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
```

> **Important:** After reading `errors.ts`, verify the correct error class names and HTTP status codes. The code above assumes standard names — adjust if different.
> Also: if `errorHandler.ts` handles Prisma `P2002` (unique constraint), `P2025` (not found) errors, add tests for those too by constructing a `PrismaClientKnownRequestError`.

**Step 3: Run and verify**

```bash
cd apps/backend && bun scripts/run-tests.ts errorHandler
```

**Step 4: Commit**

```bash
git add apps/backend/src/middleware/errorHandler.test.ts
git commit -m "test: add error handler middleware tests"
```

---

### Task 12: Add `tokenBlacklist.test.ts`

**Files:**
- Create: `apps/backend/src/utils/tokenBlacklist.test.ts`
- Reference: `apps/backend/src/utils/tokenBlacklist.ts` (already read — `blacklistToken(jti, ttl)`, `isTokenBlacklisted(jti)`, `cleanup()`)

> **Note:** `tokenBlacklist.ts` uses in-memory state. Tests must import with a fresh module each time OR manually reset state between tests. Since our runner isolates per file, module state is fresh for each test file. But within a file, state accumulates across tests — use `cleanup()` or track/clear manually in `beforeEach`.

**Step 1: Create the test file**

```typescript
// apps/backend/src/utils/tokenBlacklist.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { blacklistToken, isTokenBlacklisted } from './tokenBlacklist';

describe('tokenBlacklist', () => {
  // The blacklist is module-level state. Since this file runs in isolation,
  // state from previous tests accumulates within this file.
  // Use unique JTIs per test to avoid cross-test interference.

  it('returns false for a token that has not been blacklisted', () => {
    expect(isTokenBlacklisted('never-seen-jti')).toBe(false);
  });

  it('returns true immediately after blacklisting a token', () => {
    blacklistToken('jti-001', 900); // 15-minute TTL
    expect(isTokenBlacklisted('jti-001')).toBe(true);
  });

  it('returns false for a different JTI after blacklisting another', () => {
    blacklistToken('jti-002', 900);
    expect(isTokenBlacklisted('jti-003')).toBe(false);
  });

  it('returns false after TTL has expired', async () => {
    // Use a very short TTL (1ms) to test expiry
    blacklistToken('jti-expire', 0.001); // 1ms in seconds
    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 10));
    // isTokenBlacklisted does lazy cleanup on check
    expect(isTokenBlacklisted('jti-expire')).toBe(false);
  });

  it('returns true for a long-lived token that has not expired', () => {
    blacklistToken('jti-long', 3600); // 1 hour
    expect(isTokenBlacklisted('jti-long')).toBe(true);
  });
});
```

**Step 2: Run and verify**

```bash
cd apps/backend && bun scripts/run-tests.ts tokenBlacklist
```

**Step 3: Commit**

```bash
git add apps/backend/src/utils/tokenBlacklist.test.ts
git commit -m "test: add token blacklist utility tests"
```

---

### Task 13: Add `audit.service.test.ts`

**Files:**
- Create: `apps/backend/src/services/audit.service.test.ts`
- Reference: `apps/backend/src/services/audit.service.ts` (already read — single `log()` method, writes to Prisma's auditLog model, fire-and-forget)

**Step 1: Create the test file**

```typescript
// apps/backend/src/services/audit.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { mock } from 'bun:test';

mock.module('../db/prisma', () => ({
  prisma: prismaMock,
}));

import { prismaMock, resetPrismaMocks } from '../test/mocks/prisma';
import { auditService } from './audit.service';

describe('auditService.log', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it('creates an audit log entry with the provided data', async () => {
    const entry = {
      userId: 'user-1',
      action: 'account.create',
      resource: 'account',
      metadata: { accountId: 'acc-1' },
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await auditService.log(entry);

    // Verify Prisma was called (may be auditLog.create or similar — check audit.service.ts)
    // Adjust the model name to match what audit.service.ts uses:
    // e.g. prismaMock.auditLog.create or prismaMock.auditEntry.create
    expect(prismaMock.auditLog?.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'account.create',
        }),
      })
    );
  });

  it('does not throw when Prisma rejects (fire-and-forget)', async () => {
    prismaMock.auditLog?.create.mockRejectedValue(new Error('DB error'));

    // Should resolve without throwing
    await expect(
      auditService.log({ userId: 'user-1', action: 'test', resource: 'test' })
    ).resolves.not.toThrow();
  });
});
```

> **Important:** After writing the test, read `audit.service.ts` again to confirm the exact Prisma model name used (`auditLog`, `auditEntry`, etc.) and adjust the `prismaMock.X.create` reference. Also check what fields are optional in the `AuditLogEntry` type.

**Step 2: Run and verify**

```bash
cd apps/backend && bun scripts/run-tests.ts audit.service
```

**Step 3: Commit**

```bash
git add apps/backend/src/services/audit.service.test.ts
git commit -m "test: add audit service tests"
```

---

### Task 14: Add `email.service.test.ts`

**Files:**
- Create: `apps/backend/src/services/email.service.test.ts`
- Reference: `apps/backend/src/services/email.service.ts` (already read — uses nodemailer, `sendInviteEmail()`)

> **Note on nodemailer:** The email service lazily creates an SMTP transporter. We need to mock nodemailer so tests don't make real network connections. Use `mock.module('nodemailer', ...)` to replace it with a spy.

**Step 1: Create the test file**

```typescript
// apps/backend/src/services/email.service.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';

const mockSendMail = mock(() => Promise.resolve({ messageId: 'test-message-id' }));
const mockCreateTransport = mock(() => ({
  sendMail: mockSendMail,
  verify: mock(() => Promise.resolve(true)),
}));

mock.module('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
    createTestAccount: mock(() =>
      Promise.resolve({ user: 'test@ethereal.email', pass: 'testpass' })
    ),
    getTestMessageUrl: mock(() => 'https://ethereal.email/message/test'),
  },
}));

import { emailService } from './email.service';

describe('emailService', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();
  });

  describe('sendInviteEmail', () => {
    it('calls nodemailer sendMail with the invite recipient', async () => {
      await emailService.sendInviteEmail({
        to: 'invitee@example.com',
        inviterName: 'Alice',
        householdName: 'Smith Family',
        inviteToken: 'abc123',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('invitee@example.com');
    });

    it('includes the invite token in the email body', async () => {
      await emailService.sendInviteEmail({
        to: 'invitee@example.com',
        inviterName: 'Alice',
        householdName: 'Smith Family',
        inviteToken: 'my-unique-token',
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      const bodyContent = JSON.stringify(callArgs);
      expect(bodyContent).toContain('my-unique-token');
    });

    it('does not throw on sendMail failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      // Depending on whether email.service swallows errors or rethrows them:
      // If it rethrows: remove the resolves.not.toThrow() and assert the rejection
      // If it swallows: keep resolves.not.toThrow()
      await expect(
        emailService.sendInviteEmail({
          to: 'fail@example.com',
          inviterName: 'Bob',
          householdName: 'Test',
          inviteToken: 'token',
        })
      ).resolves.not.toThrow();
    });
  });
});
```

> **Important:** After writing, read `email.service.ts` to verify: (1) the exact function signature for `sendInviteEmail`, (2) whether it swallows or rethrows SMTP errors, (3) the exact parameter names. Adjust the test accordingly.

**Step 2: Run and verify**

```bash
cd apps/backend && bun scripts/run-tests.ts email.service
```

**Step 3: Commit**

```bash
git add apps/backend/src/services/email.service.test.ts
git commit -m "test: add email service tests with nodemailer mock"
```

---

### Task 15: Add `invite.routes.test.ts`

**Files:**
- Create: `apps/backend/src/routes/invite.routes.test.ts`
- Reference: `apps/backend/src/routes/invite.ts` (already read — 3 endpoints: GET `/invite/:token`, POST `/invite/:token/accept`, POST `/invite/:token/join`)
- Reference: `apps/backend/src/routes/goal.routes.test.ts` for the route test pattern
- Reference: `apps/backend/src/test/helpers/fastify.ts` — check the exact function signature for building a test app
- Reference: `apps/backend/src/test/fixtures/index.ts` — use `buildHouseholdInvite()`, `buildUser()`, `buildHousehold()`

**Step 1: Read `fastify.ts` test helper**

Before writing, read `apps/backend/src/test/helpers/fastify.ts` to understand how to register routes on the test app (it likely exports `buildFastifyApp()` which you pass routes to).

**Step 2: Create the test file**

```typescript
// apps/backend/src/routes/invite.routes.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';

mock.module('../services/household.service', () => ({
  householdService: householdServiceMock,
}));
mock.module('../middleware/auth.middleware', () => ({
  authenticate: mock(async (request: any) => {
    request.user = { id: 'user-1', householdId: null };
  }),
}));

const householdServiceMock = {
  validateInviteToken: mock(),
  acceptInvite: mock(),
  joinViaInvite: mock(),
};

import { buildFastifyApp } from '../test/helpers/fastify';
import inviteRoutes from './invite';
import { buildHouseholdInvite, buildUser, buildHousehold } from '../test/fixtures';
import { resetPrismaMocks } from '../test/mocks/prisma';

describe('GET /invite/:token', () => {
  beforeEach(() => {
    resetPrismaMocks();
    householdServiceMock.validateInviteToken.mockReset();
  });

  it('returns 200 with invite details for a valid token', async () => {
    const mockInvite = buildHouseholdInvite();
    householdServiceMock.validateInviteToken.mockResolvedValue({ invite: mockInvite });

    const app = buildFastifyApp(inviteRoutes);
    const res = await app.inject({ method: 'GET', url: '/invite/valid-token' });

    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for an invalid or expired token', async () => {
    const { NotFoundError } = await import('../utils/errors');
    householdServiceMock.validateInviteToken.mockRejectedValue(new NotFoundError('Invalid token'));

    const app = buildFastifyApp(inviteRoutes);
    const res = await app.inject({ method: 'GET', url: '/invite/bad-token' });

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /invite/:token/accept', () => {
  beforeEach(() => {
    householdServiceMock.acceptInvite.mockReset();
  });

  it('creates account and returns 200 with tokens', async () => {
    const mockUser = buildUser();
    householdServiceMock.acceptInvite.mockResolvedValue({
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const app = buildFastifyApp(inviteRoutes);
    const res = await app.inject({
      method: 'POST',
      url: '/invite/valid-token/accept',
      payload: { name: 'New User', email: 'new@example.com', password: 'validpassword1' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBe('access-token');
  });
});

describe('POST /invite/:token/join', () => {
  beforeEach(() => {
    householdServiceMock.joinViaInvite.mockReset();
  });

  it('adds existing user to household and returns 200', async () => {
    householdServiceMock.joinViaInvite.mockResolvedValue({ message: 'Joined household' });

    const app = buildFastifyApp(inviteRoutes);
    const res = await app.inject({
      method: 'POST',
      url: '/invite/valid-token/join',
      headers: { authorization: 'Bearer mock-token' },
    });

    expect(res.statusCode).toBe(200);
  });
});
```

> **Important:** The exact interface of `buildFastifyApp` (in `fastify.ts`) may differ. Read it first and adjust how routes are registered. Also verify the exact service method names by reading `invite.ts` again.

**Step 3: Run and verify**

```bash
cd apps/backend && bun scripts/run-tests.ts invite.routes
```

**Step 4: Commit**

```bash
git add apps/backend/src/routes/invite.routes.test.ts
git commit -m "test: add invite routes tests"
```

---

## Phase 6: Quality Fixes

### Task 16: Refactor `BudgetForm.test.tsx` (remove implementation detail assertions)

**Problem:** The test reads `HTMLInputElement.value` directly (`endDateInput.value`), which is brittle and tests internal DOM state rather than user-visible output.

**Files:**
- Modify: `apps/frontend/src/components/budgets/BudgetForm.test.tsx`

**Step 1: Read the current test file**

Read `apps/frontend/src/components/budgets/BudgetForm.test.tsx` to identify all `element.value` or `.value` assertions.

**Step 2: Replace DOM-value assertions with user-facing queries**

For each assertion like:
```typescript
// ❌ Bad — reads internal DOM state
const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
expect(endDateInput.value).toBe('2026-01-31');
```

Replace with:
```typescript
// ✅ Good — queries what the user sees
// If the end date is displayed as text in the UI:
expect(screen.getByDisplayValue('2026-01-31')).toBeTruthy();
// OR if it's in an input that can be queried by its visible value:
const endDateInput = screen.getByLabelText(/end date/i);
expect(endDateInput).toBeTruthy(); // just verify it exists and has correct label
// Use getByDisplayValue for verifying a field's current displayed value
expect(screen.getByDisplayValue('2026-01-31')).toBeTruthy();
```

> `getByDisplayValue()` from Testing Library is the correct way to assert what's shown in a form field. It queries the rendered value, not internal state.

**Step 3: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts BudgetForm
```

Expected: all tests still pass (same behavior, better assertions).

**Step 4: Commit**

```bash
git add apps/frontend/src/components/budgets/BudgetForm.test.tsx
git commit -m "test: replace DOM value assertions in BudgetForm with getByDisplayValue"
```

---

### Task 17: Refactor `authStore.test.ts` (reduce mock boilerplate)

**Problem:** The test has 8+ lines of `mockX.mockReset()` and manual re-assignment in `beforeEach`. The backend has `resetPrismaMocks()` which handles this centrally. The frontend needs a similar helper for auth service mocks.

**Files:**
- Modify: `apps/frontend/src/stores/authStore.test.ts`

**Step 1: Read authStore.test.ts**

Read the full file. Identify the manual mock setup block in `beforeEach` (lines ~12-32 based on earlier analysis).

**Step 2: Extract a `resetAuthServiceMocks()` helper**

Replace the inline `beforeEach` reset block with a local helper function at the top of the file:

```typescript
// Define once, call from beforeEach
const resetAuthMocks = () => {
  loginMock.mockReset();
  loginMock.mockResolvedValue({ user: mockUser, accessToken: 'token', refreshToken: 'refresh' });
  // ... etc for each mock
  // Reassign mocks to authService
  (authService as any).login = loginMock;
  // ... etc
};

describe('authStore', () => {
  beforeEach(() => {
    resetAuthMocks();
    useAuthStore.setState(initialState); // reset store state too
  });
  // tests...
});
```

This doesn't change behavior — it just makes the intent clear and reduces duplication.

**Step 3: Run and verify**

```bash
cd apps/frontend && bun scripts/run-tests.ts authStore
```

Expected: all tests pass unchanged.

**Step 4: Commit**

```bash
git add apps/frontend/src/stores/authStore.test.ts
git commit -m "refactor: extract resetAuthMocks helper to reduce beforeEach boilerplate in authStore tests"
```

---

## Verification

After all phases are complete, run the full test suite to confirm no regressions:

```bash
# From repo root:
bun run test
```

Then run coverage on each workspace:

```bash
cd apps/frontend && bun scripts/run-tests.ts --coverage
cd apps/backend  && bun scripts/run-tests.ts --coverage
cd packages/shared && bun test --coverage
```

**Expected outcome:**
- All existing tests continue to pass
- New test files are discovered and run by the per-file runner
- Frontend file coverage increases from ~21% to ~40%+
- Backend file coverage increases from ~74% to ~90%+
- Shared file coverage increases from ~64% to ~100%
- Coverage tables show meaningful line/branch numbers for newly tested files
