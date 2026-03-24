---
feature: layout-refinements
spec: docs/4. planning/layout-refinements/layout-refinements-spec.md
phase:
status: pending
---

# Layout Refinements — Implementation Plan

> **For Claude:** Use `/execute-plan layout-refinements` to implement this plan task-by-task.

**Goal:** Restructure the waterfall left panel from a flat item list into a navigation summary, add wealth drill-down breadcrumbs, and expand callout gradients to the welcome page and build summary.
**Spec:** `docs/4. planning/layout-refinements/layout-refinements-spec.md`
**Architecture:** One schema migration adds `incomeType` to `IncomeSource`. The backend summary endpoint grows a `byType` array on `income`. The left panel renders type-group rows for income, two aggregate rows for committed, and a "··· N more" overflow for discretionary. Wealth right panel gets a breadcrumb row in the account list component. Two pages get gradient card wrappers.
**Tech Stack:** Fastify · Prisma · Zod · React 18 · TanStack Query · Tailwind

## Pre-conditions

- [ ] Waterfall feature implemented (IncomeSource, CommittedBill, YearlyBill models exist)
- [ ] WaterfallLeftPanel, OverviewPage, WealthPage, WelcomePage, BuildGuidePanel all exist
- [ ] `bun run start` brings up Docker dev environment (postgres reachable for migration)

---

## Tasks

### Task 1: Schema — add `incomeType` to IncomeSource

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Edit schema**

  Add after the `IncomeFrequency` enum:

  ```prisma
  enum IncomeType {
    salary
    dividends
    freelance
    rental
    benefits
    other
  }
  ```

  Add field to `IncomeSource` model after `frequency`:

  ```prisma
  incomeType  IncomeType  @default(other)
  ```

- [ ] **Step 2: Run migration**

  ```bash
  bun run db:migrate
  ```

  When prompted for a migration name, enter: `add_income_type`

  Expected: migration created and applied, `incomeType` column exists with default `other`

- [ ] **Step 3: Commit**

  ```bash
  git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
  git commit -m "feat(schema): add incomeType enum and field to IncomeSource"
  ```

---

### Task 2: Shared schemas — add IncomeType + byType to WaterfallSummary

**Files:**

- Modify: `packages/shared/src/schemas/waterfall.schemas.ts`

- [ ] **Step 1: Write failing test**

  ```typescript
  // packages/shared/src/schemas/waterfall.schemas.test.ts
  import { describe, it, expect } from "bun:test";
  import {
    createIncomeSourceSchema,
    updateIncomeSourceSchema,
    IncomeTypeEnum,
  } from "./waterfall.schemas";

  describe("IncomeTypeEnum", () => {
    it("accepts all canonical types", () => {
      const types = ["salary", "dividends", "freelance", "rental", "benefits", "other"];
      types.forEach((t) => {
        expect(IncomeTypeEnum.parse(t)).toBe(t);
      });
    });

    it("rejects unknown type", () => {
      expect(() => IncomeTypeEnum.parse("bonus")).toThrow();
    });
  });

  describe("createIncomeSourceSchema", () => {
    it("accepts incomeType field", () => {
      const result = createIncomeSourceSchema.parse({
        name: "Salary",
        amount: 5000,
        frequency: "monthly",
        incomeType: "salary",
      });
      expect(result.incomeType).toBe("salary");
    });

    it("defaults incomeType to other when omitted", () => {
      const result = createIncomeSourceSchema.parse({
        name: "Misc",
        amount: 100,
        frequency: "monthly",
      });
      expect(result.incomeType).toBe("other");
    });
  });

  describe("updateIncomeSourceSchema", () => {
    it("accepts optional incomeType", () => {
      const result = updateIncomeSourceSchema.parse({ incomeType: "dividends" });
      expect(result.incomeType).toBe("dividends");
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts waterfall.schemas
  ```

  Expected: FAIL — `IncomeTypeEnum` not exported

- [ ] **Step 3: Write implementation**

  ```typescript
  // In packages/shared/src/schemas/waterfall.schemas.ts

  // Add after IncomeFrequencyEnum:
  export const IncomeTypeEnum = z.enum([
    "salary",
    "dividends",
    "freelance",
    "rental",
    "benefits",
    "other",
  ]);
  export type IncomeType = z.infer<typeof IncomeTypeEnum>;

  // Add to createIncomeSourceSchema:
  incomeType: IncomeTypeEnum.default("other"),

  // Add to updateIncomeSourceSchema:
  incomeType: IncomeTypeEnum.optional(),

  // Add to IncomeSourceRow interface:
  incomeType: IncomeType;

  // Add new interface before WaterfallSummary:
  export interface IncomeByType {
    type: IncomeType;
    label: string;
    monthlyTotal: number;
    sources: IncomeSourceRow[];
  }

  // Update WaterfallSummary income shape (full interface, no stubs):
  export interface WaterfallSummary {
    income: {
      total: number;
      byType: IncomeByType[];
      monthly: IncomeSourceRow[];
      annual: (IncomeSourceRow & { monthlyAmount: number })[];
      oneOff: IncomeSourceRow[];
    };
    committed: {
      monthlyTotal: number;
      monthlyAvg12: number;
      bills: CommittedBillRow[];
      yearlyBills: YearlyBillRow[];
    };
    discretionary: {
      total: number;
      categories: DiscretionaryCategoryRow[];
      savings: {
        total: number;
        allocations: SavingsAllocationRow[];
      };
    };
    surplus: {
      amount: number;
      percentOfIncome: number;
    };
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts waterfall.schemas
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add packages/shared/src/schemas/waterfall.schemas.ts packages/shared/src/schemas/waterfall.schemas.test.ts
  git commit -m "feat(shared): add IncomeType enum, byType to WaterfallSummary"
  ```

---

### Task 3: Backend service — compute byType in getWaterfallSummary

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Test: `apps/backend/src/services/waterfall.service.test.ts`

- [ ] **Step 1: Write failing test**

  Add to the existing `waterfall.service.test.ts`:

  ```typescript
  describe("getWaterfallSummary — income.byType", () => {
    it("groups active sources by incomeType with correct monthly totals", async () => {
      prismaMock.incomeSource.findMany.mockResolvedValue([
        {
          id: "s1",
          name: "Day job",
          amount: 5000,
          frequency: "monthly",
          incomeType: "salary",
          lastReviewedAt: new Date(),
          endedAt: null,
          sortOrder: 0,
          householdId: "h1",
          ownerId: null,
          expectedMonth: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "s2",
          name: "Dividend",
          amount: 12000,
          frequency: "annual",
          incomeType: "dividends",
          lastReviewedAt: new Date(),
          endedAt: null,
          sortOrder: 1,
          householdId: "h1",
          ownerId: null,
          expectedMonth: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "s3",
          name: "Old job",
          amount: 3000,
          frequency: "monthly",
          incomeType: "salary",
          lastReviewedAt: new Date(),
          endedAt: new Date("2020-01-01"), // ended — must be excluded
          sortOrder: 2,
          householdId: "h1",
          ownerId: null,
          expectedMonth: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "s4",
          name: "Bonus",
          amount: 2000,
          frequency: "one_off",
          incomeType: "other",
          lastReviewedAt: new Date(),
          endedAt: null,
          sortOrder: 3,
          householdId: "h1",
          ownerId: null,
          expectedMonth: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      // ... mock other findMany calls returning empty arrays

      const summary = await waterfallService.getWaterfallSummary("h1");

      // salary group: only s1 (s3 ended, excluded)
      const salaryGroup = summary.income.byType.find((g) => g.type === "salary");
      expect(salaryGroup).toBeDefined();
      expect(salaryGroup!.monthlyTotal).toBe(5000);
      expect(salaryGroup!.sources).toHaveLength(1);
      expect(salaryGroup!.sources[0]!.id).toBe("s1");

      // dividends group: s2 annual ÷ 12
      const divGroup = summary.income.byType.find((g) => g.type === "dividends");
      expect(divGroup).toBeDefined();
      expect(divGroup!.monthlyTotal).toBe(1000);

      // one_off sources excluded from byType
      const otherGroup = summary.income.byType.find((g) => g.type === "other");
      expect(otherGroup).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts waterfall.service
  ```

  Expected: FAIL — `byType` not present on `summary.income`

- [ ] **Step 3: Write implementation**

  In `getWaterfallSummary`, after building `monthly`, `annual`, `oneOff` arrays, add:

  ```typescript
  const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
    salary: "Salary",
    dividends: "Dividends",
    freelance: "Freelance",
    rental: "Rental",
    benefits: "Benefits",
    other: "Other",
  };

  // Group active non-oneOff sources by incomeType
  const activeNonOneOff = [...monthly, ...annual];
  const typeMap = new Map<IncomeType, IncomeSourceRow[]>();
  for (const src of activeNonOneOff) {
    const existing = typeMap.get(src.incomeType) ?? [];
    existing.push(src);
    typeMap.set(src.incomeType, existing);
  }

  const byType: IncomeByType[] = Array.from(typeMap.entries()).map(([type, sources]) => ({
    type,
    label: INCOME_TYPE_LABELS[type],
    monthlyTotal: sources.reduce((sum, src) => {
      if (src.frequency === "annual") {
        return sum + (src as { monthlyAmount: number }).monthlyAmount / 12;
      }
      return sum + src.amount;
    }, 0),
    sources,
  }));
  ```

  Note: `src.incomeType` is non-nullable after migration — no `?? "other"` guard needed.

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts waterfall.service
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/backend/src/services/waterfall.service.ts apps/backend/src/services/waterfall.service.test.ts
  git commit -m "feat(backend): compute income.byType in getWaterfallSummary"
  ```

---

### Task 4: Backend — PATCH /income/:id accepts incomeType

**Files:**

- Modify: `apps/backend/src/routes/waterfall/income.routes.ts`
- Test: `apps/backend/src/routes/waterfall/income.routes.test.ts`

- [ ] **Step 1: Write failing test**

  ```typescript
  describe("PATCH /api/waterfall/income/:id", () => {
    it("updates incomeType and persists it", async () => {
      // Arrange: mock prisma findFirst to return existing source
      // mock prisma update to return updated record with incomeType: "salary"
      prismaMock.incomeSource.findFirst.mockResolvedValue({
        id: "src1",
        householdId: "h1",
        incomeType: "other",
        // ... other required fields
      });
      prismaMock.incomeSource.update.mockResolvedValue({
        id: "src1",
        householdId: "h1",
        incomeType: "salary",
        // ... other required fields
      });

      const res = await app.inject({
        method: "PATCH",
        url: "/api/waterfall/income/src1",
        headers: { authorization: `Bearer ${token}` },
        payload: { incomeType: "salary" },
      });

      expect(res.statusCode).toBe(200);
      expect(prismaMock.incomeSource.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ incomeType: "salary" }),
        })
      );
    });

    it("rejects invalid incomeType", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/waterfall/income/src1",
        headers: { authorization: `Bearer ${token}` },
        payload: { incomeType: "bonus" },
      });
      expect(res.statusCode).toBe(400);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts income.routes
  ```

  Expected: FAIL — `incomeType` not accepted in update handler

- [ ] **Step 3: Write implementation**

  In the PATCH handler, the `updateIncomeSourceSchema` now includes `incomeType?: IncomeTypeEnum` — ensure the Prisma update call passes `data: { ...validatedBody }` which will include `incomeType` when present.

  No structural change needed if the handler already spreads the validated body into Prisma `data`. Verify this is the case and add if missing.

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/backend && bun scripts/run-tests.ts income.routes
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/backend/src/routes/waterfall/income.routes.ts apps/backend/src/routes/waterfall/income.routes.test.ts
  git commit -m "feat(backend): PATCH income accepts incomeType field"
  ```

---

### Task 5: WaterfallLeftPanel — income type group rows

**Files:**

- Modify: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`

- [ ] **Step 1: Write failing test**

  ```typescript
  // apps/frontend/src/components/overview/WaterfallLeftPanel.test.tsx
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { WaterfallLeftPanel } from "./WaterfallLeftPanel";
  import { mockSummaryWithTypes } from "./__fixtures__/waterfallSummary";

  describe("WaterfallLeftPanel — income", () => {
    it("shows one row per active income type, not individual items", () => {
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWithTypes}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      // Should show type labels
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.getByText("Dividends")).toBeInTheDocument();
      // Should NOT show individual source names
      expect(screen.queryByText("Day job")).not.toBeInTheDocument();
    });

    it("calls onSelectItem with type sentinel id when type row clicked", async () => {
      const onSelectItem = vi.fn();
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWithTypes}
          onSelectItem={onSelectItem}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      await userEvent.click(screen.getByText("Salary"));
      expect(onSelectItem).toHaveBeenCalledWith(
        expect.objectContaining({ type: "income_type", id: "type:salary" })
      );
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: FAIL — income section still renders individual items

- [ ] **Step 3: Write implementation**

  Replace the income section rows in `WaterfallLeftPanel.tsx`. The stale count must still cover all active sources (monthly + annual + oneOff), but the rows now show `byType` groups:

  ```tsx
  // Stale count: all active sources including oneOff
  const allActiveSources = [...income.monthly, ...income.annual, ...income.oneOff];
  const incomeStaleCount = allActiveSources.filter((s) =>
    isStale(s.lastReviewedAt, thresholds.income_source ?? 12)
  ).length;

  // In the income section JSX, replace individual rows with:
  {
    income.byType.map((group) => (
      <div
        key={group.type}
        className={cn(
          ROW_CLASS,
          selectedItemId === `type:${group.type}` && "bg-accent",
          inBuild && "cursor-default hover:bg-transparent"
        )}
        onClick={() =>
          !inBuild &&
          onSelectItem({
            id: `type:${group.type}`,
            type: "income_type",
            name: group.label,
            amount: group.monthlyTotal,
            lastReviewedAt: new Date(),
          })
        }
      >
        <span>{group.label}</span>
        <span className={AMOUNT_CLASS}>{formatCurrency(group.monthlyTotal)}</span>
      </div>
    ));
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/frontend/src/components/overview/WaterfallLeftPanel.tsx
  git commit -m "feat(frontend): income left panel shows type group rows"
  ```

---

### Task 6: WaterfallLeftPanel — committed 2 aggregate rows

**Files:**

- Modify: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`

- [ ] **Step 1: Write failing test**

  ```typescript
  describe("WaterfallLeftPanel — committed", () => {
    it("shows exactly two aggregate rows: Monthly bills and Yearly ÷12", () => {
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWithBills}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      expect(screen.getByText("Monthly bills")).toBeInTheDocument();
      expect(screen.getByText("Yearly ÷12")).toBeInTheDocument();
      // Individual bill names must NOT appear
      expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    });

    it("clicking Monthly bills calls onSelectItem with committed-bills sentinel", async () => {
      const onSelectItem = vi.fn();
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWithBills}
          onSelectItem={onSelectItem}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      await userEvent.click(screen.getByText("Monthly bills"));
      expect(onSelectItem).toHaveBeenCalledWith(
        expect.objectContaining({ type: "committed_bills", id: "aggregate:committed_bills" })
      );
    });

    it("clicking Yearly ÷12 calls onOpenCashflowCalendar", async () => {
      const onOpenCashflowCalendar = vi.fn();
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWithBills}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={onOpenCashflowCalendar}
          selectedItemId={null}
        />
      );
      await userEvent.click(screen.getByText("Yearly ÷12"));
      expect(onOpenCashflowCalendar).toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: FAIL — committed section still renders individual bills

- [ ] **Step 3: Write implementation**

  Replace the committed section rows. Remove the individual `committed.bills.map(...)` and `committed.yearlyBills.map(...)` loops. **In build mode, the individual yearly bill rows that were shown inline must also be removed** — the aggregate row is shown instead:

  ```tsx
  {
    /* Replace entire committed rows section with: */
  }
  {
    committedState !== "future" && (
      <div className="space-y-0.5">
        <div
          className={cn(
            ROW_CLASS,
            selectedItemId === "aggregate:committed_bills" && "bg-accent",
            inBuild && "cursor-default hover:bg-transparent"
          )}
          onClick={() =>
            !inBuild &&
            onSelectItem({
              id: "aggregate:committed_bills",
              type: "committed_bills",
              name: "Monthly bills",
              amount: committed.monthlyTotal,
              lastReviewedAt: new Date(),
            })
          }
        >
          <span>Monthly bills</span>
          <span className={AMOUNT_CLASS}>{formatCurrency(committed.monthlyTotal)}</span>
        </div>
        <div
          className={cn(ROW_CLASS, inBuild && "cursor-default hover:bg-transparent")}
          onClick={() => !inBuild && onOpenCashflowCalendar()}
        >
          <span>Yearly ÷12</span>
          <span className={AMOUNT_CLASS}>{formatCurrency(committed.monthlyAvg12)}</span>
        </div>
        {committedState === "active" && <TierAddForm phase="committed" prefillName={prefillName} />}
      </div>
    );
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/frontend/src/components/overview/WaterfallLeftPanel.tsx
  git commit -m "feat(frontend): committed left panel shows 2 aggregate rows"
  ```

---

### Task 7: WaterfallLeftPanel — discretionary "··· N more" overflow

**Files:**

- Modify: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`

- [ ] **Step 1: Write failing test**

  ```typescript
  describe("WaterfallLeftPanel — discretionary overflow", () => {
    it("shows first 5 categories and '··· N more' when count > 5", () => {
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWith7Categories}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      // First 5 visible
      expect(screen.getByText("Cat 1")).toBeInTheDocument();
      expect(screen.getByText("Cat 5")).toBeInTheDocument();
      // 6th and 7th hidden
      expect(screen.queryByText("Cat 6")).not.toBeInTheDocument();
      // Overflow toggle visible
      expect(screen.getByText("··· 2 more")).toBeInTheDocument();
    });

    it("shows all categories after clicking overflow toggle", async () => {
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWith7Categories}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      await userEvent.click(screen.getByText("··· 2 more"));
      expect(screen.getByText("Cat 6")).toBeInTheDocument();
      expect(screen.getByText("Cat 7")).toBeInTheDocument();
    });

    it("shows all categories without overflow when count <= 5", () => {
      render(
        <WaterfallLeftPanel
          summary={mockSummaryWith3Categories}
          onSelectItem={vi.fn()}
          onOpenCashflowCalendar={vi.fn()}
          selectedItemId={null}
        />
      );
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: FAIL — no overflow toggle exists

- [ ] **Step 3: Write implementation**

  Add `const [showAllCategories, setShowAllCategories] = useState(false)` to `WaterfallLeftPanel`.

  Replace the discretionary categories loop:

  ```tsx
  const CATEGORY_LIMIT = 5;
  const visibleCategories =
    showAllCategories || discretionary.categories.length <= CATEGORY_LIMIT
      ? discretionary.categories
      : discretionary.categories.slice(0, CATEGORY_LIMIT);
  const hiddenCount = discretionary.categories.length - CATEGORY_LIMIT;

  {visibleCategories.map((cat) => (
    // ... existing row JSX unchanged
  ))}
  {!showAllCategories && hiddenCount > 0 && (
    <button
      type="button"
      onClick={() => setShowAllCategories(true)}
      className={cn(ROW_CLASS, "text-muted-foreground hover:text-foreground")}
    >
      ··· {hiddenCount} more
    </button>
  )}
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test WaterfallLeftPanel
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/frontend/src/components/overview/WaterfallLeftPanel.tsx
  git commit -m "feat(frontend): discretionary overflow toggle for >5 categories"
  ```

---

### Task 8: OverviewPage — wire income-type and committed-bills right panel views

**Files:**

- Modify: `apps/frontend/src/pages/OverviewPage.tsx`

- [ ] **Step 1: Write failing test**

  ```typescript
  describe("OverviewPage — right panel routing", () => {
    it("renders income sources for selected income type", async () => {
      // Mock useWaterfall to return summary with byType
      // Select an income type row
      render(<OverviewPage />);
      await userEvent.click(screen.getByText("Salary"));
      // Right panel shows sources of that type
      expect(screen.getByText("Day job")).toBeInTheDocument();
    });

    it("renders empty state when income type has no sources", async () => {
      render(<OverviewPage />);
      // Force selection of a type group that exists but has empty sources
      // (simulate via direct state manipulation or mock)
      // Expect graceful empty message
      expect(screen.getByText(/no .* sources/i)).toBeInTheDocument();
    });

    it("renders committed bill list for Monthly bills row", async () => {
      render(<OverviewPage />);
      await userEvent.click(screen.getByText("Monthly bills"));
      expect(screen.getByText("Committed Bills")).toBeInTheDocument();
    });

    it("renders empty state when no committed bills exist", async () => {
      // Mock summary with empty bills array
      render(<OverviewPage />);
      await userEvent.click(screen.getByText("Monthly bills"));
      expect(screen.getByText(/no bills/i)).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test OverviewPage
  ```

  Expected: FAIL — `onSelectItem` doesn't handle `income_type` or `committed_bills` types

- [ ] **Step 3: Write implementation**

  In `OverviewPage.tsx`, update the `onSelectItem` handler and right panel switch to handle the new sentinel types:

  ```tsx
  // In the right panel render switch:
  case "income_type": {
    // Extract the type from id "type:salary" → "salary"
    const incomeType = selectedItem.id.replace("type:", "") as IncomeType;
    const group = summary.income.byType.find((g) => g.type === incomeType);
    if (!group || group.sources.length === 0) {
      rightContent = (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No {selectedItem.name.toLowerCase()} sources</p>
        </div>
      );
    } else {
      rightContent = <IncomeTypeDetailPanel group={group} />;
    }
    break;
  }
  case "committed_bills": {
    if (summary.committed.bills.length === 0) {
      rightContent = (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No monthly bills added yet</p>
        </div>
      );
    } else {
      rightContent = <CommittedBillsPanel bills={summary.committed.bills} />;
    }
    break;
  }
  ```

  Create minimal `IncomeTypeDetailPanel` and `CommittedBillsPanel` inline or as small sibling components — they render a list of the sources/bills already available in the summary.

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test OverviewPage
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/frontend/src/pages/OverviewPage.tsx
  git commit -m "feat(frontend): income-type and committed-bills right panel views"
  ```

---

### Task 9: Wealth — AccountListPanel breadcrumb + left panel highlight during detail

**Files:**

- Modify: `apps/frontend/src/components/wealth/AccountListPanel.tsx`
- Modify: `apps/frontend/src/pages/WealthPage.tsx`

- [ ] **Step 1: Write failing test**

  ```typescript
  // apps/frontend/src/components/wealth/AccountListPanel.test.tsx
  import { render, screen } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { AccountListPanel } from "./AccountListPanel";

  const mockAccounts = [
    {
      id: "a1",
      name: "Vanguard ISA",
      institution: "Vanguard",
      balance: 25000,
      accountType: "isa",
      assetClass: "equities",
      lastReviewedAt: new Date().toISOString(),
    },
  ];

  describe("AccountListPanel", () => {
    it("renders breadcrumb with ← All classes / ClassName", () => {
      render(
        <AccountListPanel
          assetClass="equities"
          accounts={mockAccounts}
          onSelectAccount={vi.fn()}
          onBack={vi.fn()}
        />
      );
      expect(screen.getByText("← All classes")).toBeInTheDocument();
      expect(screen.getByText("Equities")).toBeInTheDocument();
    });

    it("calls onBack when ← All classes is clicked", async () => {
      const onBack = vi.fn();
      render(
        <AccountListPanel
          assetClass="equities"
          accounts={mockAccounts}
          onSelectAccount={vi.fn()}
          onBack={onBack}
        />
      );
      await userEvent.click(screen.getByText("← All classes"));
      expect(onBack).toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test AccountListPanel
  ```

  Expected: FAIL — `onBack` prop not accepted, no breadcrumb rendered

- [ ] **Step 3: Write implementation**

  **AccountListPanel.tsx** — add `onBack` prop and breadcrumb:

  ```tsx
  // Export CLASS_LABELS so AccountDetailPanel can import it (remove local duplicate)
  export const CLASS_LABELS: Record<string, string> = {
    equities: "Equities",
    bonds: "Bonds",
    property: "Property",
    cash: "Cash",
    alternatives: "Alternatives",
    crypto: "Crypto",
    other: "Other",
  };

  interface AccountListPanelProps {
    assetClass: string;
    accounts: WealthAccount[];
    onSelectAccount: (account: WealthAccount) => void;
    onBack: () => void;
  }

  export function AccountListPanel({
    assetClass,
    accounts,
    onSelectAccount,
    onBack,
  }: AccountListPanelProps) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← All classes
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">
            {CLASS_LABELS[assetClass] ?? assetClass}
          </span>
        </div>
        {/* ... existing account list content ... */}
      </div>
    );
  }
  ```

  **AccountDetailPanel.tsx** — import `CLASS_LABELS` from `AccountListPanel` instead of local copy.

  **WealthPage.tsx** — pass `onBack` to `AccountListPanel`. Keep asset class row highlighted when `view.type === "detail"`:

  ```tsx
  // In left panel asset class row className:
  cn(
    ROW_CLASS,
    (view.type === "list" && view.assetClass === cls) ||
      (view.type === "detail" && view.assetClass === cls && "bg-accent")
  );

  // Simplified:
  const isSelectedClass = (cls: string) =>
    (view.type === "list" || view.type === "detail") && view.assetClass === cls;
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test AccountListPanel
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add apps/frontend/src/components/wealth/AccountListPanel.tsx apps/frontend/src/components/wealth/AccountDetailPanel.tsx apps/frontend/src/pages/WealthPage.tsx
  git commit -m "feat(frontend): AccountListPanel breadcrumb + asset class highlight during detail"
  ```

---

### Task 10: Callout gradients — welcome hero and build summary

**Files:**

- Modify: `apps/frontend/src/pages/WelcomePage.tsx`
- Modify: `apps/frontend/src/components/overview/build/BuildGuidePanel.tsx`
- Modify: `docs/2. design/design-system.md`

- [ ] **Step 1: Write failing test**

  ```typescript
  describe("WelcomePage — gradient card", () => {
    it("welcome phase renders hero in indigo-purple gradient card", () => {
      render(<WelcomePage />);
      const card = screen.getByTestId("welcome-hero-card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("BuildGuidePanel — gradient card", () => {
    it("summary phase renders completion in purple-teal gradient card", () => {
      render(<BuildGuidePanel phase="summary" onComplete={vi.fn()} />);
      const card = screen.getByTestId("build-summary-card");
      expect(card).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/frontend && bun run test WelcomePage BuildGuidePanel
  ```

  Expected: FAIL — `data-testid` not present

- [ ] **Step 3: Write implementation**

  **WelcomePage.tsx** — wrap welcome phase content in gradient card:

  ```tsx
  {
    phase === "welcome" && (
      <div
        data-testid="welcome-hero-card"
        className="rounded-xl p-6 space-y-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)",
          border: "1px solid rgba(99,102,241,0.1)",
        }}
      >
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to finplan</h1>
          <p className="text-muted-foreground leading-relaxed">
            finplan helps you see exactly where your money goes each month using a simple waterfall:
            income flows down through committed bills, discretionary spending, and savings —
            revealing your true surplus.
          </p>
        </div>
        <Button size="lg" onClick={() => setPhase("name")}>
          Get started
        </Button>
      </div>
    );
  }
  ```

  **BuildGuidePanel.tsx** — wrap SummaryPhase "Your waterfall is ready" heading and actions:

  ```tsx
  <div
    data-testid="build-summary-card"
    className="rounded-xl p-6 space-y-4"
    style={{
      background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(74,220,208,0.04) 100%)",
      border: "1px solid rgba(168,85,247,0.08)",
    }}
  >
    <h2 className="text-xl font-bold tracking-tight">Your waterfall is ready</h2>
    {/* ... existing actions ... */}
  </div>
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd apps/frontend && bun run test WelcomePage BuildGuidePanel
  ```

  Expected: PASS

- [ ] **Step 5: Cross-check gradient consistency**

  Visually confirm the three gradient locations use consistent radius, padding, and structure:
  - Empty state CTA cards (existing)
  - Welcome hero card (new)
  - Build summary card (new)

  All should use `rounded-xl p-6` and a 1px border.

- [ ] **Step 6: Update design-system.md**

  In `docs/2. design/design-system.md`, update the callout gradient section to document all three canonical locations:

  ```markdown
  ### Callout Gradients

  Used for engagement and hero emphasis — never for warnings or status.

  | Gradient        | CSS                                                                             | Usage                          |
  | --------------- | ------------------------------------------------------------------------------- | ------------------------------ |
  | Indigo → Purple | `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)` | Empty state CTAs, Welcome hero |
  | Purple → Teal   | `linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(74,220,208,0.04) 100%)` | Build completion card          |

  All callout gradient cards use: `rounded-xl`, `p-6`, `1px` border at 10% opacity of the start colour.
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/frontend/src/pages/WelcomePage.tsx apps/frontend/src/components/overview/build/BuildGuidePanel.tsx "docs/2. design/design-system.md"
  git commit -m "feat(frontend): callout gradient cards on welcome hero and build summary"
  ```

---

## Testing

Run the full test suite after all tasks:

```bash
cd apps/backend && bun scripts/run-tests.ts
cd apps/frontend && bun run test
bun run type-check
bun run lint
```

---

## Verification

- [ ] Income left panel shows type groups (Salary, Dividends, etc.) — no individual source names
- [ ] Clicking a type group loads that type's sources in the right panel
- [ ] Committed left panel shows exactly "Monthly bills" and "Yearly ÷12"
- [ ] Clicking "Monthly bills" loads the bill list in the right panel
- [ ] Clicking "Yearly ÷12" opens the cashflow calendar
- [ ] Discretionary with >5 categories shows "··· N more" toggle
- [ ] Wealth account list panel has "← All classes / [Class Name]" breadcrumb
- [ ] Asset class row stays highlighted when viewing account detail
- [ ] Welcome page hero wrapped in indigo→purple gradient card
- [ ] Build summary "Your waterfall is ready" wrapped in purple→teal gradient card
- [ ] `bun run type-check` — zero errors
- [ ] `bun run lint` — zero warnings

---

## Post-conditions

- [ ] Spec status updated to `implemented` in `docs/4. planning/layout-refinements/layout-refinements-spec.md`
- [ ] Entry added to `docs/5. built/implemented.md`
- [ ] `docs/2. design/design-system.md` callout gradient section reflects all three canonical locations
