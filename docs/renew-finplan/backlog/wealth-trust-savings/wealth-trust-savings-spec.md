---
feature: wealth-trust-savings
status: backlog
priority: medium
deferred: false
phase: 8
implemented_date:
---

# Wealth — Trust Savings (Held on Behalf Of)

## Intention
Some household members hold savings on behalf of others (e.g. a parent managing a child's savings account). These funds need to be tracked and visible without inflating the household's own net worth.

## Description
A dedicated "Held on behalf of" section in the Wealth page for accounts where the household is custodian but not the beneficial owner. Full account tracking features are available, but these accounts are excluded from the household net worth total and clearly labelled with the beneficiary's name.

## User Stories
- As a user, I want to record savings I hold on behalf of someone else so that I can track them alongside my own accounts without mixing them up.
- As a user, I want trust savings excluded from my net worth so that my personal financial picture stays accurate.
- As a user, I want to see the beneficiary's name on trust accounts so that each account is clearly identified.

## Acceptance Criteria
- [ ] Trust accounts are shown in a separate "Held on behalf of" section in the Wealth left panel
- [ ] Trust accounts are excluded from the household net worth total
- [ ] Each trust account displays the beneficiary name as a label
- [ ] Trust accounts have the same features as regular accounts (balance, history graph, projected balance, valuation date)
- [ ] Beneficiary names are configurable in Settings (under Trust accounts)

## Open Questions
- [ ] Can a trust account be linked to a waterfall savings allocation?
- [ ] Can a trust account have an ISA flag and be tracked against an ISA allowance (e.g. JISA)?
- [ ] Is there a limit on how many trust beneficiaries can be configured?
