# Frontend Testing (Layer E)

## Layer E — Component / Page Tests

**When:** Testing a React component or page in isolation — rendering, interactions, loading/error states. HTTP calls are intercepted by MSW and return mock data.

**Files:** `*.test.tsx` beside the component or page

**Snippet:**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { setAuthenticated } from "@/test/helpers/auth";
import { mockUser } from "@/test/msw/handlers";
import { WaterfallPage } from "./WaterfallPage";

// Mock hooks when you want to control exact data or avoid real queries
mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: true,
    isError: false,
  }),
}));

describe("WaterfallPage", () => {
  it("shows loading state", () => {
    setAuthenticated(mockUser, "test-token");
    renderWithProviders(<WaterfallPage />);
    expect(screen.getByTestId("loading")).toBeTruthy();
  });

  it("shows error state when query fails", () => {
    // Override hook for this test only
    mock.module("@/hooks/useWaterfall", () => ({
      useWaterfallSummary: () => ({ data: undefined, isLoading: false, isError: true }),
    }));
    renderWithProviders(<WaterfallPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

**Prefer mocking hooks over MSW** for component tests — it's faster and more explicit. Use MSW for service-layer tests where you want to test the full HTTP → parse → state cycle.

---

## Infrastructure Reference

### `apps/frontend/src/test/setup.ts`

Global test setup — runs before every test file via `bunfig.toml`. It:

- Starts the MSW server (`beforeAll`)
- Resets handlers after each test (`afterEach`)
- Clears DOM body (`afterEach`)
- Resets `window.location.href` to prevent auth redirect bleed
- Clears the API client's CSRF token cache
- Resets the auth store to unauthenticated state
- Closes MSW server (`afterAll`)

### `apps/frontend/src/test/msw/handlers.ts`

All default mock handlers. Organised by route group:

| Group          | Routes                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| Auth           | CSRF, login, register, logout, refresh, `/api/auth/me`, sessions             |
| Invites        | GET/POST `/api/auth/invite/:token`                                           |
| Households     | GET/POST/PATCH `/api/households`, switch, invite, delete member/invite/leave |
| Waterfall      | Summary, cashflow, CRUD income/committed/yearly/discretionary/savings        |
| Wealth         | Summary, ISA allowance, CRUD accounts, valuation, history                    |
| Settings       | GET/PATCH `/api/settings`                                                    |
| Planner        | Purchases, year budget, gift persons/events, upcoming gifts, year records    |
| Snapshots      | CRUD `/api/snapshots`                                                        |
| Review session | CRUD `/api/review-session`                                                   |
| Setup session  | CRUD `/api/setup-session`                                                    |

**Exported fixtures** (importable in tests):

```typescript
import {
  mockUser,
  mockHousehold,
  mockIncomeSource,
  mockCommittedBill,
  mockYearlyBill,
  mockDiscretionaryCategory,
  mockSavingsAllocation,
  mockWaterfallSummary,
  mockWealthAccount,
  mockWealthSummary,
  mockIsaAllowance,
  mockSettings,
  mockPurchaseItem,
  mockGiftPerson,
  mockSnapshot,
} from "@/test/msw/handlers";
```

### `apps/frontend/src/test/msw/server.ts`

MSW server instance. For per-test handler overrides:

```typescript
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

it("handles empty waterfall", () => {
  server.use(
    http.get("/api/waterfall", () =>
      HttpResponse.json({
        income: { total: 0, monthly: [], annual: [], oneOff: [] },
        committed: { monthlyTotal: 0, bills: [], yearlyBills: [] },
        discretionary: { total: 0, categories: [], savings: { total: 0, allocations: [] } },
        surplus: { amount: 0, percentOfIncome: 0 },
      })
    )
  );
  // render component...
});
```

Per-test overrides are reset automatically after each test by the global setup.

### `apps/frontend/src/test/helpers/auth.ts`

```typescript
import { setAuthenticated, setUnauthenticated } from "@/test/helpers/auth";
import { mockUser } from "@/test/msw/handlers";

// Set auth store to authenticated state (required for protected pages)
setAuthenticated(mockUser, "test-token");

// Reset auth store
setUnauthenticated();
```

### `apps/frontend/src/test/helpers/render.tsx`

```typescript
import { renderWithProviders } from "@/test/helpers/render";

// Options: initialEntries (for router), queryClient (for shared state across renders)
renderWithProviders(<MyComponent />, { initialEntries: ["/waterfall"] });
```

Wraps `QueryClient` + `MemoryRouter`. `retry: false`, `gcTime: 0` — prevents background refetch noise in tests.

---

## Conventions for Adding New Tests

### Component / page test

1. Create `<ComponentName>.test.tsx` beside the component
2. Call `setAuthenticated(mockUser, "test-token")` if the component requires auth
3. `renderWithProviders(<ComponentName />)`
4. Mock hooks with `mock.module(...)` to control loading/error/data states
5. Use `server.use(...)` when you need to test the actual HTTP + parse cycle

### Adding new MSW handlers (when a new API route is introduced)

1. Add a fixture export near the top of `handlers.ts`: `export const mockMyThing = { id: "thing-1", ... }`
2. Add a new handler group following the existing pattern:

```typescript
export const myThingHandlers = [
  http.get("/api/my-thing", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ things: [mockMyThing] });
  }),
  http.post("/api/my-thing", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ thing: mockMyThing }, { status: 201 });
  }),
];
```

3. Add `...myThingHandlers` to the `handlers` export array at the bottom of the file
