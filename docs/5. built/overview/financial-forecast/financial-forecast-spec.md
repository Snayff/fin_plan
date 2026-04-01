---
feature: financial-forecast
design_doc: docs/4. planning/financial-forecast/financial-forecast-design.md
creation_date: 2026-03-30
status: backlog
implemented_date:
---

# Financial Forecast

> **Purpose:** Captures _what_ the feature does and _why_ — user stories, acceptance criteria, and interface-level implementation constraints. This is the input to `/write-plan`. It is intentionally not a technical plan: no Prisma syntax, no route code, no component file paths.

## Intention

Users have no forward-looking view of their finances. The Forecast page answers the questions the waterfall snapshot cannot: "Where will I be in 10 years?", "Will I have enough at retirement?", and "How much surplus will I accumulate if I leave it untouched?" It is a read-only projection surface — it does not ask the user to take action, it gives them a clear forward picture to reason from.

## Description

A dedicated **Forecast** page in the non-waterfall section of the main nav (alongside Goals and Help), displaying three simultaneous projection lenses: net worth, retirement, and surplus accumulation. All three are driven by a shared **time horizon selector** (1y / 3y / 10y / 20y / 30y, default 10y). The page has no editable fields — all inputs come from the waterfall plan, asset accounts, and household settings. Projections are computed on the backend and returned as annual series data.

## User Stories

- As a user, I want to see my projected net worth over time so I can understand how my total wealth will grow.
- As a user, I want to see both a nominal and an inflation-adjusted projection side by side so I can understand the real future value of my wealth without switching views.
- As a user, I want to see each household member's retirement year marked on the net worth chart so I can correlate wealth trajectory with retirement timing.
- As a user, I want to see my cumulative unspent surplus over time so I can understand the value of maintaining my current plan.
- As a user with a household member who has set a retirement year, I want to see a breakdown of projected pension, savings, and stocks & shares wealth at their retirement so I can assess retirement readiness.
- As a user whose household member has not set a retirement year, I want a clear prompt to configure it so I know what to do to see their projection.
- As a user, I want to change the time horizon and have all three charts update simultaneously so I can explore short and long-term scenarios without fragmentation.

## Acceptance Criteria

- [ ] Forecast page is accessible from the main nav in the non-waterfall section (alongside Goals and Help)
- [ ] Page uses `page-accent` (`#8b5cf6`) as its primary title and nav indicator colour; ambient glow matches the non-waterfall page scheme (to be added to the design system when Goals/Help are designed)
- [ ] Time horizon selector offers five options: 1y, 3y, 10y, 20y, 30y; default is 10y
- [ ] Selecting a horizon updates all three charts simultaneously with no page reload
- [ ] **Net worth chart** (full-width, top panel):
  - [ ] Displays two lines: nominal and real (inflation-adjusted)
  - [ ] Starting value is the sum of all current savings, S&S, property, and other account balances (pensions excluded)
  - [ ] Real line uses `HouseholdSettings.inflationRatePct` to deflate nominal values
  - [ ] Retirement year markers appear as vertical dashed lines at each member's retirement year, using `page-accent` (#8b5cf6); marker is only shown if the retirement year falls within the selected time horizon
  - [ ] Stat row below the chart shows: current net worth (today) and projected nominal + real values at the horizon end
  - [ ] Chart uses gradient area fill and runs edge-to-edge within its card (no horizontal padding on the SVG)
- [ ] **Surplus accumulation chart** (bottom-left panel):
  - [ ] Displays cumulative unspent surplus as a single area line
  - [ ] Calculation is purely additive: monthly waterfall surplus × elapsed months (no interest, no growth)
  - [ ] Monthly surplus is treated as constant at the current plan's surplus figure
  - [ ] Stat row below the chart shows: £0 (today) and total accumulated at the horizon end
  - [ ] Chart uses gradient area fill and runs edge-to-edge within its card
- [ ] **Retirement chart** (bottom-right panel):
  - [ ] Displays one tab per household member
  - [ ] Each tab shows a stacked area chart with three layers: pension (accounts assigned to this member), savings (household aggregate), and stocks & shares (household aggregate)
  - [ ] Legend shows per-component projected values + total at the selected horizon end
  - [ ] Stat row below the chart shows the projected total at the member's retirement year (if within the selected horizon) or at the horizon end (if retirement year is beyond the horizon), with the retirement year labelled
  - [ ] If a member has no `retirementYear` set, their tab shows an empty state: "Set [Name]'s retirement year in Settings to see their projection" with a link to Settings → Household Members
  - [ ] Chart uses gradient area fill and runs edge-to-edge within its card
- [ ] If no wealth accounts exist yet (Assets feature not populated), all charts display a zero/flat projection with a contextual note: "Add assets in the Assets section to see your projection"
- [ ] All monetary values in stat rows use `font-numeric` (JetBrains Mono) with tabular numerals
- [ ] All chart interactions respect `prefers-reduced-motion`
- [ ] While projections are loading, each chart panel shows a skeleton/loading state
- [ ] If the projection query fails, each chart panel shows an inline error state ("Could not load forecast — try refreshing") without crashing the page

## Open Questions

- [ ] When a member's retirement year falls beyond the selected time horizon, should the retirement year marker be suppressed entirely on the net worth chart, or shown at the right edge of the chart with a label indicating it's beyond the current view?

---

## Implementation

> Interface-level constraints for the implementor. Describes _what_ is needed — entities, operations, UI units — without specifying _how_ to build them. `/write-plan` makes the technical decisions (Prisma syntax, route shapes, file paths, component code).

### Schema

No new schema entities are required for the Forecast feature itself. All projection inputs come from entities introduced by the Assets feature. The following fields must be present before Forecast can be built:

- **HouseholdMember**: must have `dateOfBirth` (nullable Date) and `retirementYear` (nullable Int) — delivered by the Assets feature migration
- **HouseholdSettings**: must have `inflationRatePct` (Float, default 2.5), `savingsRatePct` (Float), `investmentRatePct` (Float), `pensionRatePct` (Float) — delivered by the Assets feature migration
- **WealthAccount**: must have `balance` (current balance), `monthlyContribution`, `growthRatePct` (nullable per-account override), `type` (savings / stocksAndShares / pension / property / other), and `memberId` (nullable, for pension accounts) — delivered by the Assets feature

### API

- **Get forecast projections** — accepts `horizonYears` (Zod enum: 1 | 3 | 10 | 20 | 30 — validated in `packages/shared`); returns annual series data for all three lenses in a single response — JWT-protected, household-scoped, read-only; rate-limited to 30 requests/minute per household (projection computation is non-trivial at 30y with many accounts)
  - Net worth series: array of `{ year, nominal, real }` data points
  - Surplus series: array of `{ year, cumulative }` data points
  - Retirement series: per member, array of `{ year, pension, savings, stocksAndShares }` data points plus the member's `retirementYear`
- No mutations — Forecast is a pure read surface

### Components

- **ForecastPage** — page shell; renders the time horizon selector and the three-panel layout; owns the selected horizon state and passes it to all chart panels
- **TimeHorizonSelector** — segmented control with five options (1y / 3y / 10y / 20y / 30y); fires a single state update that drives all three charts
- **ForecastLayout** — three-panel grid: net worth full-width top, surplus bottom-left, retirement bottom-right
- **NetWorthChart** — Recharts area/line chart with nominal and real series; renders retirement year markers as vertical dashed `ReferenceLine` elements in `page-accent`; gradient area fill; edge-to-edge SVG
- **NetWorthStatRow** — displays today's net worth and projected nominal + real at the horizon end
- **SurplusAccumulationChart** — Recharts area chart with cumulative surplus series; gradient area fill; edge-to-edge SVG
- **SurplusStatRow** — displays £0 today and accumulated total at the horizon end
- **RetirementChart** — Radix Tabs wrapper, one tab per household member; each tab renders a Recharts stacked area chart (pension / savings / S&S layers), a legend with per-component values + total, and the retirement stat row; shows `RetirementEmptyState` when member has no `retirementYear`
- **RetirementStatRow** — displays projected total at retirement year (or horizon end if retirement year is beyond horizon), with year label
- **RetirementEmptyState** — empty state panel shown in a member's retirement tab when `retirementYear` is null; includes a link to Settings → Household Members

### Notes

**Projection algorithm — Net worth**

- Starting value = sum of current balances for all accounts of type: savings, stocksAndShares, property, other (pensions excluded)
- For each projected year: each account's balance grows as `balance = balance × (1 + effectiveRate) + (monthlyContribution × 12)`; effective rate = `account.growthRatePct` if set, else `HouseholdSettings` class default (`savingsRatePct` for savings, `investmentRatePct` for S&S, no growth for property/other unless account has an override)
- Net worth at year N = sum of all account balances after N annual growth steps
- Real value at year N = `nominal / (1 + inflationRatePct / 100)^N`

**Projection algorithm — Surplus accumulation**

- Monthly surplus = current waterfall surplus figure (from the live plan; treated as constant for the entire projection)
- Cumulative at year N = `monthlySurplus × 12 × N`
- No compounding or interest. Surplus is unallocated cash — applying a growth rate would imply an investment decision the user hasn't made.

**Projection algorithm — Retirement**

- Pension layer: sum of balances for pension accounts assigned to this member, grown at `pensionRatePct` + contributions
- Savings layer: sum of all household savings account balances, grown at `savingsRatePct` + contributions
- S&S layer: sum of all household S&S account balances, grown at `investmentRatePct` + contributions
- Per-account growth rate overrides apply as in the net worth calculation
- Savings and S&S are household-level aggregates and appear identically in all member tabs; only the pension layer differs per member
- The stat row shows the projected total (pension + savings + S&S) at `retirementYear`; if `retirementYear > currentYear + horizonYears`, the stat row shows the horizon-end value and labels it "at [horizon end year]" rather than "at retirement"

**Retirement markers on net worth chart**

- One `ReferenceLine` per member with `retirementYear` set, rendered as a vertical dashed line in `page-accent` (#8b5cf6) with a label showing the member's first name
- Only rendered if `retirementYear` falls within `[currentYear, currentYear + horizonYears]`
- If two members share the same retirement year, both labels are shown stacked

**Granularity**

- All series data uses annual data points (one per year from year 0 to year N)
- Year 0 = current state (today's balances, £0 surplus accumulated)

**Empty state — no assets**

- If no WealthAccount records exist for the household, the backend returns zero series for all three lenses
- The frontend detects this condition (all values zero) and renders a contextual note inside each chart card: "Add assets in the Assets section to see your projection"
- This is a soft empty state — the charts still render, just as flat lines at zero
