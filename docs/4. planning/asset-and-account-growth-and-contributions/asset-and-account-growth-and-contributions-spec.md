---
feature: asset-and-account-growth-and-contributions
category: overview
status: placeholder
creation_date: 2026-03-31
---

# Asset and Account Growth and Contributions — Spec (Placeholder)

> **Status:** Placeholder — scope defined, full spec not yet written. Run `/write-spec asset-and-account-growth-and-contributions` to elaborate.

---

## Problem

The financial forecast computes net worth and retirement projections by projecting account and asset balances forward. To do this accurately, it needs two kinds of per-item configuration that users currently have no way to set:

1. **Monthly contributions** — for savings, stocks & shares, and pension accounts, a user may be making regular monthly deposits. Without this, projections assume no ongoing input and significantly understate growth.

2. **Growth and depreciation rates** — assets and accounts may grow or shrink at different rates. Property typically appreciates; vehicles typically depreciate; savings accounts earn interest at a rate different from the household default. Users need a way to set per-item overrides.

---

## Scope

### Schema (already migrated — these fields exist)

- `Account.monthlyContribution Float @default(0)` — monthly amount regularly deposited into this account
- `Account.growthRatePct Float?` — per-account annual growth rate override (already existed; UI is the gap)
- `Asset.growthRatePct Float?` — annual appreciation (positive) or depreciation (negative) rate for an asset

### Questions to resolve during full spec

1. **Where does the user set these values?**
   - Option A: Inline edit within the Assets page account/asset rows (most contextual)
   - Option B: A dedicated "manage" modal per item alongside the existing record-balance flow
   - Option C: A settings section for defaults + per-item overrides in the item detail

2. **How is depreciation expressed?**
   - Negative `growthRatePct` (e.g. `-15` for 15% vehicle depreciation) — simple, single field
   - Separate `depreciationRatePct` field — more explicit, avoids negative-number UX

3. **Should contributions be shown on the Forecast page?**
   - The forecast chart could annotate "with £X/mo contributions" — helps users understand the projection
   - Or kept implicit (contributions affect the curve silently)

4. **Household defaults vs per-item overrides**
   - `HouseholdSettings` already has `savingsRatePct`, `investmentRatePct`, `pensionRatePct` as defaults
   - Property and Vehicle currently have no default — what fallback rate applies if `growthRatePct` is null?
   - UK average house price appreciation (~3–4%/yr) could be a sensible seeded default

5. **Are contributions relevant for `Asset` items (property, vehicles)?**
   - Generally no — but mortgage overpayments could be modelled as a contribution to property equity
   - Likely out of scope for V1; property balance is recorded manually via "record balance"

---

## Acceptance Criteria (draft — to be refined during full spec)

- [ ] User can set `monthlyContribution` on any Account (Savings, StocksAndShares, Pension) from the Assets page
- [ ] User can set a growth rate override on any Account from the Assets page
- [ ] User can set a growth/depreciation rate on any Asset (Property, Vehicle, Other) from the Assets page
- [ ] Forecast page immediately reflects updated contributions and growth rates without requiring a page refresh (TanStack Query invalidation)
- [ ] A null `growthRatePct` on an Account falls back to the household default for that asset class
- [ ] A null `growthRatePct` on an Asset results in a flat projection (no growth assumed)
- [ ] Contributions are displayed somewhere on the Forecast page (TBD — annotation or tooltip)

---

## Related Features

- **Assets** — owns the Account and Asset models; this feature adds input UI to those pages
- **Financial Forecast** — consumes `monthlyContribution` and `growthRatePct` from both models to drive projections
- **Household Settings** — owns the class-level default growth rates that per-item overrides fall back to
