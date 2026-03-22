---
feature: yearly-bills-calendar
status: backlog
priority: high
deferred: false
phase: 7
implemented_date:
---

# Yearly Bills — Cashflow Calendar

## Intention
Annual bills are smoothed via a virtual pot model (÷12), but users need to see whether their monthly contributions will actually cover each bill when it falls due. The calendar makes timing and shortfalls visible before they happen.

## Description
Accessed from Committed → Yearly row, the cashflow calendar shows a 12-month progression of the virtual pot balance, deducting each bill at its due month. Shortfalls are highlighted and a NudgeCard offers mechanical options to resolve them.

## User Stories
- As a user, I want to see the timing of each annual bill so that I can understand when money leaves my pot.
- As a user, I want to see whether my monthly contributions are sufficient to cover each bill so that shortfalls are visible in advance.
- As a user, I want a nudge offering options when a shortfall is detected so that I know how to fix it arithmetically.

## Acceptance Criteria
- [ ] Accessible from Committed → Yearly row in the waterfall
- [ ] Shows 12-month progression of pot balance
- [ ] Each bill deduction is shown at the correct month with the bill name and amount
- [ ] Pot balance updates month-by-month as contributions accumulate and bills deduct
- [ ] Shortfall months are visually highlighted (amber/red per design system)
- [ ] NudgeCard appears when a shortfall is detected, offering: increase monthly contribution or draw from savings
- [ ] NudgeCard is arithmetic-only — no recommendation about which option to choose

## Open Questions
- [ ] Does the calendar operate on a fiscal year (Apr–Mar) or calendar year (Jan–Dec)?
- [ ] Are bills shown at their exact due date, or rounded to the start of the month?
- [ ] Can the user add/edit yearly bills directly from this calendar view?
