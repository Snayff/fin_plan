---
feature: loading-error-states
spec: docs/4. planning/loading-error-states/loading-error-states-spec.md
phase:
status: pending
---

# Loading & Error States — Implementation Plan

> **For Claude:** Use `/execute-plan loading-error-states` to implement this plan task-by-task.

**Goal:** Establish consistent loading, error, and empty states across all query-driven panels so users never see blank space or silent failures.
**Spec:** `docs/4. planning/loading-error-states/loading-error-states-spec.md`
**Architecture:** One new `PanelError` component handles first-load failures; `StaleDataBanner` wired once into `Layout.tsx` covers stale-data failures globally; eight panels updated to check `isLoading`/`isError`/empty conditions. No backend or schema changes.
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind

## Pre-conditions

- [ ] `SkeletonLoader` exists at `apps/frontend/src/components/common/SkeletonLoader.tsx` with `left-panel` / `right-panel` variants
- [ ] `GhostedListEmpty` exists at `apps/frontend/src/components/ui/GhostedListEmpty.tsx`
- [ ] `StaleDataBanner` exists at `apps/frontend/src/components/common/StaleDataBanner.tsx`
- [ ] `useStaleDataBanner` exists at `apps/frontend/src/hooks/useStaleDataBanner.ts`
- [ ] `usePrefersReducedMotion` exists at `apps/frontend/src/utils/motion.ts`

## Tasks

### Task 1: Create `PanelError` component

**Files:**

- Create: `apps/frontend/src/components/common/PanelError.tsx`
- Test: `apps/frontend/src/components/common/PanelError.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { PanelError } from "./PanelError";

describe("PanelError", () => {
  it("renders Failed to load label", () => {
    render(<PanelError variant="right" onRetry={() => {}} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("renders optional contextual message", () => {
    render(<PanelError variant="right" onRetry={() => {}} message="Could not load accounts" />);
    expect(screen.getByText("Could not load accounts")).toBeTruthy();
  });

  it("calls onRetry when Retry is clicked", () => {
    const onRetry = mock(() => {});
    render(<PanelError variant="right" onRetry={onRetry} />);
    screen.getByText("Retry").click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders left variant", () => {
    const { container } = render(<PanelError variant="left" onRetry={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders detail variant", () => {
    const { container } = render(<PanelError variant="detail" onRetry={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/common/PanelError.test.tsx`
Expected: FAIL — `Cannot find module './PanelError'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/common/PanelError.tsx
interface PanelErrorProps {
  onRetry: () => void;
  variant: "left" | "right" | "detail";
  message?: string;
}

function GhostBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded ${className ?? ""}`}
      style={{ background: "#2a3f60", opacity: 0.3 }}
    />
  );
}

function GhostSkeleton({ variant }: { variant: "left" | "right" | "detail" }) {
  if (variant === "left") {
    return (
      <div className="space-y-3 p-4 w-full">
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-8 w-full" />
        <GhostBlock className="h-1 w-3/4 mt-2" />
        <GhostBlock className="h-1 w-1/2" />
      </div>
    );
  }
  if (variant === "right") {
    return (
      <div className="space-y-4 p-6 w-full">
        <GhostBlock className="h-12 w-2/3" />
        <GhostBlock className="h-40 w-full" />
        <div className="flex gap-2">
          <GhostBlock className="h-8 w-24" />
          <GhostBlock className="h-8 w-24" />
        </div>
      </div>
    );
  }
  // detail
  return (
    <div className="space-y-4 p-6 w-full">
      <GhostBlock className="h-8 w-1/2" />
      <GhostBlock className="h-28 w-full" />
      <GhostBlock className="h-4 w-3/4" />
      <GhostBlock className="h-4 w-1/2" />
      <GhostBlock className="h-4 w-2/3" />
    </div>
  );
}

export function PanelError({ onRetry, variant, message }: PanelErrorProps) {
  return (
    <div className="relative w-full h-full min-h-[200px]">
      <GhostSkeleton variant={variant} />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{ background: "rgba(8,10,20,0.70)", backdropFilter: "blur(2px)" }}
      >
        <p className="text-sm font-medium text-destructive">Failed to load</p>
        {message && (
          <p className="text-xs text-muted-foreground text-center max-w-[180px]">{message}</p>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
          style={{
            background: "hsl(0,40%,15%)",
            border: "1px solid hsl(0,60%,25%)",
            color: "hsl(var(--destructive))",
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/common/PanelError.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/common/PanelError.tsx apps/frontend/src/components/common/PanelError.test.tsx
git commit -m "feat(frontend): add PanelError component for first-load query failures"
```

---

### Task 2: Wire `StaleDataBanner` into `Layout.tsx`

**Files:**

- Modify: `apps/frontend/src/components/layout/Layout.tsx`

`StaleDataBanner` and `useStaleDataBanner` currently only appear in design pattern files. Wire them into the global layout so the amber banner shows whenever any background query fails while stale data is on screen (`isError && data`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/layout/Layout.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";
import { useAuthStore } from "@/stores/authStore";

function renderLayout(qc: QueryClient) {
  useAuthStore.setState({
    user: { id: "1", name: "Test", email: "t@test.com" } as any,
    accessToken: "tok",
    isAuthenticated: true,
    authStatus: "authenticated",
  } as any);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Layout StaleDataBanner", () => {
  it("shows stale data banner when a query errors", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderLayout(qc);
    // Trigger a query failure in the cache
    await qc.fetchQuery({
      queryKey: ["test-key"],
      queryFn: () => Promise.reject(new Error("fail")),
    }).catch(() => {});
    await waitFor(() => {
      expect(screen.getByText(/data may be outdated/i)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/layout/Layout.test.tsx`
Expected: FAIL or file not found

- [ ] **Step 3: Write minimal implementation**

Add `useStaleDataBanner` + `StaleDataBanner` to `Layout.tsx`. Place the banner immediately above `<main>` so it spans full width:

```typescript
// apps/frontend/src/components/layout/Layout.tsx
// Add these imports:
import { useStaleDataBanner } from "@/hooks/useStaleDataBanner";
import { StaleDataBanner } from "@/components/common/StaleDataBanner";
import { useQueryClient } from "@tanstack/react-query";

// Inside the Layout component, before the return:
const { showBanner, lastSyncedAt } = useStaleDataBanner();
const qc = useQueryClient();

function handleBannerRetry() {
  qc.getQueryCache().getAll().forEach((query) => {
    if (query.state.status === "error") {
      void qc.refetchQueries({ queryKey: query.queryKey });
    }
  });
}

// In the JSX, between header and main:
{showBanner && (
  <StaleDataBanner lastSyncedAt={lastSyncedAt} onRetry={handleBannerRetry} />
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/layout/Layout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/layout/Layout.tsx apps/frontend/src/components/layout/Layout.test.tsx
git commit -m "feat(frontend): wire StaleDataBanner into global layout"
```

---

### Task 3: Fix `OverviewPage` error state

**Files:**

- Modify: `apps/frontend/src/pages/OverviewPage.tsx`

Currently `useWaterfallSummary()` does not destructure `isError` or `refetch`. When the query fails with no cached data, the page shows the ghosted empty-waterfall state (the same as when the waterfall is empty), which is misleading.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/pages/OverviewPage.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import OverviewPage from "./OverviewPage";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({ data: undefined, isLoading: false, isError: true, refetch: () => {} }),
}));
mock.module("@/hooks/useSetupSession", () => ({
  useSetupSession: () => ({ data: undefined, isLoading: false }),
  useCreateSetupSession: () => ({ mutate: () => {} }),
  useUpdateSetupSession: () => ({ mutate: () => {} }),
}));
mock.module("@/hooks/useSettings", () => ({
  useSnapshot: () => ({ data: undefined }),
}));

describe("OverviewPage error state", () => {
  it("shows PanelError when waterfallSummary query fails with no data", () => {
    renderWithProviders(<OverviewPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/pages/OverviewPage.test.tsx`
Expected: FAIL — "Failed to load" not found

- [ ] **Step 3: Write minimal implementation**

In `OverviewPage.tsx`, update line ~91:

```typescript
// Before:
const { data: liveSummary, isLoading } = useWaterfallSummary();

// After:
const { data: liveSummary, isLoading, isError, refetch } = useWaterfallSummary();
```

Update the `left` panel construction (around line 147):

```typescript
const left = isLoading ? (
  <SkeletonLoader variant="left-panel" />
) : isError && !liveSummary ? (
  <PanelError variant="left" onRetry={refetch} message="Could not load your waterfall" />
) : inBuild && summary ? (
  // ... existing build mode branch
```

Add the import at the top:

```typescript
import { PanelError } from "@/components/common/PanelError";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/pages/OverviewPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/OverviewPage.tsx apps/frontend/src/pages/OverviewPage.test.tsx
git commit -m "feat(frontend): add error state to OverviewPage waterfall panel"
```

---

### Task 4: Fix `WealthPage` error state

**Files:**

- Modify: `apps/frontend/src/pages/WealthPage.tsx`

`WealthPage` handles `summaryLoading` but not `summaryError`. The accounts query uses `= []` default hiding error state.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/pages/WealthPage.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import WealthPage from "./WealthPage";

mock.module("@/hooks/useWealth", () => ({
  useWealthSummary: () => ({ data: undefined, isLoading: false, isError: true, refetch: () => {} }),
  useWealthAccounts: () => ({ data: undefined, isLoading: false, isError: false }),
  useIsaAllowance: () => ({ data: undefined }),
}));

describe("WealthPage error state", () => {
  it("shows PanelError in left panel when summary query fails", () => {
    renderWithProviders(<WealthPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/pages/WealthPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/pages/WealthPage.tsx
// Update destructuring:
const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useWealthSummary();
const { data: accounts = [] } = useWealthAccounts();
const { data: isaTotals } = useIsaAllowance();

// Add import:
import { PanelError } from "@/components/common/PanelError";

// Update left panel construction:
const left = summaryLoading ? (
  <SkeletonLoader variant="left-panel" />
) : summaryError && !summary ? (
  <PanelError variant="left" onRetry={summaryRefetch} message="Could not load wealth summary" />
) : summary ? (
  <WealthLeftPanel ... />
) : null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/pages/WealthPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/WealthPage.tsx apps/frontend/src/pages/WealthPage.test.tsx
git commit -m "feat(frontend): add error state to WealthPage left panel"
```

---

### Task 5: Fix `PlannerPage` — loading, error, and empty states

**Files:**

- Modify: `apps/frontend/src/pages/PlannerPage.tsx`

Currently all planner queries use `= []` defaults, hiding loading and error states. The right panel shows blank when purchases/gifts lists are empty.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/pages/PlannerPage.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import PlannerPage from "./PlannerPage";

mock.module("@/hooks/usePlanner", () => ({
  usePurchases: () => ({ data: undefined, isLoading: true, isError: false, refetch: () => {} }),
  useGiftPersons: () => ({ data: undefined, isLoading: false, isError: false, refetch: () => {} }),
  useYearBudget: () => ({ data: undefined, isLoading: false }),
  useUpcomingGifts: () => ({ data: undefined, isLoading: false, isError: false, refetch: () => {} }),
}));

describe("PlannerPage loading state", () => {
  it("shows SkeletonLoader in right panel when purchases are loading", () => {
    renderWithProviders(<PlannerPage />, { initialEntries: ["/planner"] });
    expect(document.querySelector('[data-page="planner"]')).toBeTruthy();
    // SkeletonLoader renders blocks (bg-muted class)
    const blocks = document.querySelectorAll(".bg-muted");
    expect(blocks.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/pages/PlannerPage.test.tsx`
Expected: FAIL — no skeleton visible

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/pages/PlannerPage.tsx
// Add imports:
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import React from "react";

// Remove = [] defaults; destructure isLoading/isError/refetch:
const { data: purchases, isLoading: purchasesLoading, isError: purchasesError, refetch: purchasesRefetch } = usePurchases(year);
const { data: giftPersons, isLoading: giftsLoading, isError: giftsError, refetch: giftsRefetch } = useGiftPersons(year);
const { data: budget } = useYearBudget(year);
const { data: upcoming, isLoading: upcomingLoading, isError: upcomingError, refetch: upcomingRefetch } = useUpcomingGifts(year);

// Pass safe defaults to left panel:
const left = (
  <PlannerLeftPanel
    year={year}
    budget={budget}
    purchases={purchases ?? []}
    giftPersons={giftPersons ?? []}
    activeView={activeView}
    onSelectView={(v) => setView({ type: v })}
  />
);

// Right panel — wrap each view with state checks:
let right: React.ReactNode | null = null;
if (view.type === "purchases") {
  if (purchasesLoading && !purchases) {
    right = <SkeletonLoader variant="right-panel" />;
  } else if (purchasesError && !purchases) {
    right = <PanelError variant="right" onRetry={purchasesRefetch} message="Could not load purchases" />;
  } else if (!purchasesLoading && !purchasesError && (purchases ?? []).length === 0) {
    right = (
      <GhostedListEmpty
        ctaText="No purchases planned yet"
        ctaButtonLabel="+ Add purchase"
        onCtaClick={() => { /* trigger add — PurchaseListPanel handles this */ }}
        showCta={!isReadOnly}
      />
    );
  } else {
    right = <PurchaseListPanel year={year} purchases={purchases ?? []} isReadOnly={isReadOnly} />;
  }
} else if (view.type === "gifts-upcoming") {
  if (upcomingLoading && !upcoming) {
    right = <SkeletonLoader variant="right-panel" />;
  } else if (upcomingError && !upcoming) {
    right = <PanelError variant="right" onRetry={upcomingRefetch} message="Could not load gift events" />;
  } else if (!upcomingLoading && !upcomingError && (upcoming ?? []).length === 0) {
    right = (
      <GhostedListEmpty ctaText="No upcoming gift events" showCta={false} />
    );
  } else {
    right = <GiftUpcomingPanel year={year} gifts={upcoming ?? []} isReadOnly={isReadOnly} />;
  }
} else if (view.type === "gifts-by-person") {
  if (giftsLoading && !giftPersons) {
    right = <SkeletonLoader variant="right-panel" />;
  } else if (giftsError && !giftPersons) {
    right = <PanelError variant="right" onRetry={giftsRefetch} message="Could not load gift people" />;
  } else if (!giftsLoading && !giftsError && (giftPersons ?? []).length === 0) {
    right = (
      <GhostedListEmpty
        ctaText="No gift people yet"
        ctaButtonLabel="+ Add person"
        onCtaClick={() => { /* handled by GiftPersonListPanel */ }}
        showCta={!isReadOnly}
      />
    );
  } else {
    right = (
      <GiftPersonListPanel
        year={year}
        persons={giftPersons ?? []}
        isReadOnly={isReadOnly}
        onSelectPerson={(p) => setView({ type: "gift-person", person: p })}
        selectedPersonId={null}
      />
    );
  }
} else if (view.type === "gift-person") {
  right = (
    <GiftPersonDetailPanel
      personId={view.person.id}
      year={year}
      onBack={() => setView({ type: "gifts-by-person" })}
      isReadOnly={isReadOnly}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/pages/PlannerPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/PlannerPage.tsx apps/frontend/src/pages/PlannerPage.test.tsx
git commit -m "feat(frontend): add loading/error/empty states to PlannerPage right panel"
```

---

### Task 6: Fix `CashflowCalendar` — loading and error states

**Files:**

- Modify: `apps/frontend/src/components/overview/CashflowCalendar.tsx`

`useCashflow` already destructures `isLoading` but only uses it to conditionally render. No error state or SkeletonLoader.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/CashflowCalendar.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CashflowCalendar } from "./CashflowCalendar";

mock.module("@/hooks/useWaterfall", () => ({
  useCashflow: () => ({ data: undefined, isLoading: false, isError: true, refetch: () => {} }),
}));

describe("CashflowCalendar error state", () => {
  it("shows PanelError when cashflow query fails", () => {
    render(<CashflowCalendar year={2026} onBack={() => {}} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/CashflowCalendar.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/overview/CashflowCalendar.tsx
// Add imports:
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";

// Update destructuring:
const { data: months, isLoading, isError, refetch } = useCashflow(year);

// At top of return, before the existing space-y-4 div, add state guards:
if (isLoading && !months) return <SkeletonLoader variant="right-panel" />;
if (isError && !months) return <PanelError variant="right" onRetry={refetch} message="Could not load cashflow calendar" />;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/CashflowCalendar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/CashflowCalendar.tsx apps/frontend/src/components/overview/CashflowCalendar.test.tsx
git commit -m "feat(frontend): add loading/error states to CashflowCalendar"
```

---

### Task 7: Fix `AccountDetailPanel` and `ItemDetailPanel` — loading and error for history

**Files:**

- Modify: `apps/frontend/src/components/wealth/AccountDetailPanel.tsx`
- Modify: `apps/frontend/src/components/overview/ItemDetailPanel.tsx`

Both panels use `history = []` defaults and never show a loading or error state. The history chart area is blank until data arrives.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/wealth/AccountDetailPanel.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { AccountDetailPanel } from "./AccountDetailPanel";

mock.module("@/hooks/useWealth", () => ({
  useAccountHistory: () => ({ data: undefined, isLoading: false, isError: true, refetch: () => {} }),
  useUpdateValuation: () => ({ mutate: () => {}, isPending: false }),
  useConfirmAccount: () => ({ mutate: () => {}, isPending: false }),
  useUpdateAccount: () => ({ mutate: () => {}, isPending: false }),
}));
mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
}));

const mockAccount = {
  id: "acc-1",
  name: "Savings",
  assetClass: "savings",
  balance: 10000,
  provider: "Monzo",
  lastReviewedAt: new Date().toISOString(),
  savingsAllocations: [],
};

describe("AccountDetailPanel error state", () => {
  it("shows PanelError when account history fails", () => {
    renderWithProviders(<AccountDetailPanel account={mockAccount} onBack={() => {}} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/wealth/AccountDetailPanel.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

**AccountDetailPanel.tsx** — update history query and add state guards:

```typescript
// Add import:
import { PanelError } from "@/components/common/PanelError";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

// Update history query (line ~49):
const { data: history, isLoading: historyLoading, isError: historyError, refetch: historyRefetch } = useAccountHistory(account.id);

// Add early returns after existing useState declarations:
if (historyLoading && !history) return <SkeletonLoader variant="right-panel" />;
if (historyError && !history) return <PanelError variant="detail" onRetry={historyRefetch} message="Could not load account history" />;

// Update historyChartData to use ?? []:
const historyChartData = (history ?? []).map((h: any) => ({
  recordedAt: h.recordedAt ?? h.valuationDate,
  value: h.balance ?? h.value,
}));
```

**ItemDetailPanel.tsx** — update history query:

```typescript
// Add import:
import { PanelError } from "@/components/common/PanelError";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

// Update history query (line ~36):
const { data: historyRaw, isLoading: historyLoading, isError: historyError, refetch: historyRefetch } = useItemHistory(item.type, item.id);

// Add early returns before the history mapping:
if (historyLoading && !historyRaw) return <SkeletonLoader variant="right-panel" />;
if (historyError && !historyRaw) return <PanelError variant="detail" onRetry={historyRefetch} message="Could not load item history" />;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/wealth/AccountDetailPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/wealth/AccountDetailPanel.tsx apps/frontend/src/components/overview/ItemDetailPanel.tsx apps/frontend/src/components/wealth/AccountDetailPanel.test.tsx
git commit -m "feat(frontend): add loading/error states to AccountDetailPanel and ItemDetailPanel"
```

---

### Task 8: Fix `GiftPersonDetailPanel` — error state

**Files:**

- Modify: `apps/frontend/src/components/planner/GiftPersonDetailPanel.tsx`

Already has `isLoading` check with `SkeletonLoader`. Missing `isError` check — when the query fails, `!person` shows "Person not found" instead of a retryable error.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/planner/GiftPersonDetailPanel.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { GiftPersonDetailPanel } from "./GiftPersonDetailPanel";

mock.module("@/hooks/usePlanner", () => ({
  useGiftPerson: () => ({ data: undefined, isLoading: false, isError: true, refetch: () => {} }),
  useCreateGiftEvent: () => ({ mutate: () => {}, isPending: false }),
  useDeleteGiftEvent: () => ({ mutate: () => {}, isPending: false }),
  useUpsertGiftYearRecord: () => ({ mutate: () => {}, isPending: false }),
  useUpdateGiftPerson: () => ({ mutate: () => {}, isPending: false }),
}));

describe("GiftPersonDetailPanel error state", () => {
  it("shows PanelError when person query fails", () => {
    renderWithProviders(
      <GiftPersonDetailPanel personId="p-1" year={2026} onBack={() => {}} isReadOnly={false} />
    );
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/planner/GiftPersonDetailPanel.test.tsx`
Expected: FAIL — "Failed to load" not found (shows "Person not found" instead)

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/planner/GiftPersonDetailPanel.tsx
// Add import:
import { PanelError } from "@/components/common/PanelError";

// In GiftPersonDetailPanel, update the existing early-return block:
const { data: person, isLoading, isError, refetch } = useGiftPerson(personId, year);

if (isLoading) {
  return <SkeletonLoader variant="right-panel" />;
}

if (isError && !person) {
  return <PanelError variant="detail" onRetry={refetch} message="Could not load gift person" />;
}

if (!person) {
  return <div className="text-sm text-muted-foreground italic p-4">Person not found.</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/planner/GiftPersonDetailPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/planner/GiftPersonDetailPanel.tsx apps/frontend/src/components/planner/GiftPersonDetailPanel.test.tsx
git commit -m "feat(frontend): add error state to GiftPersonDetailPanel"
```

---

### Task 9: Fix `SnapshotTimeline` — loading and empty states

**Files:**

- Modify: `apps/frontend/src/components/overview/SnapshotTimeline.tsx`

`SnapshotTimeline` is a fixed-height (h-8) horizontal strip header, not a full panel. The standard `SkeletonLoader` won't fit this context. **Exception:** instead of `SkeletonLoader`, use an inline shimmer strip in the dots area; instead of `GhostedListEmpty`, show "No snapshots yet" text inline. The canonical 4-state decision tree still applies but the components are adapted to fit the h-8 constraint.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/SnapshotTimeline.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SnapshotTimeline } from "./SnapshotTimeline";

mock.module("@/hooks/useSettings", () => ({
  useSnapshots: () => ({ data: [], isLoading: false, isError: false }),
}));

const baseProps = {
  selectedId: null,
  onSelect: () => {},
  onSelectNow: () => {},
  onOpenCreate: () => {},
};

describe("SnapshotTimeline empty state", () => {
  it("shows 'No snapshots yet' when snapshots list is empty", () => {
    render(<SnapshotTimeline {...baseProps} />);
    expect(screen.getByText("No snapshots yet")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/SnapshotTimeline.test.tsx`
Expected: FAIL — "No snapshots yet" not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/overview/SnapshotTimeline.tsx
// Update query destructuring:
const { data: snapshots, isLoading: snapshotsLoading, isError: snapshotsError, refetch: snapshotsRefetch } = useSnapshots();

const sorted = [...((snapshots as any[]) ?? [])].sort(
  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

// In the scrollable dot row, replace the map with state-aware content:
<div
  ref={scrollRef}
  className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3"
  onScroll={checkScroll}
>
  {snapshotsLoading && !snapshots ? (
    // Inline shimmer strip for the h-8 timeline context
    <div className="flex gap-2 items-center px-1">
      {[60, 80, 50, 70].map((w, i) => (
        <div key={i} className="h-1.5 rounded-full bg-muted/40 animate-pulse" style={{ width: w }} />
      ))}
    </div>
  ) : snapshotsError && !snapshots ? (
    <button
      type="button"
      onClick={() => void snapshotsRefetch()}
      className="text-xs text-destructive hover:underline shrink-0"
    >
      Failed to load — Retry
    </button>
  ) : sorted.length === 0 ? (
    <span className="text-xs text-muted-foreground italic">No snapshots yet</span>
  ) : (
    sorted.map((snap) => (
      // ... existing button code unchanged
    ))
  )}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/SnapshotTimeline.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/SnapshotTimeline.tsx apps/frontend/src/components/overview/SnapshotTimeline.test.tsx
git commit -m "feat(frontend): add loading/empty/error states to SnapshotTimeline"
```

---

### Task 10: Fix `SettingsPage` sections — loading and error states

**Files:**

- Modify: `apps/frontend/src/pages/SettingsPage.tsx`
- Modify: `apps/frontend/src/components/settings/StalenessSection.tsx`
- Modify: `apps/frontend/src/components/settings/SurplusSection.tsx`
- Modify: `apps/frontend/src/components/settings/IsaSection.tsx`
- Modify: `apps/frontend/src/components/settings/HouseholdSection.tsx`

Settings page sections that use `useSettings()` need loading/error treatment. Add a `useSettings()` call to the page level; if loading/erroring and no cached data, show SkeletonLoader/PanelError in place of the right-hand content area.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/pages/SettingsPage.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import SettingsPage from "./SettingsPage";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined, isLoading: true, isError: false }),
  useEndedIncome: () => ({ data: [], isLoading: false }),
  useReactivateIncome: () => ({ mutate: () => {}, isPending: false }),
  useSnapshots: () => ({ data: [], isLoading: false }),
}));

describe("SettingsPage loading state", () => {
  it("shows skeleton in content area when settings are loading", () => {
    renderWithProviders(<SettingsPage />);
    // SkeletonLoader blocks appear (bg-muted class)
    const blocks = document.querySelectorAll(".bg-muted");
    expect(blocks.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/pages/SettingsPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Add `useSettings` at the page level in `SettingsPage.tsx`. Show `SkeletonLoader` or `PanelError` in the content area when the primary settings query is loading/erroring:

```typescript
// apps/frontend/src/pages/SettingsPage.tsx
// Add imports:
import { useSettings } from "@/hooks/useSettings";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useQueryClient } from "@tanstack/react-query";

// In SettingsPage:
const { isLoading: settingsLoading, isError: settingsError, refetch: settingsRefetch } = useSettings();

// In the JSX, replace the content div with:
<div className="flex-1 overflow-y-auto p-8">
  <h1 className="sr-only">Settings</h1>
  {settingsLoading ? (
    <SkeletonLoader variant="right-panel" />
  ) : settingsError ? (
    <PanelError variant="right" onRetry={settingsRefetch} message="Could not load settings" />
  ) : (
    <div className="max-w-2xl space-y-12">
      {/* ... existing sections unchanged ... */}
    </div>
  )}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/pages/SettingsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/SettingsPage.tsx apps/frontend/src/pages/SettingsPage.test.tsx
git commit -m "feat(frontend): add loading/error states to SettingsPage content area"
```

---

### Task 11: Update `docs/2. design/design-system.md` with Data States section

**Files:**

- Modify: `docs/2. design/design-system.md`

Add the canonical "Data states" decision table immediately after the Loading strategy note in the existing design system doc.

- [ ] **Step 1: Locate the loading strategy section**

Find the existing "Loading strategy" note in `docs/2. design/design-system.md` (search for "skeleton screens only").

- [ ] **Step 2: Insert the Data States section**

Append a new `### Data states` subsection after the loading strategy bullet:

```markdown
### Data states

Canonical decision tree for all query-driven panels:

| State           | Condition                                     | Component                        | Notes                                 |
| --------------- | --------------------------------------------- | -------------------------------- | ------------------------------------- |
| Loading         | `isLoading && !data`                          | `SkeletonLoader`                 | `left-panel` or `right-panel` variant |
| Error (no data) | `isError && !data`                            | `PanelError` + `StaleDataBanner` | `onRetry` = `refetch`                 |
| Error (stale)   | `isError && data`                             | `StaleDataBanner` only           | user keeps last-known data            |
| Empty           | `!isLoading && !isError && data.length === 0` | `GhostedListEmpty`               | always include CTA or guidance        |
| Success         | `data && data.length > 0`                     | content                          | silence = approval                    |

`StaleDataBanner` is wired globally in `Layout.tsx` and fires automatically for the stale path. `PanelError` must be rendered explicitly per panel for the no-data error path.
```

- [ ] **Step 3: Commit**

```bash
git add "docs/2. design/design-system.md"
git commit -m "docs: add Data states decision table to design system"
```

---

## Testing

### Frontend Tests

- [ ] `PanelError`: renders all three variants, shows message, calls onRetry
- [ ] `Layout`: shows StaleDataBanner when a query errors
- [ ] `OverviewPage`: shows PanelError when waterfallSummary fails
- [ ] `WealthPage`: shows PanelError when summary fails
- [ ] `PlannerPage`: shows SkeletonLoader when loading, PanelError on error, GhostedListEmpty when empty
- [ ] `CashflowCalendar`: shows SkeletonLoader when loading, PanelError on error
- [ ] `AccountDetailPanel`: shows SkeletonLoader/PanelError when history fails
- [ ] `ItemDetailPanel`: shows SkeletonLoader/PanelError when history fails
- [ ] `GiftPersonDetailPanel`: shows PanelError instead of "Person not found" when query errors
- [ ] `SnapshotTimeline`: shows "No snapshots yet" when empty, shimmer when loading

### Key Scenarios

- [ ] Happy path: all pages load and render content normally
- [ ] Error (no data): kill backend → each fixed panel shows PanelError + amber StaleDataBanner
- [ ] Error (stale data): load page, kill backend, trigger background refetch → StaleDataBanner only, content stays visible
- [ ] Empty: clear data for a section → GhostedListEmpty renders with appropriate CTA

## Verification

- [ ] `bun run lint` — zero warnings
- [ ] `bun run type-check` — no errors
- [ ] `cd apps/frontend && bun test` — all tests pass
- [ ] Manual: `bun run start`, open DevTools → Network → block `*/api/*` → navigate each page → confirm PanelError renders
- [ ] Manual: load a page with data, then block network → confirm StaleDataBanner only (no PanelError)
- [ ] Manual: clear DB for a section → confirm GhostedListEmpty renders
- [ ] Manual: `docs/2. design/design-system.md` contains "Data states" section

## Post-conditions

- [ ] All query-driven panels follow the canonical 4-state decision tree
- [ ] `PanelError` available as a reusable component for any future panel
- [ ] New features can reference the "Data states" table in design-system.md for consistency
