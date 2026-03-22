---
feature: overview-item-detail
status: backlog
priority: high
deferred: false
phase: 6
implemented_date:
---

# Overview — Item Detail Panel

## Intention
When a user selects a waterfall item, they need to see its current value, understand its history, and take action (edit or confirm staleness) without leaving the overview context.

## Description
The right panel displays the selected item's value prominently, a 24-month history graph, and a ButtonPair for editing or confirming the item. An optional NudgeCard may appear for contextual arithmetic suggestions. The savings row expands to show per-account allocations with optional links to Wealth.

## User Stories
- As a user, I want to see the full detail of a waterfall item when I click it so that I have context before acting.
- As a user, I want to view 24 months of an item's history so that I can understand how it has changed over time.
- As a user, I want to confirm an item is still correct without editing it so that staleness warnings are cleared quickly.
- As a user, I want to edit a waterfall item from its detail view so that updates are one click away.
- As a user, I want to see per-account savings allocations so that I know where my savings contributions go.

## Acceptance Criteria
- [ ] Selected item value is displayed at 3xl size
- [ ] 24-month history sparkline/graph is displayed below the value
- [ ] ButtonPair shows `[ Edit ]` on the left and `[ Still correct ✓ ]` on the right
- [ ] Still correct button is always the rightmost (affirmative) action
- [ ] NudgeCard appears in the right panel when applicable — one at a time, never stacked
- [ ] NudgeCard contains arithmetic and options only, never a recommendation
- [ ] Savings row expands to show per-account allocations with optional Wealth account link
- [ ] Right panel breadcrumb shows `← Tier / Item` when navigating to item detail

## Open Questions
- [ ] What specific triggers cause a NudgeCard to appear in the overview item detail?
- [ ] Does the 24-month graph show raw values or changes?
