---
feature: staleness-indicators
status: backlog
priority: high
deferred: false
phase: 12
implemented_date:
---

# Staleness Indicators

## Intention

Users need to know when a financial value hasn't been reviewed recently and may no longer reflect reality. The staleness system surfaces this passively — ambient warnings that prompt action without blocking the user.

## Description

Every waterfall item and wealth account records a `lastReviewedAt` timestamp. A staleness threshold (configured per item type in Settings) defines how many months before an item is considered stale. When stale, an amber ⚠ indicator appears inline on the item. When fresh, nothing is shown — silence means approval.

## User Stories

- As a user, I want to see at a glance which items haven't been reviewed in a while, so I know where to focus during a review.
- As a user, I want the indicator to be unobtrusive when everything is current, so the UI isn't noisy.
- As a user, I want to know how long ago something was last reviewed, so I can judge urgency.

## Acceptance Criteria

### StalenessIndicator component

- [ ] Renders nothing when the item is not stale
- [ ] Renders an amber ⚠ icon when stale, with a tooltip: "Not reviewed for X months"
- [ ] Accepts `lastReviewedAt: string` (ISO date) and `thresholdMonths: number` as props

### Staleness utility (`staleness.ts`)

- [ ] `isStale(lastReviewedAt, thresholdMonths)` returns true when months elapsed >= threshold
- [ ] `stalenessLabel(lastReviewedAt)` returns:
  - "Last reviewed: this month" when 0 months ago
  - "Last reviewed: 1 month ago" when 1 month ago
  - "Last reviewed: N months ago" for N > 1

### Overview page placement

- [ ] Each item row in WaterfallLeftPanel shows `<StalenessIndicator>` using the per-type threshold from HouseholdSettings
- [ ] ItemDetailPanel shows `stalenessLabel()` text below the item value; prefixed with ⚠ if stale

### Wealth page placement

- [ ] Each account row in AccountListPanel shows staleness state ("Updated [date] ✓" if fresh; amber ⚠ if stale)
- [ ] AccountDetailPanel shows `stalenessLabel()` below the balance

### Thresholds

- [ ] Staleness thresholds are read from `HouseholdSettings.stalenessThresholds` (per-type JSON)
- [ ] Defaults: income_source 12mo, committed_bill 6mo, yearly_bill 12mo, discretionary_category 12mo, savings_allocation 12mo, wealth_account 3mo

## Open Questions

- None
