---
feature: wealth-accounts
status: backlog
priority: high
deferred: false
phase: 8
implemented_date:
---

# Wealth — Accounts

## Intention
Users need a single place to view all their financial accounts, understand their total wealth picture, and track how individual accounts are growing over time. This is not a transaction ledger — it tracks balances and intent, not individual transactions.

## Description
The Wealth page left panel shows total net worth, year-to-date change, and accounts grouped by asset class (Savings, Pensions, Investments, Property, Vehicles, Other) with a by-liquidity breakdown. The right panel shows individual account detail: balance, rate, contribution from waterfall, valuation date, 24-month history graph, and projected balance.

## User Stories
- As a user, I want to see all my financial accounts organised by asset class so that I have a complete picture of my wealth.
- As a user, I want to see my total net worth and how it has changed year-to-date so that I can track progress.
- As a user, I want to see a projected balance for each account based on its rate and contributions so that I can plan ahead.
- As a user, I want to record the valuation date of assets so that I know how current the figure is.
- As a user, I want to see a by-liquidity breakdown so that I understand the accessibility of my wealth.

## Acceptance Criteria
- [ ] Left panel shows total net worth + year-to-date change at the top
- [ ] By-liquidity breakdown shows: Cash & Savings / Investments & Pensions / Property & Vehicles
- [ ] Accounts grouped by asset class: Savings, Pensions, Investments, Property, Vehicles, Other
- [ ] Account list shows balance, rate (if applicable), and valuation date per account
- [ ] Right panel (account selected) shows: breadcrumb `← Asset Class / Account Name`, balance, rate, contribution from waterfall, valuation date, projected balance
- [ ] 24-month history graph in account detail
- [ ] Right panel (asset class selected) shows list of accounts in that class
- [ ] Breadcrumb navigation: `← Savings / Tandem ISA`

## Open Questions
- [ ] How are projections calculated for non-rate-bearing assets (property, vehicles)?
- [ ] Is valuation date required or optional when adding an account?
- [ ] Can contributions from multiple waterfall items link to one account?
