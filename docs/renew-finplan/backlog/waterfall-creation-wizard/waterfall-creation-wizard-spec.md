---
feature: waterfall-creation-wizard
status: backlog
priority: high
deferred: false
phase: 13
implemented_date:
---

# Waterfall Creation Wizard

## Intention
New users face an empty, unfamiliar interface. The creation wizard guides them through building their waterfall step by step, in the correct order, so that their first experience is productive rather than intimidating.

## Description
A 7-step full-screen wizard guiding new users through: household setup, income, monthly bills, yearly bills, discretionary spending, savings allocations, and a summary. The user can exit and resume at any point. Completing the wizard optionally creates an opening snapshot.

## User Stories
- As a new user, I want a step-by-step setup flow so that I can build my waterfall without guessing the right order or format.
- As a user, I want to exit and resume the wizard later so that I am not forced to complete setup in one session.
- As a user, I want an optional opening snapshot at the end of setup so that I have a baseline to compare future snapshots against.

## Acceptance Criteria
- [ ] Full-screen mode (exempt from two-panel rule)
- [ ] 7 steps in order: Household, Income, Monthly Bills, Yearly Bills, Discretionary, Savings, Summary
- [ ] User can exit at any step and resume later with progress preserved
- [ ] Step 7 (Summary) shows all entered data for review before finalising
- [ ] Optional opening snapshot with editable name, pre-populated as "Initial setup — [Month Year]"
- [ ] Completing the wizard navigates to the Overview with the waterfall populated

## Open Questions
- [ ] What triggers the wizard — first login only, any empty waterfall, or also manual trigger from Settings?
- [ ] Can steps be navigated out of order (e.g. go back to Income after reaching Discretionary)?
- [ ] Is the Household step only shown to the first user, or to every new household member?
