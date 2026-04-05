---
feature: waterfall-visualisation
category: overview
spec: docs/4. planning/waterfall-visualisation/waterfall-visualisation-spec.md
creation_date: 2026-04-05
status: backlog
implemented_date:
---

# Waterfall Visualisation — Implementation Plan

> **For Claude:** Use `/execute-plan waterfall-visualisation` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Add Sankey flow diagram and drill-down doughnut charts to the Overview right panel, making the waterfall cascade visually immediate.
**Spec:** `docs/4. planning/waterfall-visualisation/waterfall-visualisation-spec.md`
**Architecture:** Frontend-only feature. The existing `WaterfallSummary` (fetched by `useWaterfallSummary`) already provides tier totals, `bySubcategory` arrays, and flat item arrays with `subcategoryId` — no backend changes needed. Three new components (`WaterfallSankey`, `TierDoughnut`, `DoughnutLegend`) are built using SVG + d3 path utilities (already a dependency). `FinancialSummaryPanel` is restructured into a split layout: visualisation column (Sankey + two doughnuts) on the left, sparkline cards on the right, with a compact NetWorthCard centred above.
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind
**Infrastructure Impact:**

- Touches `packages/shared/`: no
- Requires DB migration: no

## Pre-conditions

- [x] `WaterfallSummary` type and `/api/waterfall` endpoint exist with `bySubcategory` arrays and flat item arrays
- [x] `FinancialSummaryPanel`, `NetWorthCard`, `TierSummaryCard` components exist
- [x] `d3` (v7) and `framer-motion` are frontend dependencies
- [x] `useWaterfallSummary` and `useFinancialSummary` hooks exist

## Tasks

---

### Task 1: Colour Scale Utility

**Files:**

- Create: `apps/frontend/src/utils/tierColours.ts`
- Test: `apps/frontend/src/utils/tierColours.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/utils/tierColours.test.ts
import { describe, it, expect } from "bun:test";
import { generateTierColours } from "./tierColours";

describe("generateTierColours", () => {
  it("returns colours for committed tier using indigo scale", () => {
    const colours = generateTierColours("committed", 3);
    expect(colours).toHaveLength(3);
    // Brightest first (largest value gets brightest)
    expect(colours[0]).toBe("#818cf8"); // indigo-400
  });

  it("returns colours for discretionary tier using purple scale", () => {
    const colours = generateTierColours("discretionary", 3);
    expect(colours).toHaveLength(3);
    expect(colours[0]).toBe("#c084fc"); // purple-400
  });

  it("caps at 7 colours", () => {
    const colours = generateTierColours("committed", 10);
    expect(colours).toHaveLength(7);
  });

  it("returns 1 colour for a single segment", () => {
    const colours = generateTierColours("committed", 1);
    expect(colours).toHaveLength(1);
    expect(colours[0]).toBe("#818cf8");
  });

  it("returns empty array for 0 segments", () => {
    const colours = generateTierColours("committed", 0);
    expect(colours).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/utils/tierColours.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/utils/tierColours.ts

// Tailwind colour scales — brightest to darkest
const INDIGO_SCALE = [
  "#818cf8", // indigo-400
  "#6366f1", // indigo-500
  "#4f46e5", // indigo-600
  "#4338ca", // indigo-700
  "#3730a3", // indigo-800
  "#312e81", // indigo-900
  "#1e1b4b", // indigo-950
] as const;

const PURPLE_SCALE = [
  "#c084fc", // purple-400
  "#a855f7", // purple-500
  "#9333ea", // purple-600
  "#7e22ce", // purple-700
  "#6b21a8", // purple-800
  "#581c87", // purple-900
  "#3b0764", // purple-950
] as const;

const TIER_SCALES: Record<string, readonly string[]> = {
  committed: INDIGO_SCALE,
  discretionary: PURPLE_SCALE,
};

/**
 * Generate an array of colours for a tier's subcategory segments.
 * Index 0 = brightest (assigned to the largest-value subcategory).
 * Capped at 7.
 */
export function generateTierColours(tier: "committed" | "discretionary", count: number): string[] {
  const scale = TIER_SCALES[tier];
  const n = Math.min(Math.max(count, 0), 7);
  if (n === 0) return [];

  if (n === 1) return [scale[0]];

  // Evenly space across the scale
  return Array.from({ length: n }, (_, i) => {
    const idx = Math.round((i / (n - 1)) * (scale.length - 1));
    return scale[idx];
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/utils/tierColours.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/utils/tierColours.ts apps/frontend/src/utils/tierColours.test.ts
git commit -m "feat(overview): add tier colour scale utility for doughnut charts"
```

---

### Task 2: DoughnutLegend Component

**Files:**

- Create: `apps/frontend/src/components/overview/DoughnutLegend.tsx`
- Test: `apps/frontend/src/components/overview/DoughnutLegend.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/DoughnutLegend.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DoughnutLegend } from "./DoughnutLegend";

describe("DoughnutLegend", () => {
  it("renders entries with colour dots and labels", () => {
    const entries = [
      { colour: "#818cf8", label: "Mortgage" },
      { colour: "#6366f1", label: "Insurance" },
    ];
    render(<DoughnutLegend entries={entries} />);

    expect(screen.getByText("Mortgage")).toBeTruthy();
    expect(screen.getByText("Insurance")).toBeTruthy();
  });

  it("aggregates overflow entries as 'N others'", () => {
    const entries = Array.from({ length: 9 }, (_, i) => ({
      colour: `#${i}${i}${i}`,
      label: `Item ${i + 1}`,
    }));
    render(<DoughnutLegend entries={entries} />);

    // First 6 visible, 7th is "3 others"
    expect(screen.getByText("Item 1")).toBeTruthy();
    expect(screen.getByText("Item 6")).toBeTruthy();
    expect(screen.queryByText("Item 7")).toBeNull();
    expect(screen.getByText("3 others")).toBeTruthy();
  });

  it("renders all entries when exactly 7", () => {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      colour: `#${i}${i}${i}`,
      label: `Item ${i + 1}`,
    }));
    render(<DoughnutLegend entries={entries} />);

    expect(screen.getByText("Item 7")).toBeTruthy();
    expect(screen.queryByText("others")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/DoughnutLegend.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/overview/DoughnutLegend.tsx

interface LegendEntry {
  colour: string;
  label: string;
}

interface DoughnutLegendProps {
  entries: LegendEntry[];
}

const MAX_ENTRIES = 7;

export function DoughnutLegend({ entries }: DoughnutLegendProps) {
  const needsOverflow = entries.length > MAX_ENTRIES;
  const visible = needsOverflow ? entries.slice(0, MAX_ENTRIES - 1) : entries;
  const overflowCount = entries.length - visible.length;

  return (
    <ul className="flex flex-col gap-1.5">
      {visible.map((entry) => (
        <li key={entry.label} className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.colour }}
            aria-hidden="true"
          />
          <span
            className="text-xs truncate"
            style={{
              color: "rgba(238,242,255,0.65)",
              fontFamily: "var(--font-body, 'Nunito Sans', sans-serif)",
            }}
          >
            {entry.label}
          </span>
        </li>
      ))}
      {needsOverflow && (
        <li className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: "rgba(238,242,255,0.2)" }}
            aria-hidden="true"
          />
          <span
            className="text-xs"
            style={{
              color: "rgba(238,242,255,0.4)",
              fontFamily: "var(--font-body, 'Nunito Sans', sans-serif)",
            }}
          >
            {overflowCount} others
          </span>
        </li>
      )}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/DoughnutLegend.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/DoughnutLegend.tsx apps/frontend/src/components/overview/DoughnutLegend.test.tsx
git commit -m "feat(overview): add DoughnutLegend component with overflow aggregation"
```

---

### Task 3: TierDoughnut Component

**Files:**

- Create: `apps/frontend/src/components/overview/TierDoughnut.tsx`
- Test: `apps/frontend/src/components/overview/TierDoughnut.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/TierDoughnut.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { TierDoughnut } from "./TierDoughnut";
import type { SubcategoryTotal } from "@finplan/shared";

const mockSubcategories: SubcategoryTotal[] = [
  { id: "s1", name: "Mortgage", sortOrder: 0, monthlyTotal: 1200, oldestReviewedAt: null, itemCount: 1 },
  { id: "s2", name: "Insurance", sortOrder: 1, monthlyTotal: 300, oldestReviewedAt: null, itemCount: 2 },
  { id: "s3", name: "Utilities", sortOrder: 2, monthlyTotal: 150, oldestReviewedAt: null, itemCount: 3 },
];

const mockItems = [
  { id: "i1", name: "Home Insurance", amount: 200, subcategoryId: "s2" },
  { id: "i2", name: "Car Insurance", amount: 100, subcategoryId: "s2" },
  { id: "i3", name: "Electric", amount: 80, subcategoryId: "s3" },
  { id: "i4", name: "Gas", amount: 40, subcategoryId: "s3" },
  { id: "i5", name: "Water", amount: 30, subcategoryId: "s3" },
];

describe("TierDoughnut", () => {
  it("renders the tier total in the centre", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={1650}
        subcategories={mockSubcategories}
        items={mockItems}
        isSnapshot={false}
      />
    );
    expect(screen.getByText("£1,650")).toBeTruthy();
  });

  it("renders subcategory names in the legend", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={1650}
        subcategories={mockSubcategories}
        items={mockItems}
        isSnapshot={false}
      />
    );
    expect(screen.getByText("Mortgage")).toBeTruthy();
    expect(screen.getByText("Insurance")).toBeTruthy();
    expect(screen.getByText("Utilities")).toBeTruthy();
  });

  it("shows 'No items' when subcategories is empty", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={0}
        subcategories={[]}
        items={[]}
        isSnapshot={false}
      />
    );
    expect(screen.getByText("No items")).toBeTruthy();
  });

  it("drills down on segment click and shows back link", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={1650}
        subcategories={mockSubcategories}
        items={mockItems}
        isSnapshot={false}
      />
    );

    // Click the "Insurance" segment
    const segments = screen.getAllByRole("button");
    const insuranceSegment = segments.find((s) => s.getAttribute("aria-label")?.includes("Insurance"));
    if (insuranceSegment) fireEvent.click(insuranceSegment);

    // Should show item names and back link
    expect(screen.getByText("Home Insurance")).toBeTruthy();
    expect(screen.getByText("Car Insurance")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
    // Centre text should show subcategory total
    expect(screen.getByText("£300")).toBeTruthy();
  });

  it("returns to subcategory view on back click", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={1650}
        subcategories={mockSubcategories}
        items={mockItems}
        isSnapshot={false}
      />
    );

    // Drill down
    const segments = screen.getAllByRole("button");
    const insuranceSegment = segments.find((s) => s.getAttribute("aria-label")?.includes("Insurance"));
    if (insuranceSegment) fireEvent.click(insuranceSegment);

    // Click back
    fireEvent.click(screen.getByText("Back"));

    // Should be back to subcategory view
    expect(screen.getByText("Mortgage")).toBeTruthy();
    expect(screen.getByText("£1,650")).toBeTruthy();
    expect(screen.queryByText("Back")).toBeNull();
  });

  it("disables drill-down in snapshot mode", () => {
    render(
      <TierDoughnut
        tier="committed"
        tierTotal={1650}
        subcategories={mockSubcategories}
        items={mockItems}
        isSnapshot={true}
      />
    );

    // Segments should not be clickable
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/TierDoughnut.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/overview/TierDoughnut.tsx
import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as d3 from "d3";
import type { SubcategoryTotal } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { generateTierColours } from "@/utils/tierColours";
import { DoughnutLegend } from "./DoughnutLegend";

interface DrillItem {
  id: string;
  name: string;
  amount: number;
  subcategoryId: string;
}

interface TierDoughnutProps {
  tier: "committed" | "discretionary";
  tierTotal: number;
  subcategories: SubcategoryTotal[];
  items: DrillItem[];
  isSnapshot: boolean;
}

const SIZE = 160;
const OUTER_R = SIZE / 2;
const INNER_R = OUTER_R * 0.62;
const CENTRE = SIZE / 2;

type ViewState =
  | { mode: "subcategory" }
  | { mode: "drilldown"; subcategoryId: string; subcategoryName: string; subcategoryTotal: number };

export function TierDoughnut({
  tier,
  tierTotal,
  subcategories,
  items,
  isSnapshot,
}: TierDoughnutProps) {
  const shouldReduce = useReducedMotion();
  const [view, setView] = useState<ViewState>({ mode: "subcategory" });

  // Sort subcategories by value descending for colour assignment
  const sorted = useMemo(
    () => [...subcategories].sort((a, b) => b.monthlyTotal - a.monthlyTotal),
    [subcategories]
  );

  const colours = useMemo(
    () => generateTierColours(tier, sorted.length),
    [tier, sorted.length]
  );

  const colourMap = useMemo(() => {
    const map = new Map<string, string>();
    sorted.forEach((s, i) => map.set(s.id, colours[i]));
    return map;
  }, [sorted, colours]);

  const arc = d3.arc<d3.PieArcDatum<{ value: number }>>()
    .innerRadius(INNER_R)
    .outerRadius(OUTER_R)
    .padAngle(subcategories.length > 1 ? 0.02 : 0)
    .cornerRadius(2);

  // Empty state
  if (subcategories.length === 0) {
    return (
      <div className="flex items-center gap-4">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={(OUTER_R + INNER_R) / 2}
            fill="none"
            stroke="rgba(238,242,255,0.1)"
            strokeWidth={OUTER_R - INNER_R}
          />
          <text
            x={CENTRE}
            y={CENTRE}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(238,242,255,0.4)"
            fontSize="13"
            fontFamily="var(--font-body, 'Nunito Sans', sans-serif)"
          >
            No items
          </text>
        </svg>
      </div>
    );
  }

  if (view.mode === "drilldown") {
    const subItems = items
      .filter((it) => it.subcategoryId === view.subcategoryId)
      .sort((a, b) => b.amount - a.amount);

    const drillColours = generateTierColours(tier, subItems.length);
    const pieData = d3.pie<{ value: number }>().sort(null).value((d) => d.value)(
      subItems.map((it) => ({ value: it.amount }))
    );

    const legendEntries = subItems.map((it, i) => ({
      colour: drillColours[i] ?? "#818cf8",
      label: it.name,
    }));

    return (
      <div className="flex items-center gap-4">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`translate(${CENTRE},${CENTRE})`}>
            {pieData.map((d, i) => {
              const item = subItems[i]!;
              const colour = drillColours[i] ?? "#818cf8";
              return (
              <motion.path
                key={item.id}
                d={arc(d) ?? ""}
                fill={colour}
                initial={shouldReduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              />
              );
            })}
          </g>
          <text
            x={CENTRE}
            y={CENTRE}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(238,242,255,0.92)"
            fontSize="16"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={500}
          >
            {formatCurrency(view.subcategoryTotal)}
          </text>
        </svg>
        <div className="flex flex-col gap-2">
          <DoughnutLegend entries={legendEntries} />
          <button
            type="button"
            onClick={() => setView({ mode: "subcategory" })}
            className="text-xs mt-1 self-start"
            style={{ color: "rgba(238,242,255,0.5)" }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Subcategory view
  const pieData = d3.pie<{ value: number }>().sort(null).value((d) => d.value)(
    sorted.map((s) => ({ value: s.monthlyTotal }))
  );

  const legendEntries = sorted.map((s, i) => ({
    colour: colours[i] ?? "#818cf8",
    label: s.name,
  }));

  return (
    <div className="flex items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <g transform={`translate(${CENTRE},${CENTRE})`}>
          {pieData.map((d, i) => {
            const sub = sorted[i]!;
            const colour = colours[i] ?? "#818cf8";
            const pathD = arc(d) ?? "";

            if (isSnapshot) {
              return (
                <path
                  key={sub.id}
                  d={pathD}
                  fill={colour}
                />
              );
            }

            return (
              <motion.path
                key={sub.id}
                role="button"
                aria-label={`${sub.name}: ${formatCurrency(sub.monthlyTotal)}`}
                tabIndex={0}
                d={pathD}
                fill={colour}
                style={{ cursor: "pointer" }}
                whileHover={{ scale: 1.04 }}
                onClick={() =>
                  setView({
                    mode: "drilldown",
                    subcategoryId: sub.id,
                    subcategoryName: sub.name,
                    subcategoryTotal: sub.monthlyTotal,
                  })
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView({
                      mode: "drilldown",
                      subcategoryId: sub.id,
                      subcategoryName: sub.name,
                      subcategoryTotal: sub.monthlyTotal,
                    });
                  }
                }}
                initial={shouldReduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, delay: i * 0.04, ease: [0.25, 1, 0.5, 1] }}
              />
            );
          })}
        </g>
        <text
          x={CENTRE}
          y={CENTRE}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(238,242,255,0.92)"
          fontSize="16"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500}
        >
          {formatCurrency(tierTotal)}
        </text>
      </svg>
      <DoughnutLegend entries={legendEntries} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/TierDoughnut.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/TierDoughnut.tsx apps/frontend/src/components/overview/TierDoughnut.test.tsx
git commit -m "feat(overview): add TierDoughnut component with subcategory drill-down"
```

---

### Task 4: WaterfallSankey Component

**Files:**

- Create: `apps/frontend/src/components/overview/WaterfallSankey.tsx`
- Test: `apps/frontend/src/components/overview/WaterfallSankey.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/WaterfallSankey.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { WaterfallSankey } from "./WaterfallSankey";

describe("WaterfallSankey", () => {
  const defaultProps = {
    income: 5000,
    committed: 2000,
    discretionary: 1500,
    surplus: 1500,
  };

  it("renders the SVG with three column labels", () => {
    render(<WaterfallSankey {...defaultProps} />);
    expect(screen.getByText("Income")).toBeTruthy();
    expect(screen.getByText("Surplus")).toBeTruthy();
  });

  it("renders band paths for committed and discretionary", () => {
    const { container } = render(<WaterfallSankey {...defaultProps} />);
    const paths = container.querySelectorAll("path");
    // 3 bands: committed, discretionary, surplus
    expect(paths.length).toBe(3);
  });

  it("shows tooltip on band hover", () => {
    render(<WaterfallSankey {...defaultProps} />);
    const bands = screen.getAllByRole("img");
    fireEvent.mouseEnter(bands[0]);
    // Tooltip should appear with tier name and amount
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("renders nothing when income is zero", () => {
    const { container } = render(
      <WaterfallSankey income={0} committed={0} discretionary={0} surplus={0} />
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/WaterfallSankey.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/components/overview/WaterfallSankey.tsx
import { useState } from "react";
import { formatCurrency } from "@/utils/format";

interface WaterfallSankeyProps {
  income: number;
  committed: number;
  discretionary: number;
  surplus: number;
}

const TIER_COLOURS = {
  committed: "#6366f1",
  discretionary: "#a855f7",
  surplus: "#4adcd0",
} as const;

type BandKey = "committed" | "discretionary" | "surplus";

const TIER_LABELS: Record<BandKey, string> = {
  committed: "Committed",
  discretionary: "Discretionary",
  surplus: "Surplus",
};

const WIDTH = 320;
const HEIGHT = 200;
const COL_LEFT = 40;
const COL_MID = WIDTH / 2;
const COL_RIGHT = WIDTH - 40;
const BAND_TOP = 30;
const BAND_BOTTOM = HEIGHT - 20;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

interface Band {
  key: string;
  colour: string;
  fraction: number;
  yStartLeft: number;
  heightLeft: number;
  yStartRight: number;
  heightRight: number;
}

function buildBands(
  income: number,
  committed: number,
  discretionary: number,
  surplus: number
): Band[] {
  if (income <= 0) return [];

  const cFrac = committed / income;
  const dFrac = discretionary / income;
  const sFrac = surplus / income;

  // Left column: full income bar
  // Middle column: committed on top, discretionary below
  // Right column: surplus
  let yMid = BAND_TOP;
  const cHeight = cFrac * BAND_HEIGHT;
  const dHeight = dFrac * BAND_HEIGHT;
  const sHeight = sFrac * BAND_HEIGHT;

  const bands: Band[] = [];

  // Committed: flows from income (top portion) to middle top
  bands.push({
    key: "committed",
    colour: TIER_COLOURS.committed,
    fraction: cFrac,
    yStartLeft: BAND_TOP,
    heightLeft: cHeight,
    yStartRight: yMid,
    heightRight: cHeight,
  });
  yMid += cHeight;

  // Discretionary: flows from income (middle portion) to middle bottom
  bands.push({
    key: "discretionary",
    colour: TIER_COLOURS.discretionary,
    fraction: dFrac,
    yStartLeft: BAND_TOP + cHeight,
    heightLeft: dHeight,
    yStartRight: yMid,
    heightRight: dHeight,
  });
  yMid += dHeight;

  // Surplus: flows from remaining income through to right
  bands.push({
    key: "surplus",
    colour: TIER_COLOURS.surplus,
    fraction: sFrac,
    yStartLeft: BAND_TOP + cHeight + dHeight,
    heightLeft: sHeight,
    yStartRight: BAND_TOP,
    heightRight: sHeight,
  });

  return bands.filter((b) => b.fraction > 0);
}

function bandPath(
  x0: number,
  x1: number,
  y0Top: number,
  h0: number,
  y1Top: number,
  h1: number
): string {
  const cx = (x0 + x1) / 2;
  // Top edge: cubic bezier from (x0, y0Top) to (x1, y1Top)
  // Bottom edge: cubic bezier from (x1, y1Top+h1) back to (x0, y0Top+h0)
  return [
    `M ${x0} ${y0Top}`,
    `C ${cx} ${y0Top}, ${cx} ${y1Top}, ${x1} ${y1Top}`,
    `L ${x1} ${y1Top + h1}`,
    `C ${cx} ${y1Top + h1}, ${cx} ${y0Top + h0}, ${x0} ${y0Top + h0}`,
    `Z`,
  ].join(" ");
}

export function WaterfallSankey({
  income,
  committed,
  discretionary,
  surplus,
}: WaterfallSankeyProps) {
  const [hoveredBand, setHoveredBand] = useState<BandKey | null>(null);

  const amounts: Record<BandKey, number> = { committed, discretionary, surplus };

  // Left-to-mid bands (committed, discretionary)
  // Mid-to-right band (surplus)
  const leftBands = buildBands(income, committed, discretionary, surplus);

  return (
    <div className="relative">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-label="Waterfall flow diagram"
      >
        {/* Column labels */}
        <text
          x={COL_LEFT}
          y={16}
          textAnchor="middle"
          fill="rgba(238,242,255,0.5)"
          fontSize="11"
          fontFamily="var(--font-heading, 'Outfit', sans-serif)"
          fontWeight={600}
          letterSpacing="0.05em"
        >
          Income
        </text>
        <text
          x={COL_RIGHT}
          y={16}
          textAnchor="middle"
          fill="rgba(238,242,255,0.5)"
          fontSize="11"
          fontFamily="var(--font-heading, 'Outfit', sans-serif)"
          fontWeight={600}
          letterSpacing="0.05em"
        >
          Surplus
        </text>

        {/* Income bar (left column) */}
        {income > 0 && (
          <rect
            x={COL_LEFT - 8}
            y={BAND_TOP}
            width={16}
            height={BAND_HEIGHT}
            rx={4}
            fill="#0ea5e9"
            opacity={0.8}
          />
        )}

        {/* Bands from left to mid */}
        {leftBands
          .filter((b) => b.key !== "surplus")
          .map((band) => (
            <path
              key={band.key}
              role="img"
              aria-label={`${TIER_LABELS[band.key as BandKey]}: ${formatCurrency(amounts[band.key as BandKey])}`}
              d={bandPath(
                COL_LEFT + 8,
                COL_MID - 8,
                band.yStartLeft,
                band.heightLeft,
                band.yStartRight,
                band.heightRight
              )}
              fill={band.colour}
              opacity={hoveredBand === band.key ? 0.9 : 0.5}
              style={{ transition: "opacity 150ms ease-out", cursor: "default" }}
              onMouseEnter={() => setHoveredBand(band.key as BandKey)}
              onMouseLeave={() => setHoveredBand(null)}
            />
          ))}

        {/* Mid column bars */}
        {leftBands
          .filter((b) => b.key !== "surplus")
          .map((band) => (
            <rect
              key={`mid-${band.key}`}
              x={COL_MID - 8}
              y={band.yStartRight}
              width={16}
              height={band.heightRight}
              fill={band.colour}
              opacity={0.8}
            />
          ))}

        {/* Surplus band: mid to right */}
        {leftBands
          .filter((b) => b.key === "surplus")
          .map((band) => {
            // Surplus starts after committed + discretionary in the mid column
            const midYStart = band.yStartLeft; // same vertical position
            return (
              <path
                key={band.key}
                role="img"
                aria-label={`${TIER_LABELS[band.key as BandKey]}: ${formatCurrency(amounts[band.key as BandKey])}`}
                d={bandPath(
                  COL_MID + 8,
                  COL_RIGHT - 8,
                  midYStart,
                  band.heightLeft,
                  band.yStartRight,
                  band.heightRight
                )}
                fill={band.colour}
                opacity={hoveredBand === band.key ? 0.9 : 0.5}
                style={{ transition: "opacity 150ms ease-out", cursor: "default" }}
                onMouseEnter={() => setHoveredBand(band.key as BandKey)}
                onMouseLeave={() => setHoveredBand(null)}
              />
            );
          })}

        {/* Surplus bar (right column) */}
        {surplus > 0 && (
          <rect
            x={COL_RIGHT - 8}
            y={BAND_TOP}
            width={16}
            height={leftBands.find((b) => b.key === "surplus")?.heightRight ?? 0}
            rx={4}
            fill={TIER_COLOURS.surplus}
            opacity={0.8}
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoveredBand && (
        <div
          role="tooltip"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(13,17,32,0.95)",
            border: "1px solid rgba(238,242,255,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="text-xs font-medium"
            style={{
              color: TIER_COLOURS[hoveredBand],
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            }}
          >
            {TIER_LABELS[hoveredBand]}
          </span>
          <span
            className="text-xs ml-2 tabular-nums"
            style={{
              color: "rgba(238,242,255,0.85)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatCurrency(amounts[hoveredBand])}/mo
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/WaterfallSankey.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/WaterfallSankey.tsx apps/frontend/src/components/overview/WaterfallSankey.test.tsx
git commit -m "feat(overview): add WaterfallSankey flow diagram component"
```

---

### Task 5: Doughnut Data Helper

**Files:**

- Create: `apps/frontend/src/utils/doughnutData.ts`
- Test: `apps/frontend/src/utils/doughnutData.test.ts`

This utility extracts drill-down items from `WaterfallSummary` for each tier, combining committed bills and yearly bills, and normalising discretionary categories + savings allocations into a common shape.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/utils/doughnutData.test.ts
import { describe, it, expect } from "bun:test";
import { extractDrillItems } from "./doughnutData";
import type { WaterfallSummary } from "@finplan/shared";

const baseSummary: WaterfallSummary = {
  income: {
    total: 5000,
    byType: [],
    bySubcategory: [],
    monthly: [],
    annual: [],
    oneOff: [],
  },
  committed: {
    monthlyTotal: 2000,
    monthlyAvg12: 2000,
    bySubcategory: [
      {
        id: "s1",
        name: "Housing",
        sortOrder: 0,
        monthlyTotal: 1500,
        oldestReviewedAt: null,
        itemCount: 2,
      },
    ],
    bills: [
      {
        id: "b1",
        householdId: "h1",
        name: "Mortgage",
        amount: 1200,
        ownerId: null,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "s1",
        spendType: "monthly",
      },
    ],
    yearlyBills: [
      {
        id: "y1",
        householdId: "h1",
        name: "Home Insurance",
        amount: 3600,
        dueMonth: 3,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "s1",
        spendType: "yearly",
      },
    ],
  },
  discretionary: {
    total: 1500,
    bySubcategory: [],
    categories: [],
    savings: { total: 0, allocations: [] },
  },
  surplus: { amount: 1500, percentOfIncome: 30 },
};

describe("extractDrillItems", () => {
  it("combines committed bills and yearly bills (÷12) for committed tier", () => {
    const items = extractDrillItems("committed", baseSummary);
    expect(items).toHaveLength(2);

    const mortgage = items.find((i) => i.name === "Mortgage");
    expect(mortgage?.amount).toBe(1200);

    const insurance = items.find((i) => i.name === "Home Insurance");
    expect(insurance?.amount).toBe(300); // 3600 / 12
  });

  it("combines discretionary categories and savings for discretionary tier", () => {
    const summary = {
      ...baseSummary,
      discretionary: {
        total: 1500,
        bySubcategory: [
          {
            id: "d1",
            name: "Fun",
            sortOrder: 0,
            monthlyTotal: 1000,
            oldestReviewedAt: null,
            itemCount: 1,
          },
        ],
        categories: [
          {
            id: "c1",
            householdId: "h1",
            name: "Dining Out",
            monthlyBudget: 500,
            sortOrder: 0,
            lastReviewedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            subcategoryId: "d1",
          },
        ],
        savings: {
          total: 500,
          allocations: [
            {
              id: "sa1",
              householdId: "h1",
              name: "Emergency Fund",
              monthlyAmount: 500,
              sortOrder: 0,
              lastReviewedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              subcategoryId: "d1",
            },
          ],
        },
      },
    };

    const items = extractDrillItems("discretionary", summary);
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.name === "Dining Out")?.amount).toBe(500);
    expect(items.find((i) => i.name === "Emergency Fund")?.amount).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/utils/doughnutData.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/utils/doughnutData.ts
import type { WaterfallSummary } from "@finplan/shared";

export interface DrillItem {
  id: string;
  name: string;
  amount: number;
  subcategoryId: string;
}

export function extractDrillItems(
  tier: "committed" | "discretionary",
  summary: WaterfallSummary
): DrillItem[] {
  if (tier === "committed") {
    const bills: DrillItem[] = summary.committed.bills.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      subcategoryId: b.subcategoryId ?? "",
    }));

    const yearly: DrillItem[] = summary.committed.yearlyBills.map((y) => ({
      id: y.id,
      name: y.name,
      amount: y.amount / 12, // Convert annual to monthly
      subcategoryId: y.subcategoryId ?? "",
    }));

    return [...bills, ...yearly];
  }

  // Discretionary: categories + savings allocations
  const cats: DrillItem[] = summary.discretionary.categories.map((c) => ({
    id: c.id,
    name: c.name,
    amount: c.monthlyBudget,
    subcategoryId: c.subcategoryId ?? "",
  }));

  const savings: DrillItem[] = summary.discretionary.savings.allocations.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.monthlyAmount,
    subcategoryId: s.subcategoryId ?? "",
  }));

  return [...cats, ...savings];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/utils/doughnutData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/utils/doughnutData.ts apps/frontend/src/utils/doughnutData.test.ts
git commit -m "feat(overview): add doughnut drill-down data extraction utility"
```

---

### Task 6: Restructure FinancialSummaryPanel — Split Layout

**Files:**

- Modify: `apps/frontend/src/components/overview/FinancialSummaryPanel.tsx`
- Modify: `apps/frontend/src/pages/OverviewPage.tsx`

The panel switches from a single-column card list to a split layout: NetWorthCard centred above, then a left column (Sankey + two doughnuts) and a right column (four sparkline cards).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/overview/FinancialSummaryPanel.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { FinancialSummaryPanel } from "./FinancialSummaryPanel";
import type { WaterfallSummary } from "@finplan/shared";

// Mock the financial summary hook
mock.module("@/hooks/useWaterfall", () => ({
  useFinancialSummary: () => ({
    data: {
      current: { netWorth: 50000, income: 5000, committed: 2000, discretionary: 1500, surplus: 1500 },
      sparklines: { netWorth: [], income: [], committed: [], discretionary: [], surplus: [] },
    },
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
}));

const mockSummary: WaterfallSummary = {
  income: { total: 5000, byType: [], bySubcategory: [], monthly: [], annual: [], oneOff: [] },
  committed: {
    monthlyTotal: 2000, monthlyAvg12: 2000,
    bySubcategory: [
      { id: "s1", name: "Housing", sortOrder: 0, monthlyTotal: 1200, oldestReviewedAt: null, itemCount: 1 },
      { id: "s2", name: "Transport", sortOrder: 1, monthlyTotal: 800, oldestReviewedAt: null, itemCount: 1 },
    ],
    bills: [
      { id: "b1", householdId: "h1", name: "Mortgage", amount: 1200, ownerId: null, sortOrder: 0, lastReviewedAt: new Date(), createdAt: new Date(), updatedAt: new Date(), subcategoryId: "s1" },
    ],
    yearlyBills: [],
  },
  discretionary: {
    total: 1500,
    bySubcategory: [
      { id: "d1", name: "Entertainment", sortOrder: 0, monthlyTotal: 1500, oldestReviewedAt: null, itemCount: 1 },
    ],
    categories: [
      { id: "c1", householdId: "h1", name: "Dining Out", monthlyBudget: 1500, sortOrder: 0, lastReviewedAt: new Date(), createdAt: new Date(), updatedAt: new Date(), subcategoryId: "d1" },
    ],
    savings: { total: 0, allocations: [] },
  },
  surplus: { amount: 1500, percentOfIncome: 30 },
};

describe("FinancialSummaryPanel with visualisations", () => {
  it("renders the Sankey diagram", () => {
    renderWithProviders(
      <FinancialSummaryPanel waterfallSummary={mockSummary} isSnapshot={false} />
    );
    expect(screen.getByLabelText("Waterfall flow diagram")).toBeTruthy();
  });

  it("renders committed and discretionary doughnut charts", () => {
    renderWithProviders(
      <FinancialSummaryPanel waterfallSummary={mockSummary} isSnapshot={false} />
    );
    // Legend entries from subcategories
    expect(screen.getByText("Housing")).toBeTruthy();
    expect(screen.getByText("Entertainment")).toBeTruthy();
  });

  it("renders the four sparkline tier cards", () => {
    renderWithProviders(
      <FinancialSummaryPanel waterfallSummary={mockSummary} isSnapshot={false} />
    );
    expect(screen.getByText("INCOME")).toBeTruthy();
    expect(screen.getByText("COMMITTED")).toBeTruthy();
    expect(screen.getByText("DISCRETIONARY")).toBeTruthy();
    expect(screen.getByText("SURPLUS")).toBeTruthy();
  });

});
```

Create a separate test file for the loading state (since `mock.module` is resolved at file scope):

```typescript
// apps/frontend/src/components/overview/FinancialSummaryPanel.loading.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

mock.module("@/hooks/useWaterfall", () => ({
  useFinancialSummary: () => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: () => {},
  }),
}));

import { FinancialSummaryPanel } from "./FinancialSummaryPanel";

describe("FinancialSummaryPanel loading state", () => {
  it("renders loading skeleton when data is not available", () => {
    renderWithProviders(
      <FinancialSummaryPanel waterfallSummary={undefined} isSnapshot={false} />
    );
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun test src/components/overview/FinancialSummaryPanel.test.tsx`
Expected: FAIL — props don't match current component signature

- [ ] **Step 3: Write minimal implementation**

Update `FinancialSummaryPanel.tsx`:

```typescript
// apps/frontend/src/components/overview/FinancialSummaryPanel.tsx
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useFinancialSummary } from "@/hooks/useWaterfall";
import { NetWorthCard } from "./NetWorthCard";
import { TierSummaryCard } from "./TierSummaryCard";
import { WaterfallSankey } from "./WaterfallSankey";
import { TierDoughnut } from "./TierDoughnut";
import { extractDrillItems } from "@/utils/doughnutData";
import type { WaterfallSummary } from "@finplan/shared";

interface FinancialSummaryPanelProps {
  waterfallSummary: WaterfallSummary | undefined;
  isSnapshot: boolean;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] as const },
  },
};

const cardVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

function SkeletonCard({ large = false }: { large?: boolean }) {
  return (
    <div
      className="rounded-xl p-6 animate-pulse"
      style={{ background: "#0d1120", border: "1px solid #1a1f35" }}
    >
      <div className="h-3 w-20 rounded bg-white/10 mx-auto mb-3" />
      <div className={`${large ? "h-9 w-32" : "h-5 w-24"} rounded bg-white/10 mx-auto mb-3`} />
      <div className="h-10 w-full rounded bg-white/10" />
    </div>
  );
}

export function FinancialSummaryPanel({ waterfallSummary, isSnapshot }: FinancialSummaryPanelProps) {
  const shouldReduce = useReducedMotion();
  const { data, isLoading, isError, refetch } = useFinancialSummary();

  const committedItems = useMemo(
    () => (waterfallSummary ? extractDrillItems("committed", waterfallSummary) : []),
    [waterfallSummary]
  );

  const discretionaryItems = useMemo(
    () => (waterfallSummary ? extractDrillItems("discretionary", waterfallSummary) : []),
    [waterfallSummary]
  );

  const cv = shouldReduce ? cardVariantsReduced : cardVariants;

  if (isLoading) {
    return (
      <div
        data-testid="financial-summary-panel"
        role="status"
        aria-busy="true"
        aria-label="Loading financial summary"
        className="flex flex-col items-center justify-start h-full overflow-y-auto py-8"
      >
        <div className="flex flex-col gap-3 w-[62%]">
          <SkeletonCard large />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        data-testid="financial-summary-panel"
        className="flex h-full items-center justify-center"
      >
        <div className="text-center">
          <p className="text-sm text-foreground/40 mb-2">Could not load summary</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs text-foreground/30 hover:text-foreground/50 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      data-testid="financial-summary-panel"
      className="flex flex-col h-full overflow-y-auto py-8 px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Net Worth — centred above the split */}
      <motion.div variants={cv} className="max-w-sm mx-auto w-full mb-6">
        <NetWorthCard netWorth={data.current.netWorth} sparklineData={data.sparklines.netWorth} />
      </motion.div>

      {/* Split layout: visualisations left, sparklines right */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left column: Sankey + Doughnuts */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          <motion.div variants={cv}>
            <WaterfallSankey
              income={data.current.income}
              committed={data.current.committed}
              discretionary={data.current.discretionary}
              surplus={data.current.surplus}
            />
          </motion.div>

          {waterfallSummary && (
            <>
              <motion.div variants={cv}>
                <p
                  className="text-xs mb-2 uppercase tracking-wider"
                  style={{
                    color: "#6366f1",
                    fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                    fontWeight: 600,
                  }}
                >
                  Committed
                </p>
                <TierDoughnut
                  tier="committed"
                  tierTotal={waterfallSummary.committed.monthlyTotal}
                  subcategories={waterfallSummary.committed.bySubcategory}
                  items={committedItems}
                  isSnapshot={isSnapshot}
                />
              </motion.div>

              <motion.div variants={cv}>
                <p
                  className="text-xs mb-2 uppercase tracking-wider"
                  style={{
                    color: "#a855f7",
                    fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                    fontWeight: 600,
                  }}
                >
                  Discretionary
                </p>
                <TierDoughnut
                  tier="discretionary"
                  tierTotal={waterfallSummary.discretionary.total}
                  subcategories={waterfallSummary.discretionary.bySubcategory}
                  items={discretionaryItems}
                  isSnapshot={isSnapshot}
                />
              </motion.div>
            </>
          )}
        </div>

        {/* Right column: Sparkline tier cards */}
        <div className="flex flex-col gap-3 w-[200px] shrink-0">
          <motion.div variants={cv}>
            <TierSummaryCard
              tier="income"
              amount={data.current.income}
              sparklineData={data.sparklines.income}
            />
          </motion.div>
          <motion.div variants={cv}>
            <TierSummaryCard
              tier="committed"
              amount={data.current.committed}
              sparklineData={data.sparklines.committed}
            />
          </motion.div>
          <motion.div variants={cv}>
            <TierSummaryCard
              tier="discretionary"
              amount={data.current.discretionary}
              sparklineData={data.sparklines.discretionary}
            />
          </motion.div>
          <motion.div variants={cv}>
            <TierSummaryCard
              tier="surplus"
              amount={data.current.surplus}
              sparklineData={data.sparklines.surplus}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
```

Update `OverviewPage.tsx` to pass the new props:

```typescript
// In OverviewPage.tsx, update the right panel section (around line 123):
// Change:
//   right = <FinancialSummaryPanel />;
// To:
//   right = <FinancialSummaryPanel waterfallSummary={summary} isSnapshot={isViewingSnapshot} />;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun test src/components/overview/FinancialSummaryPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/overview/FinancialSummaryPanel.tsx apps/frontend/src/components/overview/FinancialSummaryPanel.test.tsx apps/frontend/src/components/overview/FinancialSummaryPanel.loading.test.tsx apps/frontend/src/pages/OverviewPage.tsx
git commit -m "feat(overview): restructure FinancialSummaryPanel into split layout with visualisations"
```

---

### Task 7: Update Existing OverviewPage Tests

**Files:**

- Modify: `apps/frontend/src/pages/OverviewPage.test.tsx`
- Modify: `apps/frontend/src/pages/OverviewPage.navigation.test.tsx`

The `FinancialSummaryPanel` now takes props and internally calls `useFinancialSummary()`. Existing `OverviewPage` tests mock `useWaterfallSummary` but not `useFinancialSummary` — so when the panel renders, the hook call will fail.

- [ ] **Step 1: Write the failing test (verify breakage)**

Run: `cd apps/frontend && bun test src/pages/OverviewPage`
Expected: FAIL — `useFinancialSummary` is not mocked

- [ ] **Step 2: Add `useFinancialSummary` to existing mocks**

In `OverviewPage.test.tsx`, add `useFinancialSummary` to the existing `mock.module("@/hooks/useWaterfall", ...)` block:

```typescript
// apps/frontend/src/pages/OverviewPage.test.tsx
// Update the existing mock block to include useFinancialSummary:
mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useFinancialSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useItemHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
  useCashflow: () => ({ data: undefined, isLoading: false, isError: false }),
}));
```

Apply the same addition to `OverviewPage.navigation.test.tsx` if it has a similar mock block.

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd apps/frontend && bun test src/pages/OverviewPage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/OverviewPage.test.tsx apps/frontend/src/pages/OverviewPage.navigation.test.tsx
git commit -m "test(overview): add useFinancialSummary mock to OverviewPage tests"
```

## Testing

### Frontend Tests

- [ ] `tierColours.test.ts` — colour scale generation for both tiers, capping, edge cases
- [ ] `DoughnutLegend.test.tsx` — entry rendering, 7-entry overflow aggregation
- [ ] `TierDoughnut.test.tsx` — subcategory rendering, drill-down click, back navigation, snapshot mode, empty state
- [ ] `WaterfallSankey.test.tsx` — SVG rendering, band paths, tooltip on hover, zero-income edge case
- [ ] `doughnutData.test.ts` — committed bill + yearly bill merging, discretionary + savings merging
- [ ] `FinancialSummaryPanel.test.tsx` — split layout rendering, Sankey present, doughnuts present, sparkline cards present, loading skeleton

### Key Scenarios

- [ ] Happy path: Overview page loads with income/committed/discretionary data, Sankey and doughnuts render correctly
- [ ] Drill-down: Click committed doughnut subcategory, see individual items, click back to return
- [ ] Snapshot mode: Select a historical snapshot, visualisations render with snapshot data, doughnut segments are not clickable
- [ ] Empty tier: A tier with zero subcategories shows an empty ring with "No items"
- [ ] Single subcategory: A tier with one subcategory renders as a full ring

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/frontend && bun test` passes all frontend tests
- [ ] Manual: Load Overview page → see Sankey flow diagram with three bands → hover a band to see tooltip → see committed doughnut with subcategory segments → click a segment to drill down → see items → click Back → see discretionary doughnut → select a snapshot → verify doughnuts are non-interactive → deselect snapshot → verify drill-down works again

## Post-conditions

- [ ] The Overview right panel default state now visually communicates the waterfall cascade
- [ ] Subcategory composition is visible at a glance without clicking into tiers
- [ ] Drill-down provides item-level detail without leaving the overview
