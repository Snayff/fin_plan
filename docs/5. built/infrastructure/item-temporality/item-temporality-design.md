---
feature: item-temporality
status: approved
creation_date: 2026-04-04
status: backlog
implemented_date:
---

# Item Temporality & Scheduled Changes — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

Currently, waterfall items have no concept of when they begin or end. `IncomeSource` has an `endedAt` field but no start date; `CommittedItem` and `DiscretionaryItem` have neither. There's no way to enter a future item ("Disney+ starts in June"), plan a known price change ("Netflix goes to £9 in October"), or see historical value progression. One-off items exist as a `SpendType` but aren't properly modelled as time-bounded events. The yearly calendar shows pot accumulation but doesn't show which bills fall due in each month or warn when the pot can't cover them.

## Approved Approach

**Start/end dates on all items.** All three item types (income, committed, discretionary) get `startDate` and `endDate` fields. `startDate` defaults to creation date. `endDate` is optional. Together they define three lifecycle states: **Active** (start ≤ today, no end or end > today), **Future** (start > today), **Expired** (end ≤ today).

**Value timeline per item.** A new `ItemAmountPeriod` model stores an ordered list of `(effectiveFrom, amount)` records per item. This replaces the single `amount` field as the source of truth for what an item costs at any point in time. The existing `amount` field stays as a denormalized cache of the current effective amount, updated when a scheduled period activates. Past periods are historical record; future periods are scheduled changes. No `effectiveTo` — end is derived from the next period's start.

**One-off items as time-bounded yearly.** One-off items use the yearly ÷12 pot model. `startDate` = due date, `endDate` = startDate + 1 day. They accumulate in the pot and deduct when due, then auto-expire to the Expired state.

**Tier page filtering.** A three-state multi-select toggle (Active / Future / Expired) with item counts. Defaults to Active only. Items render with distinct visual treatment per state — full opacity for active, dashed border + reduced opacity for future, dimmed for expired.

**Expanded row sparkline.** The read-only expanded accordion gains a step-function sparkline showing the value timeline. Solid line for past/current periods, dashed for future. Amount labels at each step. A dot marks "now".

**Edit mode history entries.** Edit mode shows the value timeline as an editable list of period rows (date + amount + remove). Users can add, modify, or delete periods freely, including back-filling historical values.

**Yearly calendar enhancement.** Month rows show which bills fall due and whether the pot covers them. Months with shortfalls get an amber dot on the collapsed row. Expanding a month shows: individual bills due (name + amount), pot before deductions, monthly accrual, pot after, and an amber cashflow note when negative. The pot calculation respects item start/end dates and uses the effective amount from the value timeline for each month.

## Key Decisions

| Decision                             | Choice                                                    | Rationale                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Start date default                   | Creation date when not specified                          | Every item has a defined active window; backdating is possible by editing                                                   |
| End date                             | Optional, null = indefinite                               | Most items run indefinitely; end date is only needed for items that genuinely expire                                        |
| Item lifecycle states                | Active / Future / Expired (three states)                  | Future and expired are meaningfully different — future items represent planning intent, expired items are historical record |
| Filter default                       | Active only                                               | Clean, focused view; future and expired are opt-in                                                                          |
| Filter type                          | Multi-select toggle                                       | Users often want Active + Future together to see the full forward picture                                                   |
| One-off model                        | Yearly ÷12 pot with auto-expire                           | Consistent with design anchor #15; one-off is a special case of yearly, not a separate mechanism                            |
| Value timeline model                 | Ordered list of (effectiveFrom, amount) periods per item  | Preserves full history + supports scheduled changes; no effectiveTo — derived from next period                              |
| Initial period                       | Always created when item is created                       | An item without a period is meaningless; effectiveFrom matches startDate                                                    |
| Item amount field                    | Denormalized cache of current period                      | Avoids joining to ItemAmountPeriod for every list render; updated when a period activates                                   |
| Scheduled change display             | Inline indicator on item row ("→ £9 from Oct")            | Visible without changing filter; preserves item identity (one row, not two)                                                 |
| Value history in expanded row        | Sparkline (step function)                                 | Visual at a glance; solid = past/current, dashed = future, dot = now                                                        |
| Value history in edit mode           | Editable list of period rows                              | Direct manipulation; add/modify/delete periods including historical back-fill                                               |
| Historical back-fill                 | Allowed                                                   | Users should be able to record "Netflix was £7 from 2011" for complete history                                              |
| Yearly calendar: month expansion     | Shows bills due + pot before/after + amber shortfall note | Surfaces the information needed to understand and act on cashflow gaps                                                      |
| Yearly calendar: shortfall indicator | Amber dot on collapsed month row                          | Scannable at a glance without expanding every month                                                                         |
| Calendar shortfall note tone         | Arithmetic only, no advice                                | Per design anchor #9 — "Pot is £98 short" not "You need to save more"                                                       |
| "Period" definition                  | Added to definitions.md                                   | New concept introduced to the user; needs canonical tooltip text                                                            |

## Out of Scope

- Changes to the waterfall summary/overview page calculations (those already derive from item amounts)
- Recurring scheduled changes (e.g. "goes up £1 every year") — only single future periods, added manually
- Automatic period activation (cron/scheduled job to update the amount cache) — this is an implementation detail for spec/plan phase
- Mobile/responsive layout for the new filter, sparkline, or calendar
- Snapshot interaction with periods (how historical snapshots store period data) — existing snapshot mechanism captures the state at the time
- Changes to the Review Wizard flow
- Staleness threshold logic (unchanged by this feature)
- Refactoring WaterfallHistory — it serves a different purpose (snapshot audit log) and is unaffected

## Visual Reference

- `item-temporality-mockups.html` — four mockups: tier page filter (active/future/expired states), expanded row with value history sparkline, edit mode period entries, yearly calendar with bills and shortfall indicators
