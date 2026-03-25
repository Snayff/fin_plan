## Remaining Work

ISA allowance bar, per-person display, and settings configuration are implemented. Outstanding:

- [ ] Allowance bar: show "April 5th deadline" label alongside the bar
- [ ] NudgeCard: surface nudge when approaching ISA limit and when at limit
- [ ] Fix type mismatch: frontend `getIsaAllowance` types the return as `IsaAllowance[]` (array) but backend returns a single object — `AccountListPanel` works around this with `isaTotals[0]` fallback but the types should be corrected
- [ ] New tax year guidance UI: inform user when ISA year has reset and `isaYearContribution` should be reviewed
