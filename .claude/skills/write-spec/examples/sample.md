---
feature: overview-waterfall
design_doc: docs/4. planning/overview-waterfall/overview-waterfall-design.md
status: backlog
priority: high
deferred: false
phase: 5
implemented_date:
---

# Overview — Waterfall Display

> **Purpose:** Captures _what_ the feature does and _why_ — user stories, acceptance criteria, and interface-level implementation constraints. This is the input to `/write-plan`. It is intentionally not a technical plan: no Prisma syntax, no route code, no component file paths.

## Intention

The waterfall is the core mental model of FinPlan. Users need to see their income cascade through committed spend, discretionary spend, and surplus in a clear hierarchical layout — the closest analogue to a maintained personal spreadsheet.

## Description

A two-panel layout showing the waterfall from income through committed bills (monthly and yearly ÷12), discretionary spend, and surplus. The left panel displays tier headings and totals at a fixed width. The right panel fills the remaining space and updates based on selection.

## User Stories

- As a user, I want to see my income broken down into committed, discretionary, and surplus tiers so that I understand where my money is going at a glance.
- As a user, I want yearly bills shown as a monthly ÷12 figure so that annual costs feel equivalent to monthly ones.
- As a user, I want a surplus warning when my surplus drops below 10% of income so that I know my budget is tight.
- As a user with no data, I want a clear call to action so that I know how to get started.

## Acceptance Criteria

> Specific, testable criteria that define done. Each criterion must be verifiable without reading the implementation.

- [ ] Waterfall displays 4 tiers in order: Income, Committed (monthly + yearly ÷12), Discretionary, Surplus
- [ ] Left panel is fixed width with a border separator, never scrolls horizontally
- [ ] Right panel fills remaining space and shows empty state when nothing is selected
- [ ] Empty state shows CTA: "Set up your waterfall from scratch ▸"
- [ ] Surplus indicator is shown when surplus falls below 10% of total income
- [ ] Income items support frequency: Monthly, Annual (÷12), One-off
- [ ] Yearly bills appear in the Committed tier as ÷12 virtual pot values
- [ ] WaterfallConnector lines (vertical line + annotation) appear between tiers
- [ ] Tier totals are shown next to each tier heading in the left panel
- [ ] Tier rows use the correct colour token per tier

## Open Questions

- [x] ~~Is the 10% surplus warning threshold configurable in Settings, or hardcoded?~~ **Configurable** via `HouseholdSettings.surplusBenchmarkPct` (default 10%).
- [x] ~~Does the "Increase savings" link in the surplus row navigate to the Savings row detail, or to the Wealth page?~~ **Selects the Savings row within Discretionary** — does not navigate to the Wealth page.

---

## Implementation

> Interface-level constraints for the implementor. Describes _what_ is needed — entities, operations, UI units — without specifying _how_ to build them. `/write-plan` makes the technical decisions (Prisma syntax, route shapes, file paths, component code).

### Schema

> The logical data model — what entities are needed, their key fields and relationships, and any important constraints. Do NOT write Prisma syntax; `/write-plan` produces that.

- **IncomeSource**: tracks a household's income with frequency — monthly, annual (÷12), or one-off. Can be soft-ended (archived) without deletion. Supports an optional owner member and sort order.
- **CommittedBill**: a regular monthly expense assigned to a household. Supports optional owner and sort order.
- **YearlyBill**: an annual expense with a due month. Shown in Committed tier as amount ÷ 12. Supports sort order.
- **DiscretionaryCategory**: a monthly budget allocation (e.g. groceries, dining). Supports sort order.
- **SavingsAllocation**: a monthly savings target, optionally linked to a WealthAccount. Counted within Discretionary tier. Supports sort order.
- **WaterfallHistory**: audit log of value changes for any waterfall item (by item type + id). Enables timeline features. Indexed by item type, id, and recorded date.
- All waterfall entities are household-scoped. No cross-household access permitted.

### API

> What operations the backend needs to expose, who can call them, and any auth or multi-tenancy rules. Do NOT write HTTP routes; `/write-plan` produces those.

- Get full waterfall summary (computed totals for all tiers) — JWT-protected, household-scoped
- CRUD for each waterfall entity type (IncomeSource, CommittedBill, YearlyBill, DiscretionaryCategory, SavingsAllocation) — JWT-protected, household-scoped
- End and reactivate an IncomeSource (soft archive/restore) — JWT-protected
- Confirm individual items (updates `lastReviewedAt`) — JWT-protected
- Batch confirm multiple items in one call — JWT-protected
- Delete all waterfall items for a household (used by Settings → Rebuild) — JWT-protected, household-scoped
- Amount changes must record a WaterfallHistory entry automatically

### Components

> What UI units are needed and what each is responsible for. Do NOT write file paths or component code; `/write-plan` produces those.

- **TwoPanelLayout** — shared page shell: fixed-width left aside + flexible main area. Used by Overview and other pages.
- **WaterfallLeftPanel** — renders all four tiers with headings, item rows, and tier totals. Shows `StalenessIndicator` per item. Collapses discretionary items beyond 5 with a "··· N more" toggle. Surplus row shows "Increase savings ▸" link that selects the Savings row.

### Notes

- Surplus is calculated as: income total − committed monthly total − committed yearly avg (÷12) − discretionary total
- Surplus warning threshold comes from `HouseholdSettings.surplusBenchmarkPct`; tooltip: "A monthly surplus of around 10% of income is a common planning benchmark."
- IncomeSource where `endedAt` is set and in the past is excluded from the live waterfall summary
- "Increase savings ▸" selects the Savings row within Discretionary — does NOT navigate to the Wealth page
- `DELETE all` is triggered by Settings → Waterfall → "Rebuild from scratch" confirm flow
