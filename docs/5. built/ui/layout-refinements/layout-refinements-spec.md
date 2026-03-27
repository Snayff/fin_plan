---
feature: layout-refinements
design_doc: docs/plans/2026-03-24-design-polish-design.md
status: implemented
priority: high
deferred: false
phase:
implemented_date: 2026-03-24
---

# Layout Refinements

## Intention

The design-polish pass left five open questions unresolved. This feature answers them. The most consequential change is restructuring the left panel from a flat item list into a true **navigation summary**: each tier shows a small number of meaningful subsections rather than every individual item. This makes the left panel scannable at a glance and reserves per-item detail for the right panel — the correct two-panel contract. Three additional decisions close out the remaining open questions: a right-panel drill-down pattern for Wealth, expanded use of callout gradients, and no change to surplus rendering.

## Description

Four changes across the frontend and one schema addition:

1. **Left panel restructured** — Income shows named type rows (Salary, Dividends, etc.) aggregated from IncomeSource records. Committed collapses to two aggregate rows (Monthly bills total + Yearly ÷12 total). Discretionary keeps named categories with a "··· N more" overflow, plus a Savings sub-section.
2. **Wealth right panel drill-down** — Selecting an asset class in the left panel loads that class's accounts into the right panel. Selecting an account loads account detail. A breadcrumb trail enables backward navigation.
3. **Callout gradient expansion** — The indigo→purple callout gradient added to the welcome hero card and the build summary completion card.
4. **No surplus change** — Silence is approval. Surplus rendering stays exactly as-is.
5. **Schema: `incomeType` field** — Required to support income type grouping in the left panel.

## User Stories

- As a user, I want the left panel to show me a clean summary of each tier so that I can see the shape of my finances without reading every item name.
- As a user, I want to click a subsection row in the left panel to see all items of that type in the right panel.
- As a user on the Wealth page, I want to click an asset class to see its accounts, then click an account to see its detail — without leaving the two-panel layout.
- As a returning user, I want the welcome page and the build completion moment to feel engaging and intentional, not flat.

## Acceptance Criteria

### 1. Left Panel — Income Tier

- [ ] Income tier shows one row per `incomeType` that has at least one active source
- [ ] Row label uses the canonical type name: "Salary", "Dividends", "Freelance", "Rental", "Benefits", "Other"
- [ ] Row amount is the sum of all active IncomeSource records with that type (monthly sources at face value; annual sources ÷12; one-off sources excluded from left panel)
- [ ] Clicking a type row selects it (highlight state) and loads that type's items in the right panel
- [ ] The tier total remains the sum of all active income (unchanged from today)
- [ ] Types with no active sources are not shown

### 2. Left Panel — Committed Tier

- [ ] Committed tier shows exactly two aggregate rows: "Monthly bills" and "Yearly ÷12"
- [ ] "Monthly bills" amount = sum of all CommittedBill records
- [ ] "Yearly ÷12" amount = sum of all YearlyBill.amount / 12
- [ ] Clicking "Monthly bills" loads the CommittedBill list in the right panel
- [ ] Clicking "Yearly ÷12" opens the cashflow calendar (existing behaviour)
- [ ] Tier total = monthlyTotal + monthlyAvg12 (unchanged)
- [ ] Stale count badge on the tier header accounts for stale CommittedBills only (yearly bills don't have staleness)

### 3. Left Panel — Discretionary Tier

- [ ] Discretionary shows all named DiscretionaryCategory rows (unchanged names)
- [ ] If category count exceeds 5, show first 5 then "··· N more" toggle to expand
- [ ] Savings sub-section header ("Savings") separates savings allocations from categories
- [ ] All named SavingsAllocation rows shown (no collapse — typically 2–4)
- [ ] Clicking a category or savings row loads its detail in the right panel (unchanged behaviour)
- [ ] Stale badge on tier header accounts for stale categories + stale allocations

### 4. Wealth Right Panel Drill-Down

- [ ] Default state: right panel shows the two-panel placeholder (icon + "Select an asset class to view its accounts")
- [ ] Clicking an asset class row in the left panel loads that class's account list in the right panel
- [ ] Account list shows: account name, institution, balance, account type, last-updated age
- [ ] A breadcrumb row at the top of the right panel shows "← All classes / [Class Name]" when an asset class is selected
- [ ] Clicking "← All classes" in the breadcrumb resets the right panel to the default placeholder
- [ ] Clicking an account card in the account list loads account detail in the right panel
- [ ] Account detail breadcrumb shows "← [Class Name] / [Account Name]"
- [ ] Clicking "← [Class Name]" in the breadcrumb returns to the account list for that class
- [ ] Left panel selection state (highlighted asset class row) reflects the current drill-down level

### 5. Callout Gradient Expansion

- [ ] Welcome page hero card uses the indigo→purple callout gradient (`linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)`) with a `1px rgba(99,102,241,0.1)` border
- [ ] Build summary completion card ("Your waterfall is ready") uses the purple→teal callout gradient (`linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(74,220,208,0.04) 100%)`) with a `1px rgba(168,85,247,0.08)` border
- [ ] Gradient treatment is consistent with existing empty state CTA cards (same radius, padding, structure)
- [ ] `docs/2. design/design-system.md` updated: callout gradient usage locations documented

## Open Questions

_None — all resolved during design session on 2026-03-24._

---

## Implementation

### Schema

```prisma
enum IncomeType {
  salary
  dividends
  freelance
  rental
  benefits
  other
}

model IncomeSource {
  // ... existing fields ...
  incomeType  IncomeType  @default(other)  // NEW
}
```

Migration required: add `incomeType` column with default `other`. Existing records will fall into `other` and users can update them via the right panel detail form.

### API

```
PATCH  /api/waterfall/income/:id   → now accepts { incomeType? }

GET    /api/waterfall              → WaterfallSummary.income shape updated (see Notes)
```

No new endpoints. The `/api/waterfall` summary endpoint must return income grouped by type for the left panel.

### Components

**Modified:**

- `WaterfallLeftPanel.tsx` — Restructure income rendering: group by `incomeType`, show one row per type with summed amount. Restructure committed rendering: replace item list with two aggregate rows ("Monthly bills", "Yearly ÷12"). Discretionary: add "··· N more" toggle if categories > 5. All other tiers unchanged.
- `WelcomePage.tsx` — Wrap the hero content in a callout gradient card (indigo→purple).
- `BuildGuidePanel.tsx` (SummaryPhase) — Wrap "Your waterfall is ready" heading + actions in a callout gradient card (purple→teal).
- `WealthPage.tsx` — Add drill-down state management: `selectedAssetClass: AssetClass | null`, `selectedAccountId: string | null`. Pass to right panel component.
- `WealthRightPanel.tsx` (or inline in `WealthPage.tsx`) — Three render states: empty hint, account list with breadcrumb, account detail with breadcrumb.

**New (potentially):**

- `AssetClassAccountList.tsx` — Account cards for a given asset class, with breadcrumb. Props: `assetClass`, `accounts`, `onSelectAccount`, `onBack`.
- `WealthBreadcrumb.tsx` — Shared breadcrumb component for wealth drill-down. Props: `steps: { label: string, onClick: () => void }[]`.

**Documentation:**

- `docs/2. design/design-system.md` — Callout gradient usage section updated with three canonical locations: empty state CTAs, welcome hero, build completion.

### Notes

**Updated WaterfallSummary.income shape:**

```typescript
interface IncomeByType {
  type: IncomeType;
  label: string; // "Salary", "Dividends", etc.
  monthlyTotal: number; // sum of monthly sources; annual/12 for annual sources
  sources: IncomeSource[]; // full list for right panel detail
}

interface WaterfallSummary {
  income: {
    total: number;
    byType: IncomeByType[]; // NEW — replaces monthly/annual/oneOff split for left panel
    monthly: IncomeSource[]; // kept for backward compat / right panel
    annual: (IncomeSource & { monthlyAmount: number })[];
    oneOff: IncomeSource[];
  };
  // ... rest unchanged
}
```

**Left panel row click behaviour:**

| Tier row clicked       | Right panel loads                     |
| ---------------------- | ------------------------------------- |
| Income type (Salary)   | All IncomeSource records of that type |
| Monthly bills          | Full CommittedBill list               |
| Yearly ÷12             | Cashflow calendar (existing)          |
| Discretionary category | Category detail (existing)            |
| Savings allocation     | Savings detail (existing)             |

**Wealth drill-down state machine:**

```
default → (click asset class) → account list → (click account) → account detail
account list → (click ← All classes) → default
account detail → (click ← [Class]) → account list
```

Left panel selection highlight: asset class row highlighted when either `account list` or `account detail` state is active for that class.

**`incomeType` migration note:** Existing income sources default to `other`. The right panel income detail view (already spec'd in overview-waterfall) should expose the `incomeType` field as an editable dropdown so users can correctly categorise existing items.

**"··· N more" toggle:** When Discretionary has more than 5 categories, show the first 5 and a muted "··· N more" button. Clicking expands to show all (no re-collapse until next page visit). This avoids layout shift on second click.
