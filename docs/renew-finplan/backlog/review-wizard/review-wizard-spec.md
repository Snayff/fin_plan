---
feature: review-wizard
status: backlog
priority: high
deferred: false
phase: 11
implemented_date:
---

# Review Wizard

## Intention
Financial plans go stale over time. The review wizard gives users a focused, structured process to work through every stale item in one session, keeping the plan accurate and closing with a new snapshot as a record.

## Description
A full-screen 6-step wizard that surfaces stale items by category: Income, Monthly Bills, Yearly Bills, Discretionary, Wealth, and Summary. Each item card offers two actions: update or confirm as still correct. Users can exit and resume. Completing the wizard creates a named snapshot and returns to Overview.

## User Stories
- As a user, I want to review all stale items in one focused session so that I can bring my plan up to date efficiently.
- As a user, I want to confirm unchanged items without editing so that the review moves quickly.
- As a user, I want to exit the wizard and resume it later so that I am not forced to complete it in one sitting.
- As a user, I want a snapshot created when I complete the review so that I have a record of the reviewed state.

## Acceptance Criteria
- [ ] Full-screen mode (exempt from two-panel rule)
- [ ] 6 steps in order: Income, Monthly Bills, Yearly Bills, Discretionary, Wealth, Summary
- [ ] Stale items are shown first within each step
- [ ] Each item card shows `[ Update ]` and `[ Still correct ✓ ]` actions
- [ ] Progress bar and step indicator shown at the top
- [ ] Partial progress is saved; user can exit and resume
- [ ] Step 6 (Summary) shows: changes made, count of unchanged items, new surplus value, editable snapshot name (pre-populated)
- [ ] Completing the wizard creates a snapshot and navigates back to Overview
- [ ] Staleness rules are informational only — no item blocks progression

## Open Questions
- [ ] What triggers the review wizard — manual entry from Overview/Settings only, or can the app prompt based on staleness count?
- [ ] Is there a minimum number of stale items required to enter the wizard?
- [ ] Can items be skipped entirely (not updated, not confirmed)?
