---
feature: settings
status: backlog
priority: medium
deferred: false
phase: 12
implemented_date:
---

# Settings

## Intention
Users need to configure household-specific parameters that affect calculations, thresholds, and display across the entire app. Settings centralise configuration that doesn't belong in the waterfall or wealth views.

## Description
A settings page covering: income source management, staleness thresholds, surplus benchmark, ISA tax year, household member management, snapshot management, trust account names, and access to the waterfall rebuild wizard.

## User Stories
- As a user, I want to configure staleness thresholds so that warnings appear at the right frequency for my lifestyle.
- As a user, I want to manage my income sources so that I can add, edit, or archive them as my situation changes.
- As a user, I want to manage household members and invites so that the right people have access to our shared plan.
- As a user, I want to rename and delete snapshots so that my history is clearly labelled and tidy.
- As a user, I want to configure trust account beneficiary names so that held-on-behalf accounts are correctly labelled.

## Acceptance Criteria
- [ ] Income sources: add, edit, archive
- [ ] Staleness thresholds: configurable (per-tier or global — see open questions)
- [ ] Surplus benchmark: configurable threshold that triggers the surplus warning indicator
- [ ] ISA tax year: configurable April start date
- [ ] Household management: member list, roles, invite generation, member removal
- [ ] Snapshot management: view all snapshots, rename, delete
- [ ] Trust accounts: add and manage "held on behalf of" beneficiary names
- [ ] Waterfall rebuild wizard: trigger accessible from settings

## Open Questions
- [ ] Are staleness thresholds set per-tier (income vs bills vs discretionary) or as a single global value?
- [ ] Is the surplus benchmark the same as the 10% warning threshold on the overview, or a separate configurable value?
- [ ] Can income sources be deleted, or only archived?
