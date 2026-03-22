---
feature: planner-purchases
status: backlog
priority: medium
deferred: false
phase: 9
implemented_date:
---

# Planner — Purchases

## Intention
Users want to plan and track intended purchases — things they intend to buy — without conflating them with transactional spending. The planner captures intent and priority, not receipts.

## Description
A purchase list organised by status (planned / done), with a budget that can be manually set or derived from the sum of scheduled items. Each purchase records cost, priority, funding source, and optional notes. A left panel shows the budget total and a warning when planned purchases exceed it.

## User Stories
- As a user, I want to record planned purchases with costs and priorities so that I can decide what to buy and when.
- As a user, I want to link a purchase to a funding source so that I know which account or surplus will cover it.
- As a user, I want to see a warning when my planned purchases exceed my budget so that I'm aware of over-commitment.
- As a user, I want to mark a purchase as done so that I can track what I have already bought.

## Acceptance Criteria
- [ ] Purchases are shown by status: ● planned, ✓ done
- [ ] Each purchase has: name, cost, priority, scheduled flag, funding sources (multi-select), optional account link, status, reason, comment, added date
- [ ] Language uses "budgeted / planned / allocated / expected" — never "spent / paid / charged"
- [ ] Left panel shows: budget total, scheduled total, over-budget warning (red) when scheduled > budget
- [ ] Budget can be set manually or derived from the sum of all scheduled items
- [ ] Right panel (item selected) shows full item detail

## Open Questions
- [ ] What are the valid status enum values beyond planned and done?
- [ ] Can funding sources include both surplus and specific wealth accounts simultaneously?
- [ ] Is "priority" a free text field or an enum (e.g. high / medium / low / want)?
