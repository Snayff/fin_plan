---
feature: navigation-and-page-structure
spec: docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md
creation_date: 2026-03-26
status: backlog
implemented_date:
---

# Navigation & Page Structure: Tier Pages — Implementation Plan

> **For Claude:** Use `/execute-plan navigation-and-page-structure` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Build the three tier pages (Income, Committed, Discretionary) using a shared `TierPage` shell with `SubcategoryList` (left panel), `ItemArea` (right panel header + item list), `ItemRow`, `ItemAccordion` (detail view), `ItemForm` (add/edit), `GhostAddButton`, and `EmptyStateCard`. Wire up all mutations (create, update, confirm, delete). Handle pre-selected subcategory from Overview click-through via URL search params.
**Spec:** `docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md`
**Pre-condition:** Plans 1 and 2 implemented — schema/backend live, routes wired, stub pages exist at `/income`, `/committed`, `/discretionary`.
**Tech Stack:** React 18 · React Router v6 · TanStack Query · Tailwind · Zustand

## Pre-conditions

- [x] Plans 1 & 2 implemented
- [x] Stub `IncomePage`, `CommittedPage`, `DiscretionaryPage` at `apps/frontend/src/pages/`
- [x] `useSubcategories(tier)` hook in `apps/frontend/src/hooks/useWaterfall.ts`
- [x] `useWaterfallSummary()` hook with subcategory-grouped items
- [x] `waterfallService` with full CRUD methods for committed/discretionary items
- [x] Existing `toGBP` utility from `@finplan/shared`
- [x] Design tokens: `tier-income`, `tier-committed`, `tier-discretionary`, Tailwind config

## Architecture Overview

The three tier pages share a single `TierPage` shell component. The shell accepts a `tier` prop (`"income" | "committed" | "discretionary"`) and a tier config object (colour class, item type label, CRUD hooks). Both `IncomePage`, `CommittedPage`, and `DiscretionaryPage` are thin wrappers that pass the correct config.

Component tree:

```
TierPage
  ├── SubcategoryList (left panel)
  └── ItemArea (right panel)
       ├── GhostAddButton
       ├── ItemForm (add mode, shown when adding)
       ├── ItemRow (repeated)
       │    └── ItemAccordion (expanded inline, one at a time)
       │         └── ItemForm (edit mode, shown when editing)
       └── EmptyStateCard (when subcategory has no items)
```

State model (local to TierPage):

- `selectedSubcategoryId` — which subcategory is shown in the right panel (defaults to first, or from URL `?subcategory=`)
- `expandedItemId` — which item has its accordion open (null = none)
- `editingItemId` — which item is in edit mode (null = none)
- `isAddingItem` — whether the add form is shown at the top of the list

---

## Tasks

---

### Task 1: Tier config and TierPage shell

**Files:**

- Create: `apps/frontend/src/components/tier/TierPage.tsx`
- Create: `apps/frontend/src/components/tier/tierConfig.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/components/tier/TierPage.test.tsx`:

```tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TierPage from "./TierPage";

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: mock(() => ({
    isLoading: false,
    data: [
      { id: "sub-housing", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false },
      { id: "sub-utilities", name: "Utilities", tier: "committed", sortOrder: 1, isLocked: false },
    ],
  })),
  useWaterfallSummary: mock(() => ({
    isLoading: false,
    data: {
      committed: {
        total: 1500,
        subcategories: [
          { subcategoryId: "sub-housing", name: "Housing", total: 1200, items: [] },
          { subcategoryId: "sub-utilities", name: "Utilities", total: 300, items: [] },
        ],
      },
    },
  })),
}));

function renderTierPage(path = "/committed") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/committed" element={<TierPage tier="committed" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("TierPage", () => {
  it("renders the page shell with data-testid", () => {
    renderTierPage();
    expect(screen.getByTestId("tier-page-committed")).toBeTruthy();
  });

  it("renders subcategory names in the left panel", () => {
    renderTierPage();
    expect(screen.getByText("Housing")).toBeTruthy();
    expect(screen.getByText("Utilities")).toBeTruthy();
  });

  it("selects the first subcategory by default", () => {
    renderTierPage();
    const housing = screen.getByTestId("subcategory-row-sub-housing");
    expect(housing.getAttribute("aria-selected")).toBe("true");
  });

  it("selects a subcategory from the URL ?subcategory= param", () => {
    renderTierPage("/committed?subcategory=sub-utilities");
    const utilities = screen.getByTestId("subcategory-row-sub-utilities");
    expect(utilities.getAttribute("aria-selected")).toBe("true");
  });
});
```

Run: `cd apps/frontend && bun test src/components/tier/TierPage.test.tsx` — expect failure.

- [ ] **Step 2: Create tierConfig.ts**

```ts
// Tier colours and labels for use in TierPage and child components
export type TierKey = "income" | "committed" | "discretionary";

export interface TierConfig {
  tier: TierKey;
  label: string;
  /** Tailwind text colour class for the tier */
  textClass: string;
  /** Tailwind bg colour class at low opacity (for hover/selected states) */
  bgClass: string;
  /** Tailwind border colour class (for selected left border) */
  borderClass: string;
}

export const TIER_CONFIGS: Record<TierKey, TierConfig> = {
  income: {
    tier: "income",
    label: "Income",
    textClass: "text-tier-income",
    bgClass: "bg-tier-income",
    borderClass: "border-tier-income",
  },
  committed: {
    tier: "committed",
    label: "Committed",
    textClass: "text-tier-committed",
    bgClass: "bg-tier-committed",
    borderClass: "border-tier-committed",
  },
  discretionary: {
    tier: "discretionary",
    label: "Discretionary",
    textClass: "text-tier-discretionary",
    bgClass: "bg-tier-discretionary",
    borderClass: "border-tier-discretionary",
  },
};
```

- [ ] **Step 3: Create TierPage.tsx shell**

```tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import TwoPanelLayout from "@/components/layout/TwoPanelLayout";
import SubcategoryList from "./SubcategoryList";
import ItemArea from "./ItemArea";
import { useSubcategories, useWaterfallSummary } from "@/hooks/useWaterfall";
import { TIER_CONFIGS, type TierKey } from "./tierConfig";

interface TierPageProps {
  tier: TierKey;
}

export default function TierPage({ tier }: TierPageProps) {
  const config = TIER_CONFIGS[tier];
  const [searchParams] = useSearchParams();
  const { data: subcategories, isLoading: subsLoading } = useSubcategories(tier);
  const { data: summary, isLoading: summaryLoading } = useWaterfallSummary();

  const tierSummary = summary?.[tier];
  const subcategoryTotals = Object.fromEntries(
    (tierSummary?.subcategories ?? []).map((s) => [s.subcategoryId, s])
  );

  // Select subcategory: URL param → first in list
  const paramId = searchParams.get("subcategory");
  const defaultId = subcategories?.[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(paramId ?? defaultId);

  // Sync selected to default once subcategories load
  const resolvedSelectedId =
    selectedId && subcategories?.some((s) => s.id === selectedId)
      ? selectedId
      : (subcategories?.[0]?.id ?? null);

  const selectedSubcategory = subcategories?.find((s) => s.id === resolvedSelectedId) ?? null;
  const selectedSummary = resolvedSelectedId ? subcategoryTotals[resolvedSelectedId] : null;

  return (
    <div data-testid={`tier-page-${tier}`} className="relative min-h-screen">
      {/* Tier ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 20% 20%, var(--color-tier-${tier}-glow, rgba(0,0,0,0.06)) 0%, transparent 70%)`,
        }}
      />
      <TwoPanelLayout
        left={
          <SubcategoryList
            tier={tier}
            config={config}
            subcategories={subcategories ?? []}
            subcategoryTotals={subcategoryTotals}
            tierTotal={tierSummary?.total ?? 0}
            selectedId={resolvedSelectedId}
            onSelect={setSelectedId}
            isLoading={subsLoading}
          />
        }
        right={
          <ItemArea
            tier={tier}
            config={config}
            subcategory={selectedSubcategory}
            items={selectedSummary?.items ?? []}
            isLoading={summaryLoading}
          />
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/TierPage.test.tsx`

- [ ] **Step 5: Commit**

```
feat(frontend): add TierPage shell and tier config
```

---

### Task 2: SubcategoryList

**Files:**

- Create: `apps/frontend/src/components/tier/SubcategoryList.tsx`
- Create: `apps/frontend/src/components/tier/SubcategoryList.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import SubcategoryList from "./SubcategoryList";
import { TIER_CONFIGS } from "./tierConfig";

const subcategories = [
  { id: "sub-housing", name: "Housing", tier: "committed" as const, sortOrder: 0, isLocked: false },
  {
    id: "sub-utilities",
    name: "Utilities",
    tier: "committed" as const,
    sortOrder: 1,
    isLocked: false,
  },
];

const subcategoryTotals = {
  "sub-housing": { subcategoryId: "sub-housing", name: "Housing", total: 1200, items: [] },
  "sub-utilities": { subcategoryId: "sub-utilities", name: "Utilities", total: 300, items: [] },
};

function renderList(selectedId = "sub-housing", onSelect = mock(() => {})) {
  return render(
    <SubcategoryList
      tier="committed"
      config={TIER_CONFIGS.committed}
      subcategories={subcategories}
      subcategoryTotals={subcategoryTotals}
      tierTotal={1500}
      selectedId={selectedId}
      onSelect={onSelect}
      isLoading={false}
    />
  );
}

describe("SubcategoryList", () => {
  it("renders all subcategory rows", () => {
    renderList();
    expect(screen.getByTestId("subcategory-row-sub-housing")).toBeTruthy();
    expect(screen.getByTestId("subcategory-row-sub-utilities")).toBeTruthy();
  });

  it("marks the selected row with aria-selected", () => {
    renderList("sub-housing");
    expect(screen.getByTestId("subcategory-row-sub-housing").getAttribute("aria-selected")).toBe(
      "true"
    );
    expect(screen.getByTestId("subcategory-row-sub-utilities").getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("calls onSelect when a row is clicked", () => {
    const onSelect = mock(() => {});
    renderList("sub-housing", onSelect);
    fireEvent.click(screen.getByTestId("subcategory-row-sub-utilities"));
    expect(onSelect).toHaveBeenCalledWith("sub-utilities");
  });

  it("shows tier total at the bottom", () => {
    renderList();
    expect(screen.getByTestId("tier-total")).toBeTruthy();
    expect(screen.getByText(/1,500/)).toBeTruthy();
  });

  it("shows amounts for each subcategory", () => {
    renderList();
    expect(screen.getByText(/1,200/)).toBeTruthy();
    expect(screen.getByText(/300/)).toBeTruthy();
  });
});
```

Run — expect failure.

- [ ] **Step 2: Implement SubcategoryList.tsx**

```tsx
import { toGBP } from "@finplan/shared";
import type { TierConfig, TierKey } from "./tierConfig";

interface SubcategoryRow {
  id: string;
  name: string;
  tier: TierKey;
  sortOrder: number;
  isLocked: boolean;
}

interface SubcategorySummary {
  subcategoryId: string;
  name: string;
  total: number;
  items: any[];
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  subcategories: SubcategoryRow[];
  subcategoryTotals: Record<string, SubcategorySummary>;
  tierTotal: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export default function SubcategoryList({
  config,
  subcategories,
  subcategoryTotals,
  tierTotal,
  selectedId,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-foreground/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {subcategories.map((sub) => {
          const isSelected = sub.id === selectedId;
          const summary = subcategoryTotals[sub.id];
          // Staleness: an item is stale if any item in the subcategory has a stale lastReviewedAt
          // (staleness detection deferred to Task 8 — show empty stale column for now)
          return (
            <button
              key={sub.id}
              data-testid={`subcategory-row-${sub.id}`}
              aria-selected={isSelected}
              onClick={() => onSelect(sub.id)}
              className={[
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? `border-l-2 ${config.borderClass} ${config.bgClass}/14 font-medium ${config.textClass}`
                  : "border-l-2 border-transparent text-foreground/60 hover:bg-foreground/5",
              ].join(" ")}
            >
              {/* Stale dot column (fixed width, always present) */}
              <span className="w-2 shrink-0" aria-hidden />
              <span className="flex-1">{sub.name}</span>
              <span className="font-numeric text-xs text-foreground/50">
                {summary ? toGBP(summary.total) : "£0"}
              </span>
            </button>
          );
        })}
      </div>
      {/* Tier total */}
      <div
        data-testid="tier-total"
        className="border-t border-foreground/10 px-4 py-3 flex justify-between text-sm"
      >
        <span className="text-foreground/50">Total</span>
        <span className={`font-numeric font-semibold ${config.textClass}`}>{toGBP(tierTotal)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/SubcategoryList.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add SubcategoryList component
```

---

### Task 3: EmptyStateCard

**Files:**

- Create: `apps/frontend/src/components/tier/EmptyStateCard.tsx`
- Create: `apps/frontend/src/components/tier/emptyStateCopy.ts`
- Create: `apps/frontend/src/components/tier/EmptyStateCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyStateCard from "./EmptyStateCard";

describe("EmptyStateCard", () => {
  it("renders the header and body copy for a subcategory", () => {
    render(<EmptyStateCard subcategoryName="Housing" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByText("Add your housing costs")).toBeTruthy();
    expect(screen.getByText(/rent/i)).toBeTruthy();
  });

  it("renders the + Add item button", () => {
    render(<EmptyStateCard subcategoryName="Housing" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByRole("button", { name: /add item/i })).toBeTruthy();
  });

  it("calls onAddItem when the button is clicked", () => {
    let called = false;
    render(
      <EmptyStateCard
        subcategoryName="Housing"
        tier="committed"
        onAddItem={() => {
          called = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(called).toBe(true);
  });

  it("falls back gracefully for an unknown subcategory name", () => {
    render(<EmptyStateCard subcategoryName="Unknown" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByRole("button", { name: /add item/i })).toBeTruthy();
  });
});
```

Run — expect failure.

- [ ] **Step 2: Create emptyStateCopy.ts**

```ts
// Empty state copy per subcategory, keyed by normalised name.
// The spec defines exact copy — do not alter wording.

interface EmptyStateCopy {
  header: string;
  body: string;
}

const COPY: Record<string, EmptyStateCopy> = {
  // Income
  salary: { header: "Add your salary", body: "Employment income, take-home pay" },
  dividends: { header: "Add your dividends", body: "Investment income, shareholder dividends" },
  "income-other": { header: "Add your income", body: "Rental income, freelance, side projects" },
  // Committed
  housing: { header: "Add your housing costs", body: "Rent, mortgage, council tax, insurance" },
  utilities: { header: "Add your utilities", body: "Gas, electric, water, internet, phone" },
  services: { header: "Add your services", body: "Streaming, TV, gym, subscriptions" },
  "committed-other": {
    header: "Add your committed costs",
    body: "Any regular obligation not covered above",
  },
  // Discretionary
  food: { header: "Add your food budget", body: "Groceries, meal kits, work lunches" },
  fun: { header: "Add your fun spending", body: "Eating out, takeaways, cinema, hobbies" },
  clothes: { header: "Add your clothes budget", body: "Clothing, shoes, accessories" },
  gifts: { header: "Add your gift budget", body: "Configured from the Gifts page" },
  savings: { header: "Add your savings", body: "Emergency fund, ISA, pension top-up" },
  "discretionary-other": {
    header: "Add your spending",
    body: "Anything not covered in the categories above",
  },
};

const FALLBACKS: Record<string, EmptyStateCopy> = {
  income: { header: "Add your income", body: "Add a source of income" },
  committed: { header: "Add your committed costs", body: "Add a regular committed expense" },
  discretionary: { header: "Add your spending", body: "Add a discretionary spending category" },
};

export function getEmptyStateCopy(subcategoryName: string, tier: string): EmptyStateCopy {
  // Normalise: lowercase, trim
  const key = subcategoryName.toLowerCase().trim();
  // Try exact key first
  if (COPY[key]) return COPY[key];
  // Try tier-qualified "other"
  const otherKey = `${tier}-other`;
  if (COPY[otherKey]) return COPY[otherKey];
  // Tier fallback
  return FALLBACKS[tier] ?? { header: "Add items", body: "Add items to this subcategory" };
}
```

- [ ] **Step 3: Implement EmptyStateCard.tsx**

```tsx
import { getEmptyStateCopy } from "./emptyStateCopy";

interface Props {
  subcategoryName: string;
  tier: string;
  onAddItem: () => void;
}

export default function EmptyStateCard({ subcategoryName, tier, onAddItem }: Props) {
  const copy = getEmptyStateCopy(subcategoryName, tier);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        className="w-full max-w-sm rounded-xl p-6"
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
          {copy.header}
        </h3>
        <p className="mt-2 text-sm text-foreground/60">{copy.body}</p>
        <button
          onClick={onAddItem}
          className="mt-4 rounded-lg bg-page-accent/20 px-4 py-2 text-sm font-medium text-page-accent hover:bg-page-accent/30 transition-colors"
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/EmptyStateCard.test.tsx`

- [ ] **Step 5: Commit**

```
feat(frontend): add EmptyStateCard with per-subcategory copy
```

---

### Task 4: GhostAddButton

**Files:**

- Create: `apps/frontend/src/components/tier/GhostAddButton.tsx`
- Create: `apps/frontend/src/components/tier/GhostAddButton.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import GhostAddButton from "./GhostAddButton";

describe("GhostAddButton", () => {
  it("renders '+ Add' text", () => {
    render(<GhostAddButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /\+ add/i })).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    let called = false;
    render(
      <GhostAddButton
        onClick={() => {
          called = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(called).toBe(true);
  });

  it("is disabled when disabled prop is true", () => {
    render(<GhostAddButton onClick={() => {}} disabled />);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
```

Run — expect failure.

- [ ] **Step 2: Implement GhostAddButton.tsx**

```tsx
interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function GhostAddButton({ onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-md border px-3 py-1 text-xs font-medium transition-all duration-150",
        "border-foreground/10 text-foreground/45",
        "hover:border-page-accent/40 hover:bg-page-accent/8 hover:text-foreground/80",
        "disabled:cursor-not-allowed disabled:opacity-40",
      ].join(" ")}
    >
      + Add
    </button>
  );
}
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/GhostAddButton.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add GhostAddButton component
```

---

### Task 5: ItemRow

**Files:**

- Create: `apps/frontend/src/components/tier/ItemRow.tsx`
- Create: `apps/frontend/src/components/tier/ItemRow.test.tsx`
- Create: `apps/frontend/src/components/tier/formatAmount.ts`

The spec requires: monthly items show `£350`; yearly items show `£840 · £70/mo`; one-off items show `£1,200 · £100/mo` with a "One-off" label; stale items show amber age (`14mo ago`).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemRow from "./ItemRow";
import { TIER_CONFIGS } from "./tierConfig";

const baseItem = {
  id: "item-1",
  name: "Rent",
  amount: 1200,
  spendType: "monthly" as const,
  subcategoryId: "sub-housing",
  notes: null,
  lastReviewedAt: new Date("2025-01-15T00:00:00Z"),
  sortOrder: 0,
};

describe("ItemRow", () => {
  it("renders item name", () => {
    render(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("Rent")).toBeTruthy();
  });

  it("shows monthly amount directly", () => {
    render(
      <ItemRow
        item={{ ...baseItem, spendType: "monthly", amount: 350 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("£350")).toBeTruthy();
  });

  it("shows yearly amount with monthly equivalent", () => {
    render(
      <ItemRow
        item={{ ...baseItem, spendType: "yearly", amount: 840 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText(/840/)).toBeTruthy();
    expect(screen.getByText(/70\/mo/)).toBeTruthy();
  });

  it("shows stale age in amber when item is stale (>6 months for committed)", () => {
    render(
      <ItemRow
        item={{ ...baseItem, lastReviewedAt: new Date("2024-06-01T00:00:00Z") }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        stalenessMonths={6}
      />
    );
    expect(screen.getByTestId("stale-age")).toBeTruthy();
  });

  it("does not show stale indicator when item is fresh", () => {
    render(
      <ItemRow
        item={{ ...baseItem, lastReviewedAt: new Date("2025-12-01T00:00:00Z") }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        stalenessMonths={6}
      />
    );
    expect(screen.queryByTestId("stale-age")).toBeNull();
  });

  it("calls onToggle when clicked", () => {
    let called = false;
    render(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {
          called = true;
        }}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    fireEvent.click(screen.getByTestId("item-row-item-1"));
    expect(called).toBe(true);
  });
});
```

Run — expect failure.

- [ ] **Step 2: Create formatAmount.ts**

```ts
import { toGBP } from "@finplan/shared";

export type SpendType = "monthly" | "yearly" | "one_off";

export function formatItemAmount(
  amount: number,
  spendType: SpendType
): {
  primary: string;
  secondary: string | null;
  label: string | null;
} {
  if (spendType === "monthly") {
    return { primary: toGBP(amount), secondary: null, label: null };
  }
  if (spendType === "yearly") {
    const monthly = Math.round(amount / 12);
    return { primary: toGBP(amount), secondary: `${toGBP(monthly)}/mo`, label: null };
  }
  // one_off
  const monthly = Math.round(amount / 12);
  return { primary: toGBP(amount), secondary: `${toGBP(monthly)}/mo`, label: "One-off" };
}

export function getMonthsAgo(lastReviewedAt: Date, now: Date): number {
  const diffMs = now.getTime() - new Date(lastReviewedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

export function isStale(lastReviewedAt: Date, now: Date, thresholdMonths: number): boolean {
  return getMonthsAgo(lastReviewedAt, now) >= thresholdMonths;
}
```

- [ ] **Step 3: Implement ItemRow.tsx**

```tsx
import { formatItemAmount, getMonthsAgo, isStale, type SpendType } from "./formatAmount";
import type { TierConfig } from "./tierConfig";

interface WaterfallItem {
  id: string;
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

interface Props {
  item: WaterfallItem;
  config: TierConfig;
  isExpanded: boolean;
  onToggle: () => void;
  now: Date;
  stalenessMonths?: number;
  children?: React.ReactNode; // accordion content rendered when expanded
}

export default function ItemRow({
  item,
  config,
  isExpanded,
  onToggle,
  now,
  stalenessMonths = 12,
  children,
}: Props) {
  const { primary, secondary } = formatItemAmount(item.amount, item.spendType);
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);
  const monthsAgo = stale ? getMonthsAgo(item.lastReviewedAt, now) : 0;

  return (
    <div>
      <button
        data-testid={`item-row-${item.id}`}
        onClick={onToggle}
        className={[
          "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
          `hover:${config.bgClass}/5`,
          isExpanded ? `${config.bgClass}/8` : "",
        ].join(" ")}
      >
        {/* Stale dot — fixed-width column */}
        <span className="w-2 shrink-0 flex items-center justify-center">
          {stale && <span className="h-1.5 w-1.5 rounded-full bg-attention" aria-hidden />}
        </span>
        <span className="flex-1 text-foreground/80">{item.name}</span>
        {stale && (
          <span data-testid="stale-age" className="text-xs text-attention mr-2">
            {monthsAgo}mo ago
          </span>
        )}
        <span className="font-numeric text-sm text-foreground/70">
          {primary}
          {secondary && <span className="text-foreground/40"> · {secondary}</span>}
        </span>
      </button>
      {isExpanded && children}
    </div>
  );
}
```

- [ ] **Step 4: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/ItemRow.test.tsx`

- [ ] **Step 5: Commit**

```
feat(frontend): add ItemRow with spend type formatting and staleness indicator
```

---

### Task 6: ItemAccordion

**Files:**

- Create: `apps/frontend/src/components/tier/ItemAccordion.tsx`
- Create: `apps/frontend/src/components/tier/ItemAccordion.test.tsx`

The accordion shows: detail grid (last reviewed date, spend type, subcategory name), notes, and action buttons. Fresh = "Edit" only. Stale = "Edit" + "Still correct ✓".

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemAccordion from "./ItemAccordion";
import { TIER_CONFIGS } from "./tierConfig";

const freshItem = {
  id: "item-1",
  name: "Rent",
  amount: 1200,
  spendType: "monthly" as const,
  subcategoryId: "sub-housing",
  subcategoryName: "Housing",
  notes: "Fixed rate until 2027",
  lastReviewedAt: new Date("2026-01-01T00:00:00Z"),
  sortOrder: 0,
};

const staleItem = {
  ...freshItem,
  lastReviewedAt: new Date("2024-01-01T00:00:00Z"),
};

function renderAccordion(item = freshItem, onEdit = () => {}, onConfirm = () => {}) {
  return render(
    <ItemAccordion
      item={item}
      config={TIER_CONFIGS.committed}
      onEdit={onEdit}
      onConfirm={onConfirm}
      now={new Date("2026-01-15T00:00:00Z")}
      stalenessMonths={6}
    />
  );
}

describe("ItemAccordion", () => {
  it("shows last reviewed date", () => {
    renderAccordion();
    expect(screen.getByText(/jan 2026/i)).toBeTruthy();
  });

  it("shows spend type", () => {
    renderAccordion();
    expect(screen.getByText(/monthly/i)).toBeTruthy();
  });

  it("shows subcategory name", () => {
    renderAccordion();
    expect(screen.getByText("Housing")).toBeTruthy();
  });

  it("shows notes italic when present", () => {
    renderAccordion();
    expect(screen.getByText("Fixed rate until 2027")).toBeTruthy();
  });

  it("shows 'No notes' in muted when notes is null", () => {
    renderAccordion({ ...freshItem, notes: null });
    expect(screen.getByText(/no notes/i)).toBeTruthy();
  });

  it("shows only Edit button for fresh items", () => {
    renderAccordion(freshItem);
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
  });

  it("shows Edit + Still correct for stale items", () => {
    renderAccordion(staleItem);
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /still correct/i })).toBeTruthy();
  });

  it("calls onEdit when Edit is clicked", () => {
    let called = false;
    renderAccordion(freshItem, () => {
      called = true;
    });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(called).toBe(true);
  });

  it("calls onConfirm when Still correct is clicked", () => {
    let called = false;
    renderAccordion(
      staleItem,
      () => {},
      () => {
        called = true;
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /still correct/i }));
    expect(called).toBe(true);
  });
});
```

Run — expect failure.

- [ ] **Step 2: Implement ItemAccordion.tsx**

```tsx
import { isStale, type SpendType } from "./formatAmount";
import type { TierConfig } from "./tierConfig";

interface Item {
  id: string;
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  subcategoryName: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

interface Props {
  item: Item;
  config: TierConfig;
  onEdit: () => void;
  onConfirm: () => void;
  now: Date;
  stalenessMonths?: number;
}

const SPEND_TYPE_LABELS: Record<SpendType, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_off: "One-off",
};

function formatReviewDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function ItemAccordion({
  item,
  config,
  onEdit,
  onConfirm,
  now,
  stalenessMonths = 12,
}: Props) {
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.03] px-4 py-3 text-sm">
      {/* Detail grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-foreground/50">
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">
            Reviewed
          </span>
          <span className="text-foreground/60">{formatReviewDate(item.lastReviewedAt)}</span>
        </div>
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">Type</span>
          <span className="text-foreground/60">{SPEND_TYPE_LABELS[item.spendType]}</span>
        </div>
        <div>
          <span className="block text-foreground/30 uppercase tracking-wide text-[10px]">
            Category
          </span>
          <span className="text-foreground/60">{item.subcategoryName}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-2">
        {item.notes ? (
          <p className="text-xs italic text-foreground/60">{item.notes}</p>
        ) : (
          <p className="text-xs text-foreground/30">No notes</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onEdit}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-foreground/60 hover:bg-foreground/5 transition-colors"
        >
          Edit
        </button>
        {stale && (
          <button
            onClick={onConfirm}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            Still correct ✓
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/ItemAccordion.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add ItemAccordion with detail grid, notes, and action buttons
```

---

### Task 7: ItemForm

**Files:**

- Create: `apps/frontend/src/components/tier/ItemForm.tsx`
- Create: `apps/frontend/src/components/tier/ItemForm.test.tsx`

Fields: name, amount (GBP), spend type select, subcategory select, notes textarea. Two modes: add (Cancel + Save) and edit (Cancel + Still correct ✓ + Save + Delete link).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemForm from "./ItemForm";
import { TIER_CONFIGS } from "./tierConfig";

const subcategories = [
  { id: "sub-housing", name: "Housing" },
  { id: "sub-utilities", name: "Utilities" },
];

describe("ItemForm — add mode", () => {
  it("renders all fields", () => {
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByPlaceholderText(/name/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/amount/i)).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /spend type/i })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /subcategory/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/notes/i)).toBeTruthy();
  });

  it("renders Cancel and Save buttons only", () => {
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
  });

  it("calls onSave with form data on submit", () => {
    let savedData: any = null;
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={(data) => {
          savedData = data;
        }}
        onCancel={() => {}}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/name/i), { target: { value: "Rent" } });
    fireEvent.change(screen.getByPlaceholderText(/amount/i), { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(savedData).toBeTruthy();
    expect(savedData.name).toBe("Rent");
    expect(savedData.amount).toBe(1200);
  });

  it("calls onCancel when Cancel is clicked", () => {
    let cancelled = false;
    render(
      <ItemForm
        mode="add"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {
          cancelled = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(cancelled).toBe(true);
  });
});

describe("ItemForm — edit mode", () => {
  const editItem = {
    id: "item-1",
    name: "Rent",
    amount: 1200,
    spendType: "monthly" as const,
    subcategoryId: "sub-housing",
    notes: "Fixed rate",
    lastReviewedAt: new Date("2024-01-01"),
  };

  it("renders Cancel, Still correct, Save buttons and a delete link", () => {
    render(
      <ItemForm
        mode="edit"
        item={editItem}
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        initialSubcategoryId="sub-housing"
        onSave={() => {}}
        onCancel={() => {}}
        onConfirm={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /still correct/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });
});
```

Run — expect failure.

- [ ] **Step 2: Implement ItemForm.tsx**

```tsx
import { useState } from "react";
import type { TierConfig } from "./tierConfig";
import type { SpendType } from "./formatAmount";

interface SubcategoryOption {
  id: string;
  name: string;
}

interface ItemData {
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  notes: string | null;
}

interface EditItem extends ItemData {
  id: string;
  lastReviewedAt: Date;
}

type AddModeProps = {
  mode: "add";
  item?: undefined;
  onConfirm?: undefined;
  onDelete?: undefined;
};

type EditModeProps = {
  mode: "edit";
  item: EditItem;
  onConfirm: () => void;
  onDelete: () => void;
};

type Props = (AddModeProps | EditModeProps) & {
  config: TierConfig;
  subcategories: SubcategoryOption[];
  initialSubcategoryId: string;
  onSave: (data: ItemData) => void;
  onCancel: () => void;
  isSaving?: boolean;
};

export default function ItemForm({
  mode,
  item,
  config,
  subcategories,
  initialSubcategoryId,
  onSave,
  onCancel,
  onConfirm,
  onDelete,
  isSaving,
}: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [spendType, setSpendType] = useState<SpendType>(item?.spendType ?? "monthly");
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId ?? initialSubcategoryId);
  const [notes, setNotes] = useState(item?.notes ?? "");

  function handleSave() {
    onSave({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      spendType,
      subcategoryId,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="border-t border-foreground/5 bg-foreground/[0.03] px-4 py-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          className="col-span-2 rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount"
          min={0}
          step={0.01}
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        />
        <select
          value={spendType}
          onChange={(e) => setSpendType(e.target.value as SpendType)}
          aria-label="Spend type"
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="one_off">One-off</option>
        </select>
        <select
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          aria-label="Subcategory"
          className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-page-accent/40"
        >
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        aria-label="Notes"
        rows={2}
        maxLength={500}
        className="w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-sm text-foreground placeholder-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-page-accent/40"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-foreground/10 px-3 py-1 text-xs text-foreground/60 hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>
        {mode === "edit" && onConfirm && (
          <button
            onClick={onConfirm}
            className="rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            Still correct ✓
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className={[
            "ml-auto rounded-md px-3 py-1 text-xs font-medium transition-colors",
            `bg-page-accent/20 text-page-accent hover:bg-page-accent/30`,
            "disabled:cursor-not-allowed disabled:opacity-40",
          ].join(" ")}
        >
          Save
        </button>
        {mode === "edit" && onDelete && (
          <button
            onClick={onDelete}
            className="ml-2 text-xs text-foreground/30 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/ItemForm.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add ItemForm for add/edit modes with full field set
```

---

### Task 8: ItemArea — full composition with mutations

**Files:**

- Create: `apps/frontend/src/components/tier/ItemArea.tsx`
- Create: `apps/frontend/src/components/tier/ItemArea.test.tsx`

ItemArea is the right-panel component. It composes `GhostAddButton`, `ItemForm` (add mode), `ItemRow` + `ItemAccordion` + `ItemForm` (edit mode), `EmptyStateCard`, and handles all mutations via the existing waterfall service hooks.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ItemArea from "./ItemArea";
import { TIER_CONFIGS } from "./tierConfig";

mock.module("@/hooks/useWaterfall", () => ({
  useCreateItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
  useUpdateItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
  useConfirmItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
  useDeleteItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
}));

const subcategory = {
  id: "sub-housing",
  name: "Housing",
  tier: "committed" as const,
  sortOrder: 0,
  isLocked: false,
};

const items = [
  {
    id: "item-rent",
    name: "Rent",
    amount: 1200,
    spendType: "monthly" as const,
    subcategoryId: "sub-housing",
    subcategoryName: "Housing",
    notes: null,
    lastReviewedAt: new Date("2025-12-01"),
    sortOrder: 0,
  },
];

const subcategories = [{ id: "sub-housing", name: "Housing" }];

function renderArea(itemList = items) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ItemArea
        tier="committed"
        config={TIER_CONFIGS.committed}
        subcategory={subcategory}
        subcategories={subcategories}
        items={itemList}
        isLoading={false}
        now={new Date("2026-01-15")}
      />
    </QueryClientProvider>
  );
}

describe("ItemArea", () => {
  it("renders the subcategory header", () => {
    renderArea();
    expect(screen.getByText("Housing")).toBeTruthy();
  });

  it("renders item count and total", () => {
    renderArea();
    expect(screen.getByText(/1 item/i)).toBeTruthy();
  });

  it("renders item rows", () => {
    renderArea();
    expect(screen.getByText("Rent")).toBeTruthy();
  });

  it("shows empty state when no items", () => {
    renderArea([]);
    expect(screen.getByText("Add your housing costs")).toBeTruthy();
  });

  it("shows add form when GhostAddButton is clicked", async () => {
    renderArea();
    fireEvent.click(screen.getByRole("button", { name: /\+ add/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/name/i)).toBeTruthy();
    });
  });

  it("expands accordion when item row is clicked", async () => {
    renderArea();
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.getByText(/monthly/i)).toBeTruthy(); // accordion shows spend type
    });
  });

  it("collapses accordion when same row is clicked again", async () => {
    renderArea();
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => expect(screen.getByText(/monthly/i)).toBeTruthy());
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.queryByText(/monthly/i)).toBeNull();
    });
  });
});
```

Run — expect failure.

- [ ] **Step 2: Add mutation hooks to useWaterfall.ts**

In `apps/frontend/src/hooks/useWaterfall.ts`, add mutation hooks for the new item models. These follow the same pattern as existing hooks (`useConfirmItem`, `useUpdateItem`):

```ts
export function useCreateItem(tier: TierKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemInput) => waterfallService.createItem(tier, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary }),
  });
}

export function useUpdateItem(tier: TierKey, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateItemInput) => waterfallService.updateItem(tier, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary }),
  });
}

export function useConfirmWaterfallItem(tier: TierKey, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => waterfallService.confirmItem(tier, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary }),
  });
}

export function useDeleteItem(tier: TierKey, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => waterfallService.deleteItem(tier, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary }),
  });
}
```

Also add the corresponding service methods to `waterfall.service.ts`:

```ts
async createItem(tier: TierKey, data: CreateItemInput) {
  return api.post(`/api/waterfall/${tier}`, data);
},
async updateItem(tier: TierKey, id: string, data: UpdateItemInput) {
  return api.patch(`/api/waterfall/${tier}/${id}`, data);
},
async confirmItem(tier: TierKey, id: string) {
  return api.post(`/api/waterfall/${tier}/${id}/confirm`, {});
},
async deleteItem(tier: TierKey, id: string) {
  return api.delete(`/api/waterfall/${tier}/${id}`);
},
```

> These map to the backend endpoints established in Plan 1: `POST /api/waterfall/committed`, `PATCH /api/waterfall/committed/:id`, etc. The `tier` value is the URL segment (committed / discretionary / income).

- [ ] **Step 3: Implement ItemArea.tsx**

```tsx
import { useState } from "react";
import GhostAddButton from "./GhostAddButton";
import ItemRow from "./ItemRow";
import ItemAccordion from "./ItemAccordion";
import ItemForm from "./ItemForm";
import EmptyStateCard from "./EmptyStateCard";
import {
  useCreateItem,
  useUpdateItem,
  useConfirmWaterfallItem,
  useDeleteItem,
} from "@/hooks/useWaterfall";
import { toGBP } from "@finplan/shared";
import type { TierConfig, TierKey } from "./tierConfig";

interface WaterfallItem {
  id: string;
  name: string;
  amount: number;
  spendType: "monthly" | "yearly" | "one_off";
  subcategoryId: string;
  subcategoryName: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

interface SubcategoryOption {
  id: string;
  name: string;
}

interface SubcategoryInfo {
  id: string;
  name: string;
  tier: TierKey;
  sortOrder: number;
  isLocked: boolean;
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  subcategory: SubcategoryInfo | null;
  subcategories: SubcategoryOption[];
  items: WaterfallItem[];
  isLoading: boolean;
  now?: Date;
  stalenessMonths?: number;
}

export default function ItemArea({
  tier,
  config,
  subcategory,
  subcategories,
  items,
  isLoading,
  now = new Date(),
  stalenessMonths = 12,
}: Props) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const createItem = useCreateItem(tier);
  const deleteItem = useDeleteItem(tier, deletingItemId ?? "");

  const total = items.reduce((sum, item) => {
    const monthly = item.spendType === "monthly" ? item.amount : Math.round(item.amount / 12);
    return sum + monthly;
  }, 0);

  if (!subcategory) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="h-8 animate-pulse rounded bg-foreground/5 w-1/2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-foreground/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-base font-bold text-foreground">{subcategory.name}</h2>
          <span className="text-xs text-foreground/40">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <span className={`font-numeric text-sm ${config.textClass}`}>{toGBP(total)}</span>
        </div>
        {!subcategory.isLocked && (
          <GhostAddButton
            onClick={() => {
              setIsAddingItem(true);
              setExpandedItemId(null);
              setEditingItemId(null);
            }}
            disabled={isAddingItem}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Add form at top */}
        {isAddingItem && (
          <ItemForm
            mode="add"
            config={config}
            subcategories={subcategories}
            initialSubcategoryId={subcategory.id}
            isSaving={createItem.isPending}
            onSave={async (data) => {
              await createItem.mutateAsync({ ...data, householdId: "" /* resolved server-side */ });
              setIsAddingItem(false);
            }}
            onCancel={() => setIsAddingItem(false)}
          />
        )}

        {/* Empty state */}
        {items.length === 0 && !isAddingItem && (
          <EmptyStateCard
            subcategoryName={subcategory.name}
            tier={tier}
            onAddItem={() => setIsAddingItem(true)}
          />
        )}

        {/* Item list */}
        {items.map((item) => {
          const isExpanded = expandedItemId === item.id;
          const isEditing = editingItemId === item.id;

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const updateItem = useUpdateItem(tier, item.id);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const confirmItem = useConfirmWaterfallItem(tier, item.id);

          return (
            <ItemRow
              key={item.id}
              item={item}
              config={config}
              isExpanded={isExpanded}
              onToggle={() => {
                if (isEditing) return; // don't collapse while editing
                setExpandedItemId(isExpanded ? null : item.id);
                setEditingItemId(null);
              }}
              now={now}
              stalenessMonths={stalenessMonths}
            >
              {isExpanded && !isEditing && (
                <ItemAccordion
                  item={{ ...item, subcategoryName: subcategory.name }}
                  config={config}
                  onEdit={() => setEditingItemId(item.id)}
                  onConfirm={async () => {
                    await confirmItem.mutateAsync();
                    setExpandedItemId(null);
                  }}
                  now={now}
                  stalenessMonths={stalenessMonths}
                />
              )}
              {isEditing && (
                <ItemForm
                  mode="edit"
                  item={item}
                  config={config}
                  subcategories={subcategories}
                  initialSubcategoryId={item.subcategoryId}
                  isSaving={updateItem.isPending}
                  onSave={async (data) => {
                    await updateItem.mutateAsync(data);
                    setEditingItemId(null);
                    setExpandedItemId(null);
                  }}
                  onCancel={() => setEditingItemId(null)}
                  onConfirm={async () => {
                    await confirmItem.mutateAsync();
                    setEditingItemId(null);
                    setExpandedItemId(null);
                  }}
                  onDelete={() => setDeletingItemId(item.id)}
                />
              )}
            </ItemRow>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-foreground/10 bg-background p-6 max-w-sm w-full mx-4">
            <p className="text-sm text-foreground">Are you sure you want to delete this item?</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingItemId(null)}
                className="rounded-md border border-foreground/10 px-3 py-1.5 text-sm text-foreground/60"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteItem.mutateAsync();
                  setDeletingItemId(null);
                  setEditingItemId(null);
                  setExpandedItemId(null);
                }}
                className="rounded-md bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

> **Note on `useUpdateItem` / `useConfirmWaterfallItem` inside map:** React hooks must not be called inside loops. Refactor ItemArea to manage item-level mutations differently — pass the item id to a single mutation hook at the ItemArea level, or extract each item row into a child component (`ItemAreaRow`) that calls hooks at the top level. Use `ItemAreaRow` pattern:
>
> ```tsx
> // ItemAreaRow.tsx — extracted component so hooks are at top level
> function ItemAreaRow({ item, ... }) {
>   const updateItem = useUpdateItem(tier, item.id);
>   const confirmItem = useConfirmWaterfallItem(tier, item.id);
>   // render ItemRow + ItemAccordion + ItemForm
> }
> ```

- [ ] **Step 4: Extract ItemAreaRow to avoid hook-in-loop**

Create `apps/frontend/src/components/tier/ItemAreaRow.tsx` and move per-item state + mutations there. `ItemArea` renders `<ItemAreaRow>` for each item and passes down `expandedItemId`, `editingItemId`, setters, and shared state.

- [ ] **Step 5: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/ItemArea.test.tsx`

- [ ] **Step 6: Lint + type-check**

`bun run lint && bun run type-check`

- [ ] **Step 7: Commit**

```
feat(frontend): add ItemArea with full CRUD composition
```

---

### Task 9: Wire up IncomePage, CommittedPage, DiscretionaryPage

**Files:**

- Modify: `apps/frontend/src/pages/IncomePage.tsx`
- Modify: `apps/frontend/src/pages/CommittedPage.tsx`
- Modify: `apps/frontend/src/pages/DiscretionaryPage.tsx`

Replace the stub implementations with full `TierPage` usage.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/pages/CommittedPage.test.tsx`:

```tsx
import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, waitFor } from "@testing-library/react";
import CommittedPage from "./CommittedPage";

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: () => ({
    isLoading: false,
    data: [
      { id: "sub-housing", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false },
    ],
  }),
  useWaterfallSummary: () => ({
    isLoading: false,
    data: {
      committed: {
        total: 1200,
        subcategories: [{ subcategoryId: "sub-housing", name: "Housing", total: 1200, items: [] }],
      },
    },
  }),
}));

describe("CommittedPage", () => {
  it("renders the tier page for committed", async () => {
    renderWithProviders(<CommittedPage />, { initialEntries: ["/committed"] });
    await waitFor(() => {
      expect(screen.getByTestId("tier-page-committed")).toBeTruthy();
    });
  });

  it("renders the Housing subcategory", async () => {
    renderWithProviders(<CommittedPage />, { initialEntries: ["/committed"] });
    await waitFor(() => {
      expect(screen.getByText("Housing")).toBeTruthy();
    });
  });
});
```

Create similar tests for `IncomePage` and `DiscretionaryPage`.

Run — expect failure (stubs don't render `data-testid="tier-page-committed"` yet).

- [ ] **Step 2: Update page files**

Replace `apps/frontend/src/pages/IncomePage.tsx`:

```tsx
import TierPage from "@/components/tier/TierPage";

export default function IncomePage() {
  return <TierPage tier="income" />;
}
```

Replace `apps/frontend/src/pages/CommittedPage.tsx`:

```tsx
import TierPage from "@/components/tier/TierPage";

export default function CommittedPage() {
  return <TierPage tier="committed" />;
}
```

Replace `apps/frontend/src/pages/DiscretionaryPage.tsx`:

```tsx
import TierPage from "@/components/tier/TierPage";

export default function DiscretionaryPage() {
  return <TierPage tier="discretionary" />;
}
```

- [ ] **Step 3: Run the tests — expect green**

`cd apps/frontend && bun test src/pages/CommittedPage.test.tsx src/pages/IncomePage.test.tsx src/pages/DiscretionaryPage.test.tsx`

- [ ] **Step 4: Full suite**

`cd apps/frontend && bun test`

- [ ] **Step 5: Lint + type-check**

`bun run lint && bun run type-check`

- [ ] **Step 6: Commit**

```
feat(frontend): wire IncomePage, CommittedPage, DiscretionaryPage to TierPage shell
```

---

### Task 10: Stale indicator in SubcategoryList

**Files:**

- Modify: `apps/frontend/src/components/tier/SubcategoryList.tsx`
- Modify: `apps/frontend/src/components/tier/SubcategoryList.test.tsx`

The stale dot column in SubcategoryList should show an amber dot when any item in that subcategory is stale. Stale threshold comes from the household settings (`HouseholdSettings.stalenessThresholds`). In the summary response, each subcategory has an `items` array with `lastReviewedAt` timestamps — iterate to determine staleness.

- [ ] **Step 1: Write the failing test**

Add to `SubcategoryList.test.tsx`:

```tsx
it("shows amber stale dot when any item in the subcategory is stale", () => {
  const staleItem = {
    id: "item-stale",
    lastReviewedAt: new Date("2024-01-01"),
    amount: 100,
    spendType: "monthly",
  };
  const totalsWithStaleItem = {
    "sub-housing": {
      subcategoryId: "sub-housing",
      name: "Housing",
      total: 1200,
      items: [staleItem],
    },
    "sub-utilities": {
      subcategoryId: "sub-utilities",
      name: "Utilities",
      total: 300,
      items: [],
    },
  };
  render(
    <SubcategoryList
      tier="committed"
      config={TIER_CONFIGS.committed}
      subcategories={subcategories}
      subcategoryTotals={totalsWithStaleItem}
      tierTotal={1500}
      selectedId="sub-housing"
      onSelect={() => {}}
      isLoading={false}
      now={new Date("2026-01-15")}
      stalenessMonths={6}
    />
  );
  expect(screen.getByTestId("stale-dot-sub-housing")).toBeTruthy();
  expect(screen.queryByTestId("stale-dot-sub-utilities")).toBeNull();
});
```

Run — expect failure.

- [ ] **Step 2: Update SubcategoryList to show stale dot**

Add `now` and `stalenessMonths` props. In each subcategory row:

```tsx
const isSubStale = (subcategoryTotals[sub.id]?.items ?? []).some((item) =>
  isStale(item.lastReviewedAt, now, stalenessMonths)
);

// In the row, replace the placeholder span with:
<span className="w-2 shrink-0 flex items-center justify-center">
  {isSubStale && (
    <span
      data-testid={`stale-dot-${sub.id}`}
      className="h-1.5 w-1.5 rounded-full bg-attention"
      aria-hidden
    />
  )}
</span>;
```

- [ ] **Step 3: Run the test — expect green**

`cd apps/frontend && bun test src/components/tier/SubcategoryList.test.tsx`

- [ ] **Step 4: Commit**

```
feat(frontend): add stale dot to SubcategoryList based on item review dates
```

---

## Verification

After all tasks complete:

1. **Unit tests:** `cd apps/frontend && bun test` — all pass
2. **Lint:** `bun run lint` — zero warnings
3. **Type-check:** `bun run type-check` — zero errors
4. **Manual smoke test (Docker environment):**
   - `bun run start` — boot the stack
   - Navigate to `/income` — SubcategoryList on left (Salary, Dividends, Other), ItemArea on right
   - Click subcategory — items appear in right panel
   - Click "+ Add" — add form appears at top with all fields
   - Save a new item — appears in list, summary count and total update
   - Click an item row — accordion expands with detail grid, notes, Edit button
   - Click "Edit" — ItemForm replaces accordion in edit mode
   - Save changes — accordion closes, item updated
   - Click "Still correct ✓" on stale item — staleness indicator clears
   - Click "Delete" in edit form — confirmation modal → item removed
   - Navigate to a subcategory with no items — EmptyStateCard shown with correct copy
   - Navigate from Overview subcategory row to `/income?subcategory=sub-dividends` — Dividends subcategory pre-selected
   - Amber stale dots appear in SubcategoryList for subcategories with stale items
