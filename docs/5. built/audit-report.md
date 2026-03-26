# Feature Audit Report

**Date:** 2026-03-25
**Auditor:** Claude (agent-browser)
**App URL:** http://localhost:3000
**Credentials:** owner@finplan.test / BrowserTest123!
**Scope:** 17 of 21 implemented features (4 skipped: foundation-ui-primitives, snapshot-system, design-polish, layout-refinements)

---

<!-- Results appended below as each feature is audited -->

---

## 1. Overview Waterfall — 2026-03-26

**Status:** 🟡 Partial (9/10 pass)

| #   | Acceptance Criterion                                                                               | Result | Notes                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Waterfall displays 4 tiers in order: Income, Committed, Discretionary, Surplus                     | ✅     | All 4 tiers visible in correct order in left panel                                                                      |
| 2   | Left panel is fixed width with a border separator, never scrolls horizontally                      | ✅     | Fixed-width narrow panel with right-side border visible                                                                 |
| 3   | Right panel fills remaining space and shows empty state when nothing is selected                   | ✅     | "Select any item to see its detail" shown when nothing selected                                                         |
| 4   | Empty state shows CTA: "Set up your waterfall from scratch ▸"                                      | ❌     | CTA shows "Build your waterfall" heading with "Get started" button in the Surplus area — copy doesn't match spec        |
| 5   | Surplus benchmark indicator (amber dot + "Below benchmark") when below threshold; absent otherwise | ✅     | Indicator appeared on SURPLUS row when salary reduced to £300 (surplus £86 < 10% of £1,300 income); absent when healthy |
| 6   | Income items support frequency: Monthly, Annual (÷12), One-off                                     | ✅     | All 3 frequency tabs present and functional; Annual £12,000/year showed as £1,000/month                                 |
| 7   | Yearly bills appear in the Committed tier as ÷12 virtual pot values                                | ✅     | TV licence £169/year displayed as "Yearly ÷12 £14" in COMMITTED tier                                                    |
| 8   | WaterfallConnector lines (vertical line + annotation) appear between tiers                         | ✅     | "minus committed", "minus discretionary", "equals" annotations visible                                                  |
| 9   | Tier totals shown next to each tier heading in left panel                                          | ✅     | INCOME £4,000 / COMMITTED £1,214 / DISCRETIONARY £0 / SURPLUS £2,786                                                    |
| 10  | Tier rows use correct colour token (distinct colour per tier)                                      | ✅     | Each tier visually distinct: INCOME purple/violet, COMMITTED blue, DISCRETIONARY lighter, SURPLUS teal                  |

**Additional observations:**

- Left panel shows sub-group totals ("Other", "Monthly bills", "Yearly ÷12") — spec says "tier headings with totals only, no individual items"; implementation is more detailed (likely intentional evolution)
- Edit form for income items briefly shows stale amount after save (shows old value until next interaction) — possible display bug, relevant to overview-item-detail audit
- "Save a snapshot before updating?" modal appears on income value changes — good UX, not in spec

---

## 2. Breakout Cards — 2026-03-26

**Status:** 🟡 Partial (AC2 fully passes; AC3 fails; AC1 not tested)

### AC 1 — Surplus Breakout (MiniWaterfallChart)

🟡 **STUCK** — Only accessible inside the build guide setup flow (summary step). Not tested to avoid disrupting waterfall data. Requires a separate audit pass with a fresh test account in setup mode.

### AC 2 — Net Worth Breakout (WealthLeftPanel)

| Check                                                                                 | Result | Notes                                                                     |
| ------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Panel splits hero (top) / body (bottom)                                               | ✅     | Hero and body sections visible on Wealth page                             |
| Hero violet gradient `linear-gradient(135deg, rgba(139,92,246,0.06)…)`                | ✅     | Computed background-image matches spec exactly                            |
| Hero: `position: relative`, `overflow: visible`, `border-bottom`, rounded top corners | ✅     | `relative overflow-visible rounded-t-xl border-b border-border` confirmed |
| Hero: `padding-bottom: 36px`                                                          | ✅     | `pb-9` = 36px confirmed                                                   |
| Card: `position: absolute`, `bottom: -24px`, `left: 16px`, `right: 16px`              | ✅     | All three computed values match spec                                      |
| Card: `z-index: 3`                                                                    | ✅     | `z-[3]` confirmed                                                         |
| Card: `bg-surface-elevated`, 1px border, `border-radius: 10px`, `padding: 14px 16px`  | ✅     | All match                                                                 |
| Card: `box-shadow: none`                                                              | ✅     | No shadows (dark theme constraint)                                        |
| Card value: JetBrains Mono, 28px, weight 700                                          | ✅     | `font-mono text-[28px] font-bold` with JetBrains Mono                     |
| YTD change: 12px, text-secondary                                                      | ✅     | `text-xs text-muted-foreground` = 12px                                    |
| Body: `padding-top: 36px` to accommodate card overlap                                 | ✅     | `pt-9` = 36px confirmed                                                   |

### AC 3 — Snapshot Timeline "Now" Floating Card

| Check                                                  | Result | Notes                                                              |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| Floating card with "Current view" text above "Now" dot | ❌     | "Current view" text absent from DOM entirely                       |
| Card positioning, border-triangle, z-index             | ❌     | Can't verify — card not present                                    |
| "Now" dot 8px with `action` colour + box-shadow        | 🟡     | "Now" is rendered as a navigation `<button>`, not a positioned dot |

### General ACs

| Check                                          | Result | Notes                                     |
| ---------------------------------------------- | ------ | ----------------------------------------- |
| surface-elevated + 1px border on all breakouts | ✅     | Confirmed for Net Worth card              |
| No shadows                                     | ✅     | box-shadow: none confirmed                |
| Maximum one breakout per view                  | ✅     | Net Worth on Wealth, no conflict observed |

**Stuck on:** AC3 — Snapshot Timeline "Now" floating card not implemented (no "Current view" text in DOM). The "Now" element is a navigation button, not a timeline dot with a floating label card.

---

## 3. Staleness Indicators — 2026-03-26

**Status:** 🟡 Partial — fresh-state behavior verified; stale-state could not be tested (all test data created today, thresholds are 3–12 months)

| AC                                                                              | Result | Notes                                                                                                   |
| ------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `isStale()` — renders nothing when item is not stale                            | ✅     | No amber indicators on any tier row or account row with today's data                                    |
| `isStale()` — renders amber dot + age text when stale                           | 🟡     | Cannot test: all items `lastReviewedAt` = today; PATCH endpoint normalises date, can't backdate via API |
| `stalenessLabel()` returns "Last reviewed: this month" when 0 months            | ✅     | Verified on both Salary item detail and Joint Savings account detail                                    |
| `stalenessLabel()` returns "N months ago" variants                              | 🟡     | Cannot verify with fresh data                                                                           |
| WaterfallLeftPanel tier-level attention badge (● N stale) when ≥1 item stale    | 🟡     | Absent on all tiers as expected (fresh items); could not trigger stale state                            |
| Item row in right panel shows StalenessIndicator (5px amber dot + amber detail) | 🟡     | Not visible (correct — items are fresh)                                                                 |
| ItemDetailPanel shows stalenessLabel text below value                           | ✅     | "Last reviewed: this month" visible in amber position below value on Salary and Joint Savings           |
| Wealth page account row shows amber dot when stale                              | 🟡     | Cannot test — accounts created today                                                                    |
| AccountDetailPanel shows stalenessLabel below balance                           | ✅     | "Last reviewed: this month" shown below £15,000 on Joint Savings                                        |
| Thresholds read from HouseholdSettings.stalenessThresholds                      | 🟡     | Could not test threshold enforcement without stale data                                                 |

**Side-finding:** The setup guide (build wizard) kept reappearing on the Overview page due to an active setup-session in Redis/DB. Cleared via `DELETE /api/setup-session`. This would interrupt a real user's normal overview experience after an incomplete setup.
