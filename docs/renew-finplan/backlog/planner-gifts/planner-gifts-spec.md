---
feature: planner-gifts
status: backlog
priority: medium
deferred: false
phase: 9
implemented_date:
---

# Planner — Gifts

## Intention
Gift-giving is a predictable, recurring expense that benefits from advance planning. Users want to budget per person and per occasion so that gifts are thoughtful and financially considered, not a surprise to the budget.

## Description
A gift planner organised by person, with predefined and custom event types, per-person budgets, and a year selector. The default view shows upcoming events chronologically and what is already done this year. A by-person view shows budgets per person. Prior years are read-only.

## User Stories
- As a user, I want to plan gifts by person and event so that I don't forget important occasions or overspend.
- As a user, I want to set a budget per person so that I can manage my total gift spending across the year.
- As a user, I want to add custom events for people so that non-standard occasions are tracked alongside standard ones.
- As a user, I want to view prior years' gift records so that I can reference past spending.

## Acceptance Criteria
- [ ] Default view shows upcoming events chronologically + done this year
- [ ] By-person view lists people with their combined budget
- [ ] Person detail view shows: events list with individual budget and notes
- [ ] Predefined event types: Birthday, Christmas, Mother's Day, Father's Day, Valentine's, Anniversary
- [ ] Custom events support: Annual (user-set date) or One-off (specific date)
- [ ] Year selector `‹ 2025 2026 ›` allows switching years
- [ ] Prior years are read-only
- [ ] Language uses "budgeted / planned / allocated" — never "spent"

## Open Questions
- [ ] Can a gift event have multiple line items with individual costs, or just a single budget figure?
- [ ] Are gift budgets linked to the waterfall discretionary tier, or standalone?
- [ ] Can people in the gift planner be linked to household members?
