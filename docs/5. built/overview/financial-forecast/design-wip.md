# Financial Forecast — WIP Design

> **Status: Parked — pending assets feature**
> This page captures early design thinking for the Forecast feature. It cannot be fully designed or implemented until the assets feature (wealth accounts, growth rates) is complete, as projections require asset balances and user-configurable growth rates.

---

## What this feature is

A dedicated **Forecast** page — separate from Overview — that answers the question: _"Where will my finances be in the future if I stay on this course?"_

The Forecast page is forward-looking. Overview shows the current plan. Forecast shows that plan projected over time with user-set assumptions.

---

## Scope (when unblocked)

### Metrics to project

| Metric                            | Source data needed                                      | Notes                                         |
| --------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Surplus accumulation              | Current monthly surplus × N months                      | Computable today                              |
| Savings account projected balance | Account balance + interest rate + monthly contributions | Needs assets feature                          |
| Net worth projection              | Sum of per-account projections + static illiquid assets | Needs assets feature                          |
| Real vs. nominal toggle           | Any projection + inflation rate                         | Needs `inflationRatePct` in HouseholdSettings |

### Growth rate approach (TBD)

For investments and pensions, a user-configurable growth rate is needed. Two options to evaluate when designing:

- **Per-account `growthRate` field** on `WealthAccount` — more precise, more effort for the user
- **Global per-class defaults in HouseholdSettings** — lower friction, less control

Property and vehicles: no projection. Static balance only.

### Time horizons

User selects a horizon: **1y / 3y / 5y / 10y**. This drives all projections on the page.

### Inflation

A single global rate, stored in `HouseholdSettings.inflationRatePct` (default: 2.5%). User can override. Applied to produce the "real" line on any chart.

---

## What needs to be built first

1. **Assets feature** — WealthAccount UI (create, edit, update balance), asset class management, balance history. Without this, there is no asset data to project.
2. **Growth rates** — Decision on per-account vs. per-class approach, with appropriate UI in either the account detail or Settings.
3. **`inflationRatePct`** in HouseholdSettings schema + Settings UI.

---

## Design direction (early thinking, not final)

- Dedicated page in main nav, sitting after Surplus
- Ambient glow: primary teal (surplus) at top-right, secondary income blue at bottom-left — bridging the "money working for you" concept
- Time horizon selector as the primary control (persistent, top of page)
- Charts use cool-toned single colour fills with gradient fades — not tier colours (this is a cross-tier view)
- Real vs. nominal toggle on charts — default nominal, real as secondary
- No red/green on projected values — neutral treatment throughout
- Projection lines get a dashed treatment beyond ~3 years to signal increasing uncertainty without being alarming

---

## Open questions (to resolve at design time)

- Does the Forecast page live in the main nav or is it accessed from the Overview right panel via a "View forecast ▸" link?
- Is the chart a single compound line (net worth) or separate per-tier lines?
- How do we communicate "this is a projection, not a guarantee" without being anxiety-inducing?
- Should there be a scenario tool (e.g. "what if my income drops £500/month")?
