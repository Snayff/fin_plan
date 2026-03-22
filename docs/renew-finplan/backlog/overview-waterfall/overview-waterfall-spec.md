---
feature: overview-waterfall
status: backlog
priority: high
deferred: false
phase: 5
implemented_date:
---

# Overview — Waterfall Display

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
- [ ] Waterfall displays 4 tiers in order: Income, Committed (monthly + yearly ÷12), Discretionary, Surplus
- [ ] Left panel is fixed width with a border separator, never scrolls horizontally
- [ ] Right panel fills remaining space and shows empty state when nothing is selected
- [ ] Empty state shows CTA: "Set up your waterfall from scratch ▸"
- [ ] Surplus indicator is shown when surplus falls below 10% of total income
- [ ] Income items support frequency: Monthly, Annual (÷12), One-off
- [ ] Yearly bills appear in the Committed tier as ÷12 virtual pot values
- [ ] WaterfallConnector lines (vertical line + annotation) appear between tiers
- [ ] Tier totals are shown next to each tier heading in the left panel
- [ ] Tier rows use the correct colour token: `tier-income`, `tier-committed`, `tier-discretionary`, `tier-surplus`

## Open Questions
- [ ] Is the 10% surplus warning threshold configurable in Settings, or hardcoded?
- [ ] Does the "Increase savings" link in the surplus row navigate to the Savings row detail, or to the Wealth page?
