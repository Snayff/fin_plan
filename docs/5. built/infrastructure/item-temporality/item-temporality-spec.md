---
feature: item-temporality
design_doc: docs/4. planning/item-temporality/item-temporality-design.md
creation_date: 2026-04-04
status: backlog
implemented_date:
---

# Item Temporality & Scheduled Changes

> **Purpose:** Captures _what_ the feature does and _why_ — user stories, acceptance criteria, and interface-level implementation constraints. This is the input to `/write-plan`. It is intentionally not a technical plan: no Prisma syntax, no route code, no component file paths.

## Intention

Waterfall items currently exist in an eternal present — no concept of when they start, when they end, or how their value has changed over time. Users can't enter a future item, plan for a known price increase, or see the history of changes to a bill. The yearly calendar shows pot accumulation but doesn't surface which bills fall due or whether the pot can cover them. This feature gives every waterfall item a temporal lifecycle and a value timeline, enabling forward planning, historical record-keeping, and actionable cashflow visibility.

## Description

Introduces a value timeline model where each item's lifecycle and amount are defined entirely by an ordered sequence of periods — each with a start date, optional end date, and amount. The item itself has no date or amount fields; everything is derived from its periods. This creates three lifecycle states: Active, Future, and Expired. The tier page gains a multi-select filter for lifecycle states. The expanded item row shows a sparkline of the value timeline; edit mode exposes the period list for direct manipulation. The yearly calendar is enhanced to show individual bills per month with pot balance breakdowns and amber shortfall indicators.

## User Stories

- As a user, I want to enter a future item (e.g. "Disney+ starts in June") so that my waterfall reflects planned changes before they take effect.
- As a user, I want to set an end date on an item so that expired bills stop appearing in my active view and stop contributing to my waterfall totals.
- As a user, I want to record a planned price change (e.g. "Netflix goes to £9 in October") so that my forward-looking totals are accurate.
- As a user, I want to see the value history of an item at a glance so that I understand how a bill has changed over time.
- As a user, I want to back-fill historical values for an item so that my records are complete.
- As a user, I want to filter my tier page by Active, Future, and Expired items so that I can focus on what matters right now or review what's planned or ended.
- As a user, I want to see which yearly bills fall due in each month so that I understand where my pot money goes.
- As a user, I want to be warned when my yearly pot can't cover the bills due in a given month so that I can plan ahead.
- As a user, I want one-off items to accumulate in the pot and auto-expire after they're due so that they integrate cleanly into the cashflow model.

## Acceptance Criteria

### Lifecycle states

- [ ] An item's lifecycle is derived entirely from its periods — the item itself has no date fields
- [ ] An item is **Active** when it has a period where `startDate <= today` AND (`endDate` is null OR `endDate > today`)
- [ ] An item is **Future** when all of its periods have `startDate > today`
- [ ] An item is **Expired** when all of its periods have `endDate <= today` (no null endDates)
- [ ] Only Active items contribute to waterfall totals (summary, surplus calculation)
- [ ] Future and Expired items are excluded from waterfall totals

### Tier page filter

- [ ] A multi-select toggle with three options (Active / Future / Expired) appears at the top of the item area on tier pages
- [ ] Each toggle button shows the count of items in that state
- [ ] Default selection is Active only
- [ ] Active items render at full opacity with normal borders
- [ ] Future items render at reduced opacity (0.55) with dashed borders and a badge showing the start date (e.g. "From 1 Jun 2026")
- [ ] Expired items render at reduced opacity (0.35)
- [ ] Multiple states can be selected simultaneously (e.g. Active + Future)
- [ ] When a filter selection shows no items, the item area displays "No [future/expired] items" in muted text, centred

### Value timeline (periods)

- [ ] A new ItemAmountPeriod entity stores `(itemType, itemId, startDate, endDate, amount)` records
- [ ] `startDate` is required on every period
- [ ] `endDate` is optional; null means the period runs indefinitely (current/ongoing)
- [ ] Periods are contiguous — one period's `endDate` equals the next period's `startDate`
- [ ] The `amount` field is removed from all three item models; amount is always derived from the current effective period
- [ ] The current effective period is the one where `startDate <= today` AND (`endDate` is null OR `endDate > today`)
- [ ] Creating an item always creates an initial period with `startDate` from the form (defaulting to today) and `amount` from the form
- [ ] An item must always have at least one period
- [ ] Attempting to delete the last period prompts "This will delete the item. Continue?" and deletes the item if confirmed
- [ ] Periods are ordered by `startDate` ascending; no two periods for the same item may have overlapping date ranges
- [ ] No period's `startDate` may be after the item's final `endDate` (if one exists)
- [ ] When editing a boundary between two adjacent periods, both records update (period N's `endDate` and period N+1's `startDate`)

### Scheduled change indicator

- [ ] When an item has a future period (startDate > today), the collapsed row shows an inline indicator: "→ £[amount] from [date]"
- [ ] Only the next upcoming period is shown in the indicator (not all future periods)
- [ ] The indicator uses tier colour at reduced opacity for the new amount, muted text for the arrow and date

### Sparkline (expanded row)

- [ ] The expanded read-only accordion shows a "Value History" section below Notes
- [ ] The sparkline renders a step-function chart: x-axis = time, y-axis = amount
- [ ] Past and current periods render as a solid line in tier colour
- [ ] Future periods render as a dashed line
- [ ] A dot marks "now" on the timeline
- [ ] Amount labels appear at each step change
- [ ] Date labels appear at each step change and at "now"
- [ ] If the item has only one period (no history), the sparkline is not shown
- [ ] The sparkline section does not render until period data is loaded (no skeleton)

### Edit mode period list

- [ ] Edit mode shows a "Value History" section with an editable list of period rows
- [ ] Each row shows: start date, end date (or "Ongoing" if null), amount, and a remove action
- [ ] The current period row is visually highlighted and labelled "Current"
- [ ] Future period rows are labelled "Scheduled"
- [ ] Past period rows have no label
- [ ] Users can edit the dates and amount of any period
- [ ] Editing a period boundary updates both the period being edited and the adjacent period to maintain contiguity
- [ ] Users can add a new period via an "+ Add period" button
- [ ] Users can remove any period (with last-period-deletion triggering item deletion as above)
- [ ] Historical back-fill is supported — users can add periods with past dates
- [ ] Periods cannot have overlapping date ranges; the UI prevents or rejects overlaps

### One-off items

- [ ] One-off items get a single period with `startDate` = due date and `endDate` = `startDate + 1 day`
- [ ] One-off items use the yearly ÷12 pot model, accumulating monthly until the due month
- [ ] One-off items auto-expire to the Expired state after their end date passes
- [ ] One-off items show a single amount on the collapsed row (no monthly/yearly conversion pair)
- [ ] One-off items show "£X/mo pot" as the derived amount on the second line

### Yearly calendar

- [ ] Each month row shows the month name and the pot balance after that month's deductions and accrual
- [ ] Months with a shortfall (pot goes negative after deductions) show an amber dot on the collapsed row
- [ ] Expanding a month shows: list of individual bills due (name + amount), pot balance before deductions, monthly accrual amount, pot balance after deductions
- [ ] When the pot after deductions is negative, an amber cashflow note appears: "Pot is £X short for [Month]"
- [ ] The cashflow note uses arithmetic language only — no advice (per design anchor #9)
- [ ] Pot calculation respects period dates — items only contribute ÷12 during periods where they are active
- [ ] Pot calculation uses the effective amount from the period timeline for each month (respecting scheduled changes within the year)
- [ ] One-off items appear in their due month alongside yearly bills

### "Period" definition

- [ ] "Period" tooltip text is added to the definitions reference, matching the approved text in the design doc
- [ ] The tooltip is applied to the "Value History" label in both the expanded row and edit mode

## Open Questions

- [x] ~~Should the `amount` field be kept as a denormalized cache?~~ **No.** Removed entirely. Amount is always derived from the current effective period. Single source of truth.
- [x] ~~What happens when a user deletes the last period?~~ **Prompts to delete the item.** An item without a period is meaningless.
- [x] ~~Do one-off items participate in the period model?~~ **Yes.** Consistent model — one-offs get a single period.
- [x] ~~Should items have their own startDate/endDate fields?~~ **No.** The item's lifecycle is derived entirely from its periods. Periods have `startDate` and `endDate`; the item has neither. Eliminates redundancy and sync issues.
- [x] ~~Can a period exist before the item's start date or after its end date?~~ **N/A.** The item has no dates — periods ARE the dates. Periods cannot overlap.

---

## Implementation

> Interface-level constraints for the implementor. Describes _what_ is needed — entities, operations, UI units — without specifying _how_ to build them. `/write-plan` makes the technical decisions.

### Schema

- **ItemAmountPeriod**: Stores value timeline entries. Key fields: item type (income/committed/discretionary), item ID (reference), start date (required), end date (optional, null = ongoing), amount (positive number). Periods for a given item must be contiguous and non-overlapping. Ordered by startDate ascending. Household-scoped via the parent item.

- **IncomeSource** (modified): Remove `amount` field. Remove `endedAt` field (lifecycle now derived from periods).

- **CommittedItem** (modified): Remove `amount` field (lifecycle and amount now derived from periods).

- **DiscretionaryItem** (modified): Remove `amount` field (lifecycle and amount now derived from periods).

- All existing code that reads `item.amount`, `item.endedAt`, or any item date field must be updated to derive from the item's periods.

- Existing data must be migrated: each item's current `amount` becomes an initial period with `startDate = item.createdAt` and `endDate = null`. For IncomeSource items with `endedAt`, the period's `endDate` is set to that value.

### API

- **Get waterfall summary** (modified) — must derive each item's amount from its current effective period. Must exclude Future and Expired items from totals. JWT-protected, household-scoped.

- **Create item** (modified, all three types) — accepts an initial period (startDate, amount, optional endDate). Must create the item and its first ItemAmountPeriod in a single transaction. JWT-protected, household-scoped.

- **Update item** (modified, all three types) — accepts non-temporal field changes (name, subcategory, notes, etc.). Does not accept amount or date changes; those go through period operations. JWT-protected, household-scoped.

- **List periods for item** — returns all periods for a given item, ordered by startDate ascending. JWT-protected, household-scoped.

- **Create period** — adds a new period to an item. Validates: amount > 0, no overlapping date ranges, contiguity with adjacent periods (updates adjacent period's endDate/startDate as needed). JWT-protected, household-scoped.

- **Update period** — modifies an existing period's startDate, endDate, or amount. Maintains contiguity with adjacent periods. JWT-protected, household-scoped.

- **Delete period** — removes a period. Adjusts adjacent period to close the gap (extends previous period's endDate or next period's startDate). If it's the last period, the item itself is deleted (with audit log). JWT-protected, household-scoped.

- **Get yearly cashflow** (modified) — must return bills due per month, pot before/after, accrual amount, and shortfall flag. Must respect period dates and effective amounts from the period timeline. JWT-protected, household-scoped.

### Components

- **ItemStatusFilter** — multi-select toggle bar rendering Active/Future/Expired buttons with counts. Manages filter state. Placed at the top of the item area on each tier page.

- **ItemRow** (modified) — renders the scheduled change indicator ("→ £9 from Oct") when the item has a future period. Applies visual treatment based on lifecycle state (opacity, border style, badge).

- **ItemAccordion** (modified) — gains a "Value History" section below Notes, rendering the sparkline. Sparkline is hidden when the item has only one period.

- **ValueSparkline** — renders the step-function SVG chart. Accepts the period list and renders solid/dashed segments, "now" dot, and amount/date labels.

- **ItemForm** (modified) — gains a "Value History" section showing the editable period list. Each row has start date input, end date display (derived or editable for the last period), amount input, and remove action. "+ Add period" button at the bottom. On last-period deletion, shows confirmation dialog then deletes the item.

- **CashflowCalendar** (modified) — month rows gain amber dot indicator for shortfall months. Expanded month content shows: bill list (name + amount), pot before, monthly accrual, pot after, and amber cashflow note when pot is negative.

### Notes

- The waterfall summary calculation changes: instead of reading `item.amount`, it must join to ItemAmountPeriod, find the current effective period per item, and sum only Active items.
- The pot calculation for yearly/one-off items must be forward-looking within the calendar year: for each month, determine which items have an active period, what their effective amount is that month (respecting scheduled changes), and compute ÷12 accrual and deductions accordingly.
- When a one-off item is created, the single period's `startDate` = due date and `endDate` = due date + 1 day. The user provides the due date and amount; the system handles the rest.
- The existing `endedAt` field on IncomeSource is removed. A migration must convert existing `endedAt` values into the corresponding period's `endDate`.
- Amount changes during item creation or edit are always expressed through the period model. There is no direct "set the amount" operation on the item.
- Snapshots continue to capture computed values at snapshot time. No changes to snapshot structure are required.
- Period contiguity is enforced at the API level: creating, updating, or deleting a period adjusts adjacent periods to maintain a gapless, non-overlapping sequence.
- An empty filter state (e.g. "Future" selected but no future items) shows "No future items" in muted text, centred in the item area.
