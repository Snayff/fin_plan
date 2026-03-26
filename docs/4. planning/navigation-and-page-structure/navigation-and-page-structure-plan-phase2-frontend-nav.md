---
feature: navigation-and-page-structure
spec: docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md
creation_date: 2026-03-26
status: backlog
implemented_date:
---

# Navigation & Page Structure: Navigation, Routing & Simple Pages — Implementation Plan

> **For Claude:** Use `/execute-plan navigation-and-page-structure` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Replace the 4-item nav with an 8-item TopNav (tier colours, separators, right-aligned Settings), wire up all 8 routes plus legacy redirects, add Goals/Gifts placeholder pages, build the Surplus page, update the Overview to be subcategory-aware and clickable, and add a `useSubcategories` hook backed by the new backend endpoint.
**Spec:** `docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md`
**Pre-condition:** Plan 1 (Schema & Backend) must be fully implemented — the `GET /api/waterfall/subcategories/:tier` endpoint and updated `WaterfallSummary` with subcategory grouping must be live.
**Tech Stack:** React 18 · React Router v6 · TanStack Query · Tailwind · Zustand

## Pre-conditions

- [x] Plan 1 implemented: Subcategory model seeded on household creation, `GET /api/waterfall/subcategories/:tier` endpoint, updated `WaterfallSummary` with subcategory-grouped items
- [x] Existing routes: `/overview`, `/wealth`, `/planner`, `/settings`
- [x] Existing 4-item nav in `apps/frontend/src/components/layout/Layout.tsx`
- [x] Existing `useWaterfallSummary()` hook in `apps/frontend/src/hooks/useWaterfall.ts`
- [x] TanStack Query client at `apps/frontend/src/lib/queryClient.ts`
- [x] Design tokens in Tailwind config (tier-income, tier-committed, tier-discretionary, tier-surplus, page-accent)

---

## Tasks

---

### Task 1: Add `useSubcategories` hook and frontend service method

**Files:**

- Modify: `apps/frontend/src/services/waterfall.service.ts`
- Modify: `apps/frontend/src/hooks/useWaterfall.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/hooks/useSubcategories.test.ts`:

```ts
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSubcategories } from "./useWaterfall";

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    getSubcategories: mock(async (tier: string) => [
      { id: "sub-1", tier, name: "Housing", sortOrder: 0, isLocked: false },
      { id: "sub-2", tier, name: "Utilities", sortOrder: 1, isLocked: false },
    ]),
  },
}));

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useSubcategories", () => {
  it("fetches subcategories for a tier", async () => {
    const { result } = renderHook(() => useSubcategories("committed"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe("Housing");
  });

  it("returns undefined data while loading", () => {
    const { result } = renderHook(() => useSubcategories("income"), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
```

Run: `cd apps/frontend && bun test src/hooks/useSubcategories.test.ts` — expect failure (hook not yet exported).

- [ ] **Step 2: Add `getSubcategories` to waterfall service**

In `apps/frontend/src/services/waterfall.service.ts`, add after the existing methods:

```ts
async getSubcategories(tier: "income" | "committed" | "discretionary") {
  return api.get<SubcategoryRow[]>(`/api/waterfall/subcategories/${tier}`);
},
```

Also add the `SubcategoryRow` type import from `@finplan/shared` (exported from the shared package after Plan 1).

- [ ] **Step 3: Add `useSubcategories` hook and query key**

In `apps/frontend/src/hooks/useWaterfall.ts`, add:

```ts
export const WATERFALL_KEYS = {
  summary: ["waterfall", "summary"],
  cashflow: (year: number) => ["waterfall", "cashflow", year],
  history: (type: string, id: string) => ["waterfall", "history", type, id],
  subcategories: (tier: string) => ["waterfall", "subcategories", tier], // ← new
};

export function useSubcategories(tier: "income" | "committed" | "discretionary") {
  return useQuery({
    queryKey: WATERFALL_KEYS.subcategories(tier),
    queryFn: () => waterfallService.getSubcategories(tier),
    staleTime: 10 * 60 * 1000, // subcategories change rarely
  });
}
```

- [ ] **Step 4: Run the test — expect green**

`cd apps/frontend && bun test src/hooks/useSubcategories.test.ts`

- [ ] **Step 5: Type-check**

`bun run type-check`

- [ ] **Step 6: Commit**

```
feat(frontend): add useSubcategories hook and waterfall service method
```

---

### Task 2: Update routing — 8 routes + legacy redirects

**Files:**

- Modify: `apps/frontend/src/App.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/frontend/src/App.test.tsx`, add to the `"App protected route handling"` describe block:

```ts
it("redirects /wealth to /overview", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/wealth"] });
  await waitFor(() => {
    expect(screen.getByTestId("overview-page")).toBeTruthy();
  });
});

it("redirects /planner to /overview", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/planner"] });
  await waitFor(() => {
    expect(screen.getByTestId("overview-page")).toBeTruthy();
  });
});

it("renders Income page at /income", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/income"] });
  await waitFor(() => {
    expect(screen.getByTestId("tier-page-income")).toBeTruthy();
  });
});

it("renders Surplus page at /surplus", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/surplus"] });
  await waitFor(() => {
    expect(screen.getByTestId("surplus-page")).toBeTruthy();
  });
});

it("renders Goals placeholder at /goals", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/goals"] });
  await waitFor(() => {
    expect(screen.getByTestId("goals-page")).toBeTruthy();
  });
});

it("renders Gifts placeholder at /gifts", async () => {
  renderWithProviders(<ProtectedAppRoutes />, { initialEntries: ["/gifts"] });
  await waitFor(() => {
    expect(screen.getByTestId("gifts-page")).toBeTruthy();
  });
});
```

Also add `data-testid="overview-page"` to the top-level element in `OverviewPage.tsx`.

Run: `cd apps/frontend && bun test src/App.test.tsx` — expect failures.

- [ ] **Step 2: Update App.tsx routes**

Replace the protected routes section in `ProtectedAppRoutes` with:

```tsx
// Legacy redirects
<Route path="/wealth" element={<Navigate to="/overview" replace />} />
<Route path="/planner" element={<Navigate to="/overview" replace />} />
<Route path="/" element={<Navigate to="/overview" replace />} />

// Primary routes
<Route path="/overview" element={<OverviewPage />} />
<Route path="/income" element={<IncomePage />} />
<Route path="/committed" element={<CommittedPage />} />
<Route path="/discretionary" element={<DiscretionaryPage />} />
<Route path="/surplus" element={<SurplusPage />} />
<Route path="/goals" element={<GoalsPage />} />
<Route path="/gifts" element={<GiftsPage />} />
<Route path="/settings" element={<SettingsPage />} />
<Route path="/welcome" element={<WelcomePage />} />
<Route path="/design-renew" element={<DesignRenewPage />} />

// Fallback
<Route path="*" element={<Navigate to="/overview" replace />} />
```

Add lazy imports for new pages (same pattern as existing pages):

```ts
const IncomePage = lazy(() => import("./pages/IncomePage"));
const CommittedPage = lazy(() => import("./pages/CommittedPage"));
const DiscretionaryPage = lazy(() => import("./pages/DiscretionaryPage"));
const SurplusPage = lazy(() => import("./pages/SurplusPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const GiftsPage = lazy(() => import("./pages/GiftsPage"));
```

- [ ] **Step 3: Create stub pages** (enough to satisfy the tests — full implementation in later tasks)

Create `apps/frontend/src/pages/GoalsPage.tsx`:

```tsx
export default function GoalsPage() {
  return <div data-testid="goals-page" />;
}
```

Create `apps/frontend/src/pages/GiftsPage.tsx`:

```tsx
export default function GiftsPage() {
  return <div data-testid="gifts-page" />;
}
```

Create `apps/frontend/src/pages/SurplusPage.tsx`:

```tsx
export default function SurplusPage() {
  return <div data-testid="surplus-page" />;
}
```

Create `apps/frontend/src/pages/IncomePage.tsx`:

```tsx
export default function IncomePage() {
  return <div data-testid="tier-page-income" />;
}
```

Create `apps/frontend/src/pages/CommittedPage.tsx`:

```tsx
export default function CommittedPage() {
  return <div data-testid="tier-page-committed" />;
}
```

Create `apps/frontend/src/pages/DiscretionaryPage.tsx`:

```tsx
export default function DiscretionaryPage() {
  return <div data-testid="tier-page-discretionary" />;
}
```

- [ ] **Step 4: Run the test — expect green**

`cd apps/frontend && bun test src/App.test.tsx`

- [ ] **Step 5: Commit**

```
feat(frontend): add 8-route structure with legacy redirects
```

---

### Task 3: TopNav — 8 items, tier colours, separators, right-aligned Settings

**Files:**

- Modify: `apps/frontend/src/components/layout/Layout.tsx`
- Modify: `apps/frontend/src/components/layout/Layout.test.tsx`

- [ ] **Step 1: Write the failing test**

Replace the existing `Layout.test.tsx` content with:

```tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";
import { useAuthStore } from "@/stores/authStore";

mock.module("@/hooks/useStaleDataBanner", () => ({
  useStaleDataBanner: () => ({ showBanner: false, lastSyncedAt: null }),
}));

function renderLayout(path = "/overview") {
  useAuthStore.setState({
    user: { id: "1", name: "Test", email: "t@test.com" } as any,
    accessToken: "tok",
    isAuthenticated: true,
    authStatus: "authenticated",
  } as any);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("TopNav", () => {
  it("renders all 8 nav items", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: /overview/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /income/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /committed/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /discretionary/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /surplus/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /goals/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /gifts/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /settings/i })).toBeTruthy();
  });

  it("marks the active route with aria-current", () => {
    renderLayout("/income");
    const incomeLink = screen.getByRole("link", { name: /income/i });
    expect(incomeLink.getAttribute("aria-current")).toBe("page");
    const overviewLink = screen.getByRole("link", { name: /overview/i });
    expect(overviewLink.getAttribute("aria-current")).toBeNull();
  });

  it("renders two separators between nav groups", () => {
    renderLayout();
    const separators = screen.getAllByRole("separator");
    expect(separators).toHaveLength(2);
  });

  it("shows StaleDataBanner when showBanner is true", () => {
    mock.module("@/hooks/useStaleDataBanner", () => ({
      useStaleDataBanner: () => ({ showBanner: true, lastSyncedAt: new Date() }),
    }));
    renderLayout();
    expect(screen.getByText(/data may be outdated/i)).toBeTruthy();
  });
});
```

Run: `cd apps/frontend && bun test src/components/layout/Layout.test.tsx` — expect failures.

- [ ] **Step 2: Implement TopNav in Layout.tsx**

Replace the nav section in `Layout.tsx`. The nav structure:

```tsx
// Nav items config (defined outside the component)
const NAV_ITEMS = [
  // Group 1
  { to: "/overview", label: "Overview", colorClass: "text-page-accent" },
  // — separator —
  // Group 2
  { to: "/income", label: "Income", colorClass: "text-tier-income" },
  { to: "/committed", label: "Committed", colorClass: "text-tier-committed" },
  { to: "/discretionary", label: "Discretionary", colorClass: "text-tier-discretionary" },
  { to: "/surplus", label: "Surplus", colorClass: "text-tier-surplus" },
  // — separator —
  // Group 3
  { to: "/goals", label: "Goals", colorClass: "text-foreground/50" },
  { to: "/gifts", label: "Gifts", colorClass: "text-foreground/50" },
] as const;

const SETTINGS_ITEM = { to: "/settings", label: "Settings", colorClass: "text-foreground/50" };
```

Render as a `<nav>` with `<NavLink>` from `react-router-dom`. Active state via NavLink render prop:

```tsx
<NavLink
  to={item.to}
  className={({ isActive }) =>
    cn(
      "relative pb-0.5 text-sm font-medium transition-colors duration-150",
      item.colorClass,
      isActive
        ? "opacity-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-current"
        : "opacity-50 hover:opacity-80"
    )
  }
  aria-current={/* pass isActive */ undefined}
>
```

> Note: `NavLink` does not pass `isActive` to the `aria-current` prop directly in JSX; use the function form of `className` which receives `{ isActive }`. To set `aria-current` use the same approach:
>
> ```tsx
> {({ isActive }) => (
>   <a aria-current={isActive ? "page" : undefined} ...>{item.label}</a>
> )}
> ```
>
> Actually, `NavLink` itself sets `aria-current="page"` automatically when active — no manual prop needed.

Separators (between groups 1→2 and 2→3):

```tsx
<div role="separator" aria-orientation="vertical" className="h-4 w-px bg-foreground/[0.12] mx-2" />
```

Settings uses `ml-auto` to push to the far right:

```tsx
<nav className="flex items-center gap-3">
  {/* Group 1 */}
  <NavLink to="/overview" ...>Overview</NavLink>
  <div role="separator" ... />
  {/* Group 2 */}
  {[income, committed, discretionary, surplus].map(item => <NavLink ... />)}
  <div role="separator" ... />
  {/* Group 3 */}
  <NavLink to="/goals" ...>Goals</NavLink>
  <NavLink to="/gifts" ...>Gifts</NavLink>
  {/* Settings — far right */}
  <NavLink to="/settings" className={cn("ml-auto", ...)} ...>Settings</NavLink>
</nav>
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/layout/Layout.test.tsx`

- [ ] **Step 4: Lint + type-check**

`bun run lint && bun run type-check`

- [ ] **Step 5: Commit**

```
feat(frontend): implement 8-item TopNav with tier colours and separators
```

---

### Task 4: Goals and Gifts placeholder pages

**Files:**

- Modify: `apps/frontend/src/pages/GoalsPage.tsx`
- Modify: `apps/frontend/src/pages/GiftsPage.tsx`

> These pages were stubbed in Task 2. This task fills them with proper placeholder content per spec: two-panel layout, `page-accent` glow, muted "coming soon" panel.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/pages/GoalsPage.test.tsx`:

```tsx
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import GoalsPage from "./GoalsPage";

describe("GoalsPage", () => {
  it("renders placeholder content", () => {
    renderWithProviders(<GoalsPage />, { initialEntries: ["/goals"] });
    expect(screen.getByTestId("goals-page")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /goals/i })).toBeTruthy();
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
  });
});
```

Create `apps/frontend/src/pages/GiftsPage.test.tsx` (same pattern, replace goals→gifts).

Run — expect failure (pages are stubs).

- [ ] **Step 2: Implement GoalsPage.tsx**

```tsx
import TwoPanelLayout from "@/components/layout/TwoPanelLayout";

export default function GoalsPage() {
  return (
    <div data-testid="goals-page" className="relative min-h-screen">
      {/* page-accent ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />
      <TwoPanelLayout
        left={
          <div className="flex h-full items-start p-6">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Goals</h1>
          </div>
        }
        right={
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-medium text-foreground/50">Coming soon</p>
            <p className="max-w-xs text-xs text-foreground/30">
              Goal planning and tracking will be available in a future update.
            </p>
          </div>
        }
      />
    </div>
  );
}
```

Implement `GiftsPage.tsx` identically, replacing "Goals" with "Gifts" and `data-testid="gifts-page"`.

- [ ] **Step 3: Run the tests — expect green**

`cd apps/frontend && bun test src/pages/GoalsPage.test.tsx src/pages/GiftsPage.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add Goals and Gifts placeholder pages
```

---

### Task 5: Surplus page

**Files:**

- Modify: `apps/frontend/src/pages/SurplusPage.tsx`

The Surplus page reads `useWaterfallSummary()` — no new API calls needed. It renders the waterfall breakdown and benchmark warning.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/pages/SurplusPage.test.tsx`:

```tsx
import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import SurplusPage from "./SurplusPage";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    isLoading: false,
    isError: false,
    data: {
      income: { totalMonthly: 4000 },
      committed: { total: 1500 },
      discretionary: { total: 800 },
      surplus: { amount: 1700, pctOfIncome: 42.5 },
      settings: { surplusBenchmarkPct: 10 },
    },
  }),
}));

describe("SurplusPage", () => {
  it("renders the surplus page", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByTestId("surplus-page")).toBeTruthy();
  });

  it("shows the surplus amount", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    // £1,700 formatted
    expect(screen.getAllByText(/1,700/).length).toBeGreaterThan(0);
  });

  it("shows the waterfall breakdown line items", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByText(/income/i)).toBeTruthy();
    expect(screen.getByText(/committed/i)).toBeTruthy();
    expect(screen.getByText(/discretionary/i)).toBeTruthy();
  });

  it("shows the right-panel message", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByText(/at the end of each month/i)).toBeTruthy();
  });

  it("does not show benchmark warning when surplus is above threshold", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.queryByTestId("surplus-benchmark-warning")).toBeNull();
  });
});

describe("SurplusPage — benchmark warning", () => {
  it("shows amber benchmark warning when surplus is below threshold", () => {
    mock.module("@/hooks/useWaterfall", () => ({
      useWaterfallSummary: () => ({
        isLoading: false,
        data: {
          income: { totalMonthly: 4000 },
          committed: { total: 3500 },
          discretionary: { total: 800 },
          surplus: { amount: -300, pctOfIncome: -7.5 },
          settings: { surplusBenchmarkPct: 10 },
        },
      }),
    }));
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByTestId("surplus-benchmark-warning")).toBeTruthy();
  });
});
```

Run: `cd apps/frontend && bun test src/pages/SurplusPage.test.tsx` — expect failures.

- [ ] **Step 2: Implement SurplusPage.tsx**

```tsx
import TwoPanelLayout from "@/components/layout/TwoPanelLayout";
import { useWaterfallSummary } from "@/hooks/useWaterfall";
import { toGBP } from "@finplan/shared";

export default function SurplusPage() {
  const { data, isLoading } = useWaterfallSummary();

  const income = data?.income.totalMonthly ?? 0;
  const committed = data?.committed.total ?? 0;
  const discretionary = data?.discretionary.total ?? 0;
  const surplus = data?.surplus?.amount ?? income - committed - discretionary;
  const surplusPct = income > 0 ? (surplus / income) * 100 : 0;
  const benchmarkPct = data?.settings?.surplusBenchmarkPct ?? 10;
  const showBenchmarkWarning = !isLoading && surplus < (income * benchmarkPct) / 100;

  return (
    <div data-testid="surplus-page" className="relative min-h-screen">
      {/* tier-surplus ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(20,184,166,0.08) 0%, transparent 70%)",
        }}
      />
      <TwoPanelLayout
        left={
          <div className="flex flex-col gap-6 p-6">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Surplus</h1>
            {!isLoading && (
              <>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Income</span>
                    <span className="font-numeric text-tier-income">{toGBP(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Committed</span>
                    <span className="font-numeric text-tier-committed">− {toGBP(committed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Discretionary</span>
                    <span className="font-numeric text-tier-discretionary">
                      − {toGBP(discretionary)}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-foreground/10 pt-2 flex justify-between font-semibold">
                    <span className="text-foreground">Surplus</span>
                    <span className="font-numeric text-tier-surplus text-lg">{toGBP(surplus)}</span>
                  </div>
                </div>
                {showBenchmarkWarning && (
                  <div
                    data-testid="surplus-benchmark-warning"
                    className="flex items-start gap-2 rounded-lg border border-attention/20 bg-attention/5 p-3 text-xs text-attention"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-attention" />
                    <span>
                      Your surplus is below your {benchmarkPct}% benchmark. A monthly surplus of
                      around {benchmarkPct}% of income is a common planning benchmark.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        }
        right={
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            {!isLoading && (
              <>
                <p className="text-sm text-foreground/50">
                  At the end of each month, you should have
                </p>
                <p className="font-numeric text-4xl font-bold text-tier-surplus">
                  {toGBP(surplus)}
                </p>
                <p className="text-sm text-foreground/50">left over.</p>
                <p className="mt-1 text-xs text-foreground/30">
                  {surplusPct.toFixed(1)}% of income
                </p>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/pages/SurplusPage.test.tsx`

- [ ] **Step 4: Lint + type-check**

`bun run lint && bun run type-check`

- [ ] **Step 5: Commit**

```
feat(frontend): implement Surplus page with waterfall breakdown and benchmark warning
```

---

### Task 6: Overview — clickable tier headings, subcategory rows, analytics placeholder

**Files:**

- Modify: `apps/frontend/src/pages/OverviewPage.tsx`
- Modify: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`
- Modify: `apps/frontend/src/pages/OverviewPage.test.tsx`

This task makes tier headings and subcategory rows navigable using React Router `useNavigate`, and replaces the right panel default view with an analytics placeholder.

- [ ] **Step 1: Write the failing tests**

In `apps/frontend/src/pages/OverviewPage.test.tsx`, add:

```tsx
import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import OverviewPage from "./OverviewPage";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    isLoading: false,
    isError: false,
    data: {
      income: {
        totalMonthly: 4000,
        subcategories: [{ subcategoryId: "sub-salary", name: "Salary", total: 3500, items: [] }],
      },
      committed: { total: 1500, subcategories: [] },
      discretionary: { total: 800, subcategories: [] },
      surplus: { amount: 1700 },
      settings: { surplusBenchmarkPct: 10 },
    },
  }),
}));

describe("OverviewPage — tier navigation", () => {
  it("clicking Income tier heading navigates to /income", async () => {
    const { container } = renderWithProviders(<OverviewPage />, { initialEntries: ["/overview"] });
    fireEvent.click(screen.getByTestId("tier-heading-income"));
    await waitFor(() => {
      expect(container.querySelector("[data-testid='tier-page-income']")).toBeTruthy();
    });
  });

  it("clicking a subcategory row navigates to /income", async () => {
    const { container } = renderWithProviders(<OverviewPage />, { initialEntries: ["/overview"] });
    fireEvent.click(screen.getByText("Salary"));
    await waitFor(() => {
      expect(container.querySelector("[data-testid='tier-page-income']")).toBeTruthy();
    });
  });
});

describe("OverviewPage — analytics placeholder", () => {
  it("shows analytics placeholder in right panel by default", () => {
    renderWithProviders(<OverviewPage />, { initialEntries: ["/overview"] });
    expect(screen.getByTestId("analytics-placeholder")).toBeTruthy();
  });
});
```

> Note: `renderWithProviders` must include the router and all routes for navigation to work. Check `apps/frontend/src/test/helpers/render.tsx` — if it renders a full `<App>` with routes, navigation can be tested by checking for the target page's `data-testid`. If it only wraps with `MemoryRouter` without routes, use a mock navigate instead.

Run: `cd apps/frontend && bun test src/pages/OverviewPage.test.tsx` — expect failures.

- [ ] **Step 2: Update WaterfallLeftPanel tier headings**

In `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`:

```tsx
import { useNavigate } from "react-router-dom";

// Inside component:
const navigate = useNavigate();

// Replace static Income tier heading with:
<button
  data-testid="tier-heading-income"
  onClick={() => navigate("/income")}
  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
>
  <span className="font-heading text-sm font-bold text-tier-income">Income</span>
  <span className="font-numeric text-sm text-tier-income">
    {toGBP(summary.income.totalMonthly)}
  </span>
</button>;
```

Apply the same pattern for `tier-heading-committed` → `/committed`, `tier-heading-discretionary` → `/discretionary`, `tier-heading-surplus` → `/surplus`.

- [ ] **Step 3: Make subcategory rows clickable**

In `WaterfallLeftPanel.tsx`, convert subcategory rows to navigable buttons:

```tsx
// Income subcategory row example:
<button
  key={sub.subcategoryId}
  onClick={() => navigate(`/income?subcategory=${sub.subcategoryId}`)}
  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground/60 hover:bg-tier-income/5 transition-colors"
>
  <span className="flex-1">{sub.name}</span>
  <span className="font-numeric">{toGBP(sub.total)}</span>
</button>
```

Apply for committed (`/committed?subcategory=...`) and discretionary subcategories.

- [ ] **Step 4: Update right panel default view**

In `OverviewPage.tsx`, replace the right panel default state with:

```tsx
<div
  data-testid="analytics-placeholder"
  className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
>
  <p className="text-sm font-medium text-foreground/40">Analytics</p>
  <p className="max-w-xs text-xs text-foreground/25">
    Spending trends and cashflow analytics will be available here in a future update.
  </p>
</div>
```

- [ ] **Step 5: Run the tests — expect green**

`cd apps/frontend && bun test src/pages/OverviewPage.test.tsx`

- [ ] **Step 6: Lint + type-check**

`bun run lint && bun run type-check`

- [ ] **Step 7: Commit**

```
feat(frontend): make Overview tier headings and subcategory rows navigable, add analytics placeholder
```

---

### Task 7: Overview empty state

**Files:**

- Modify: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`
- Create: `apps/frontend/src/components/overview/OverviewEmptyState.tsx`

When the waterfall has no data: ghosted cascade at ~25% opacity with "£—" placeholders + connectors, and a "Build your waterfall" callout gradient card with "Get started" button.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/components/overview/OverviewEmptyState.test.tsx`:

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OverviewEmptyState from "./OverviewEmptyState";

function renderEmpty() {
  return render(
    <MemoryRouter>
      <OverviewEmptyState />
    </MemoryRouter>
  );
}

describe("OverviewEmptyState", () => {
  it("renders the ghosted cascade with £— placeholders", () => {
    renderEmpty();
    expect(screen.getByTestId("empty-cascade")).toBeTruthy();
    const placeholders = screen.getAllByText("£—");
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });

  it("renders the Build your waterfall callout card", () => {
    renderEmpty();
    expect(screen.getByText("Build your waterfall")).toBeTruthy();
    expect(screen.getByRole("button", { name: /get started/i })).toBeTruthy();
  });
});
```

Run — expect failure.

- [ ] **Step 2: Create OverviewEmptyState.tsx**

```tsx
import { useNavigate } from "react-router-dom";

const GHOST_TIERS = [
  { label: "Income", colorClass: "text-tier-income" },
  { label: "Committed", colorClass: "text-tier-committed" },
  { label: "Discretionary", colorClass: "text-tier-discretionary" },
  { label: "Surplus", colorClass: "text-tier-surplus" },
];

export default function OverviewEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Ghosted cascade (~25% opacity) */}
      <div
        data-testid="empty-cascade"
        className="flex flex-col gap-3 opacity-25 pointer-events-none select-none"
      >
        {GHOST_TIERS.map((tier, i) => (
          <div key={tier.label}>
            <div className="flex items-center justify-between">
              <span className={`font-heading text-sm font-bold ${tier.colorClass}`}>
                {tier.label}
              </span>
              <span className="font-numeric text-sm text-foreground/40">£—</span>
            </div>
            {i < GHOST_TIERS.length - 1 && <div className="ml-3 mt-1 h-4 w-px bg-foreground/10" />}
          </div>
        ))}
      </div>

      {/* Build your waterfall callout card */}
      <div
        className="rounded-xl p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)",
          border: "1px solid rgba(139,92,246,0.18)",
        }}
      >
        <h3
          className="font-heading text-base font-extrabold"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Build your waterfall
        </h3>
        <p className="mt-2 text-sm text-foreground/60">
          Add your income, committed spend, and discretionary spend to see your surplus.
        </p>
        <button
          onClick={() => navigate("/income")}
          className="mt-4 rounded-lg bg-page-accent/20 px-4 py-2 text-sm font-medium text-page-accent hover:bg-page-accent/30 transition-colors"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into WaterfallLeftPanel**

In `WaterfallLeftPanel.tsx`, detect empty state:

```tsx
const isEmpty =
  (summary?.income.totalMonthly ?? 0) === 0 &&
  (summary?.committed.total ?? 0) === 0 &&
  (summary?.discretionary.total ?? 0) === 0;

if (isEmpty) return <OverviewEmptyState />;
```

Place this check after the loading guard and before the tier rendering.

- [ ] **Step 4: Run the tests — expect green**

`cd apps/frontend && bun test src/components/overview/OverviewEmptyState.test.tsx`

- [ ] **Step 5: Commit**

```
feat(frontend): add Overview empty state with ghosted cascade and callout card
```

---

## Verification

After all tasks complete:

1. **Unit tests:** `cd apps/frontend && bun test` — all pass
2. **Lint:** `bun run lint` — zero warnings
3. **Type-check:** `bun run type-check` — zero errors
4. **Manual smoke test (Docker environment):**
   - `bun run start` — boot the stack
   - Navigate to `http://localhost:3000` — should redirect to `/overview`
   - Verify TopNav shows all 8 items with correct colours and 2 separators
   - Navigate to `/wealth` — should redirect to `/overview`
   - Navigate to `/income` — should render the Income page stub
   - Navigate to `/surplus` — should show surplus breakdown + right-panel message
   - Navigate to `/goals` and `/gifts` — should show placeholder pages
   - On Overview with data: clicking "Income" tier heading navigates to `/income`
   - On Overview with data: clicking a subcategory row navigates to `/income?subcategory=...`
   - On Overview with no data: ghosted cascade + "Build your waterfall" card visible
   - Settings link is right-aligned in the nav bar
