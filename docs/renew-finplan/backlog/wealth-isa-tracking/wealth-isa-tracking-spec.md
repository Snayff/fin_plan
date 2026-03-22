---
feature: wealth-isa-tracking
status: backlog
priority: medium
deferred: false
phase: 8
implemented_date:
---

# Wealth — ISA Tracking

## Intention
UK residents have an annual ISA allowance that resets each April. Users need to track their remaining allowance per person to avoid exceeding the limit and to make the most of tax-free savings.

## Description
An allowance bar in the Wealth page showing per-person ISA contribution versus the annual limit, remaining allowance, and the April 5th deadline. Nudges appear when a person is approaching or at their limit.

## User Stories
- As a user, I want to see how much of my annual ISA allowance I have used so that I don't accidentally exceed the limit.
- As a user, I want to see the remaining allowance and deadline so that I can plan contributions before the tax year ends.
- As a user, I want a nudge when I am approaching or at my ISA limit so that I can make informed decisions.
- As a household with multiple members, I want separate ISA bars per person so that each person's allowance is tracked independently.

## Acceptance Criteria
- [ ] ISA allowance bar shown per person (not per household)
- [ ] Bar shows used amount, remaining amount, and total allowance
- [ ] April 5th deadline is shown with the bar
- [ ] Allowance resets on April 6th each year (UK tax year boundary)
- [ ] Nudge shown when approaching the limit (threshold TBD) and when at the limit
- [ ] Multiple household members each have their own independent bar
- [ ] ISA tax year is configurable in Settings

## Open Questions
- [ ] What is the "approaching" threshold — 90% used? Should it be configurable?
- [ ] Does the ISA bar appear in a Savings sub-section or at the top of the Wealth page?
- [ ] Is the current allowance amount (£20,000) hardcoded or pulled from Settings?
