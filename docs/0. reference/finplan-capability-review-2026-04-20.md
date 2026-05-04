---
title: finplan Capability Review
date: 2026-04-20
branch: stage
reviewer: Claude (Opus 4.7 — 1M context)
methodology: desk review (docs + code) + hands-on dogfood (agent-browser)
---

# finplan Capability Review — 2026-04-20

> Holistic review of finplan's current state against its stated vision and objectives. Scores each capability /10, evidences the score, and lists prioritised next steps.
>
> **Not a code audit.** The bar is "does this capability realise the product we said we were building?" The yardstick is `docs/2. design/design-anchors.md` + `docs/2. design/design-philosophy.md`.

---

## TL;DR

- **Design identity is the strongest thing finplan has.** Tier colours, dark-only palette, amber-only attention, non-advisory tone, plan-not-ledger vocabulary, and the left-panel Income→Committed→Discretionary→Surplus cascade are all disciplined and on-vision. The design system scores 9/10.
- **The waterfall tiers themselves are about 60% realised.** Schemas and CRUD exist everywhere; the _experience_ is thin — no cashflow calendar, no ISA allowance surface, no member attribution UI, no link-to-account flow. Users can plan money; they can't yet see the mechanics the anchors promise.
- **Temporal surfaces are the biggest underdelivery vs anchor.** Snapshot timeline isn't visible on Overview in the empty state. Forecast has the scaffolding but the retirement view, monthly-contribution stat, and net-worth chart body are empty or pending. Goals is a "Coming soon" stub with a blank left panel.
- **Cross-cutting infrastructure is quietly strong.** 72 `audited()` calls across 18 services, zero `householdId` URL-param leaks, JWT rotation + reuse detection, comprehensive glossary. Audit, help, and staleness are the three best-realised cross-cutting capabilities.
- **Two real anchor violations worth flagging now:**
  1. `auth.routes.ts:180` returns a 404 on a login-adjacent path — this can leak account existence and violates the generic-auth-messages convention.
  2. Twelve backend route files still use `reply.status().send()` for error responses instead of throwing the CLAUDE.md-mandated `AppError` hierarchy.
- **Nothing I found violates the anchor that financial values must never be red or green.** Colour discipline across the app is genuinely tight.

---

## Scoring Rubric

| Score   | Meaning                                                                   |
| ------- | ------------------------------------------------------------------------- |
| **0–2** | Missing or broken.                                                        |
| **3–4** | Partial skeleton. Core flow exists but major gaps or an anchor violation. |
| **5–6** | Functionally usable but incomplete.                                       |
| **7–8** | Solid realisation. Respects anchors, minor gaps.                          |
| **9**   | Near-complete. Considered and on-vision.                                  |
| **10**  | Fully realised.                                                           |

Each capability gets a **Coverage** sub-score (is it built?) and a **Realisation** sub-score (does it deliver the vision?). Headline is the average, rounded.

---

## Aggregate Heatmap

| #   | Capability                 | Cov | Real | **Score** |
| --- | -------------------------- | --- | ---- | --------- |
| 1   | Income tier                | 6   | 7    | **7**     |
| 2   | Committed spend tier       | 5   | 6    | **5**     |
| 3   | Discretionary spend tier   | 6   | 6    | **6**     |
| 4   | Surplus tier               | 6   | 6    | **6**     |
| 5   | Overview (waterfall view)  | 6   | 7    | **7**     |
| 6   | Snapshots & history        | 6   | 5    | **6**     |
| 7   | Forecast                   | 5   | 6    | **6**     |
| 8   | Goals                      | 1   | 2    | **1**     |
| 9   | Assets & net worth         | 4   | 5    | **5**     |
| 10  | Review wizard              | 8   | 8    | **8**     |
| 11  | Nudges & opportunities     | 3   | 5    | **4**     |
| 12  | Gifts planner              | 8   | 8    | **8**     |
| 13  | Purchases planner          | 6   | 6    | **6**     |
| 14  | Household & multi-member   | 7   | 7    | **7**     |
| 15  | Auth & session lifecycle   | 7   | 6    | **7**     |
| 16  | Settings                   | 7   | 7    | **7**     |
| 17  | Financial literacy & help  | 8   | 8    | **8**     |
| 18  | Design system & UI polish  | 9   | 9    | **9**     |
| 19  | Staleness & freshness      | 8   | 8    | **8**     |
| 20  | Audit log & data integrity | 8   | 8    | **8**     |
| 21  | Security posture           | 7   | 6    | **6**     |
| 22  | Performance & resilience   | 6   | 7    | **7**     |
| 23  | Accessibility              | 4   | 5    | **4**     |
| 24  | Mobile experience          | 1   | 1    | **1**     |

**Mean:** 6.0 / 10 · **Median:** 6.5 / 10

Colour legend (informal): 8–10 strong · 6–7 solid-but-gappy · 4–5 half-built · 0–3 missing.

---

## Capability-by-capability

### 1. Income tier — 7/10

_Coverage 6 · Realisation 7_

**What works**

- Full CRUD via `apps/backend/src/routes/waterfall.routes.ts` `/income` endpoints, cadence enum supports monthly/annual/quarterly/weekly/one_off
- `IncomePage.tsx` renders via shared `TierPage` with tier colour and empty-state copy
- Subcategories seeded at household creation (Salary / Dividends / Other)
- Empty-state copy is informational, non-advisory: "What income do you earn? Employment income, take-home pay"
- Staleness amber dot and lifecycle states (future / expired) work on item rows

**Gaps**

- **No `docs/5. built/income/` folder exists** — every other tier has a spec folder; Income shipped undocumented
- **Member attribution UI is missing.** `memberId` exists in the schema but there's no form field or display for "whose income is this?" — a concrete gap for the multi-member household anchor
- **Copy bug in Add Income modal:** placeholder reads `e.g. Netflix, Council Tax` — those are bill examples copied from the Committed form

**Next steps (prioritised)**

1. Add a Member field to the income add/edit form and surface the member name on each income row (unlocks correct attribution in Forecast retirement view later)
2. Fix the placeholder copy bug in the Add Income modal (trivial)
3. Write a proper `docs/5. built/income/` spec — at minimum a one-pager documenting what shipped

---

### 2. Committed spend tier — 5/10

_Coverage 5 · Realisation 6_

**What works**

- 7 committed subcategories seeded (Housing, Utilities, Services, Charity, Childcare, Vehicles, Other)
- `/monthly` and `/yearly` endpoints both live, `monthlyAvg12` field computed server-side (the ÷12 pot value, conceptually)
- Full Waterfall view at `/waterfall#committed` shows a `/month` column — the pot value is actually there, just unlabelled

**Gaps (anchor-level)**

- **Yearly bills calendar UI is completely unbuilt.** `docs/5. built/committed/yearly-bills-calendar/` is a spec, but there's no `CashflowCalendar.tsx` in the frontend. This is the visual expression of anchor #15 (÷12 virtual pot model) — without it, the user can't see _when_ bills fall or whether their pot is short
- **Shortfall detection is server-side only.** `cashflow.service.ts` can compute pot-vs-bills shortfalls, but nothing surfaces an amber nudge on `/committed` when a shortfall is projected
- **"Pot" is never labelled** — users see `/mo` columns but have no UI vocabulary for the amortised-bill concept they're looking at

**Next steps (prioritised)**

1. Build `CashflowCalendar.tsx` and wire it into the right panel of `/committed` (spec is already written — this is a large but well-defined job)
2. Add an amber shortfall nudge on the Committed left panel when the projected pot balance dips below upcoming bills in the next 90 days
3. Add a small hover-tooltip on the `/month` column explaining the ÷12 amortisation — a single sentence makes the invisible-by-design pot visible

---

### 3. Discretionary spend tier — 6/10

_Coverage 6 · Realisation 6_

**What works**

- 6 subcategories seeded including the special Savings subcategory
- `linkedAccountId` migration **is live** (`20260419000000_add_contribution_link_and_asset_rate_defaults`) — the schema for asset-contribution linking already exists
- Planner-owned items (Gifts-managed) carry an `isPlannerOwned` flag
- Gifts and Purchases planners are their own first-class surfaces (see #12, #13)

**Gaps**

- **No "Link to account" UI on Discretionary items yet.** Schema is ready, UI isn't. Acceptance criteria in `docs/4. planning/asset-and-account-growth-and-contributions-spec.md` remain unimplemented at the form level
- **Savings subcategory lock is inconsistent.** In dogfood I observed that the header `+ Add` button is removed on the Savings tab, but the empty-state `+ Add` card still works. Pick one behaviour
- **No year selector at the planner page level** (year toggling exists inside Gifts but not Purchases or Discretionary generally)

**Next steps (prioritised)**

1. Build the "Link to account (optional)" dropdown in the Discretionary item edit form (scoped to Savings subcategory, listing Savings/S&S/Pension accounts only) — this lands the top of the in-flight asset-contribution feature
2. Fix the Savings-lock inconsistency — remove the empty-state `+ Add` card when the subcategory is locked so the lock signal is coherent
3. Add "Monthly contributions" read-only badge on items that are linked, using the normalised amount formula from the spec

---

### 4. Surplus tier — 6/10

_Coverage 6 · Realisation 6_

**What works**

- Left-panel cascade (Income balance → Committed remaining → Discretionary remaining → Surplus) visually reinforces anchor #14
- All four `WealthAccount` types exist in the schema (Current / Savings / StocksAndShares / Pension)
- ISA schema support (`isISA`, `isaYearContribution`, `ownerId`) is in place
- Trust-account schema (`isTrust`, `trustBeneficiaryName`) is in place
- Forecast service accumulates surplus as `monthlySurplus * 12 * year`

**Gaps**

- **ISA allowance bar UI is absent.** The endpoint exists (`/api/wealth/isa-allowance`) but no visual indicator surfaces "£X of your £20k 2025/26 allowance used" on `/surplus` — this is one of the flagship "arithmetic-only guidance" moments the product was supposed to deliver
- **Trust-accounts section on Wealth left panel is unbuilt**
- **Surplus formula is not made explicit.** The right panel shows "£0 left over" but never writes `Income − Committed − Discretionary = Surplus` — the cascade communicates it visually but a line of copy would close the loop
- **Borderline advisory copy on `/surplus`:** "At the end of each month, you should have £0 left over." The word "should" here means "the arithmetic says you will", but it reads uncomfortably close to the banned "you should…" pattern. Rewrite

**Next steps (prioritised)**

1. Build the per-person ISA allowance indicator on `/surplus` (or in the Wealth/Surplus right panel) — the £20k/year UK cap is hardcoded in the spec; this is small and high-signal
2. Rewrite the "you should have" copy to "Each month you'll have £0 left over" — micro-change, real anchor impact
3. Surface trust accounts in a dedicated "Held on behalf of" panel section with the trust beneficiary name

---

### 5. Overview (waterfall view) — 7/10

_Coverage 6 · Realisation 7_

**What works**

- Left panel cascade works beautifully — "minus committed", "minus discretionary", "equals surplus" text between the tier bars is a genuine design strength
- Four tier-coloured summary cards (cyan/indigo/purple/teal) on the right
- Tier drill-down works — clicking a tier routes to item-detail
- Tooltip-linked glossary markers integrated

**Gaps**

- **No snapshot timeline visible on `/overview` in the empty state.** The spec puts a timeline of dots on Overview; dogfood saw zero. This is either gated on having 1+ snapshots, or simply not wired on this page — either way, it's a hole
- **Waterfall Sankey / doughnut visualisation is backlog** — design approved, not built. The central canvas feels under-used with sparse data
- **No "Net Worth" value when no wealth accounts** — the card shows "£—" which is fine, but no CTA to add an account

**Next steps (prioritised)**

1. Make the snapshot timeline unconditionally visible on `/overview` (show "No snapshots yet — one will be created tomorrow" when empty) so users understand the timeline concept
2. Ship the Sankey visualisation for the central canvas — it's the literal expression of the waterfall identity anchor
3. Add a Net Worth CTA card when no wealth accounts exist ("Add your first account →")

---

### 6. Snapshots & history — 6/10

_Coverage 6 · Realisation 5_

**What works**

- Daily auto-snapshot on first waterfall load (`ensureTodayAutoSnapshot`), plus Jan 1 auto-snapshot
- `SnapshotDot.tsx` respects the dashed-vs-solid anchor-exception (auto vs manual)
- `ItemDetailPanel.tsx:57` honours read-only mode when `snapshotDate != null`
- Auto-snapshots are protected against delete/rename with 403 responses
- Full CRUD endpoints on `/api/snapshots`

**Gaps**

- **Timeline isn't visible in dogfood** — the feature exists in code but appears not to render on `/overview` under the empty state
- **Page-level `viewingSnapshot` context is weak.** `ItemDetailPanel` gates on `snapshotDate`, but there's no confirmation a consistent read-only "you are viewing history" banner appears across every right panel when a past snapshot is selected
- **No "snapshot list" UI** in Settings — snapshot rename and delete are spec'd but the UI entry point wasn't visible in dogfood

**Next steps (prioritised)**

1. Debug why the timeline is invisible on `/overview` (render behind a feature flag? data gating bug?) — fix so users can see the history they already have
2. Add a global "Viewing snapshot from [date] — editing disabled" banner that appears on every panel when a historical snapshot is selected
3. Expose snapshot management (rename/delete manual snapshots) in Settings

---

### 7. Forecast — 6/10

_Coverage 5 · Realisation 6_

**What works**

- Cashflow and Growth split as left-panel tabs — 12-month cashflow with TODAY marker, starting/projected/dip/average KPIs
- Time horizon selector (1y/3y/10y/20y/30y)
- Growth chart accumulation cards for Surplus / Savings / S&S / Retirement
- Forecast service supports per-account growth rates, depreciation, and real/nominal lines
- Header copy is informational ("Link accounts to anchor your cashflow"), not advisory

**Gaps**

- **Retirement view is backlog** — blocked on the Assets build-out
- **No "Monthly contributions" stat** — the acceptance criterion for the in-flight asset-contribution feature
- **Net Worth chart body is essentially empty** without accounts — need a more informative empty state
- **Real/nominal toggle not surfaced clearly** in dogfood

**Next steps (prioritised)**

1. Ship the "Monthly contributions: £X /mo" stat row on the Growth chart as specified — depends on Discretionary→Savings link landing first
2. Build the Retirement view (per-member stacked area, breakeven markers) — largest single unlock for the Forecast capability
3. Improve the empty-state Net Worth chart with an "Add an account to see your projection" CTA

---

### 8. Goals — 1/10

_Coverage 1 · Realisation 2_

**What works**

- The page route exists (`/goals` → `GoalsPage.tsx`)

**Gaps**

- **Stub only.** Right panel says "Coming soon — Goal planning and tracking will be available in a future update." Left panel is empty (violates the design-system rule that every left panel has content)
- No spec in `docs/5. built/` or `docs/4. planning/`
- No goals schema, no routes, no service

**Next steps (prioritised)**

1. Decide whether Goals is a v1 feature at all — if no, remove the nav entry and the page, don't ship a blank left panel. If yes, write a spec first
2. If kept in-nav as a teaser: at minimum fill the left panel with the "Goals coming soon" language + a waitlist or feedback link, so the screen doesn't feel broken
3. If pursued as a feature: start with a spec that defines Goals as _waterfall targets_ (e.g. "surplus ≥ £1,000/mo by Dec") to keep it consistent with the plan-not-ledger anchor, not a separate savings ledger

---

### 9. Assets & net worth — 5/10

_Coverage 4 · Realisation 5_

**What works**

- Clean two-panel layout with correct groupings: Assets (Property/Vehicle/Other) + Accounts (Current/Savings/Pension/S&S/Other)
- Empty-state CTA "Add your first Property" is clear
- Migration for `propertyRatePct`, `vehicleRatePct`, `otherAssetRatePct` defaults appears staged (per the 2026-04-19 migration name)

**Gaps**

- **Household-default growth rate settings not surfaced** in Settings UI
- **Null-asset-rate fallback to household default** acceptance criterion not verified in UI
- **No "received contributions" popover** on accounts (depends on Discretionary link)
- **Member → Pension mapping not visible** in the Assets UI

**Next steps (prioritised)**

1. Add the household default growth-rate fields to Settings → Growth rates (matches `HouseholdSettings.propertyRatePct` / `vehicleRatePct` / `otherAssetRatePct`)
2. Ship the "received contributions" subtitle + popover on accounts once the Discretionary link is built (capability #3 step 1 is the precondition)
3. Surface pension-to-member ownership (required for per-member retirement projections later)

---

### 10. Review wizard — 8/10

_Coverage 8 · Realisation 8_

**What works**

- Full-screen layout (correctly exempt from the two-panel rule per anchor #17)
- Six steps (Income / Monthly Bills / Yearly Bills / Discretionary / Summary) with resumable sessions via `ReviewSession` model
- Stale items surfaced first within each step
- "Still correct" action lets users confirm without editing — the single most anchor-respecting interaction in the app
- Snapshot is created on completion (closes the loop with capability #6)

**Gaps**

- Minor step-naming inconsistency (spec mentions "Wealth" as step 5, code uses "Summary") — either rename or add the Wealth step
- No "skip this tier" flow in dogfood evidence — worth confirming the wizard handles tiers the user legitimately has nothing in

**Next steps (prioritised)**

1. Reconcile the step list against the spec (either add the Wealth step or update the spec)
2. Add a "nothing changed" bulk-confirm action at the top of each step for fast completion
3. Surface "Last reviewed: N days ago" on a top-level nav affordance so users know when to start a review

---

### 11. Nudges & opportunities — 4/10

_Coverage 3 · Realisation 5_

**What works**

- `NudgeCard.tsx` component is built and polished (Framer Motion fade-in, attention tokens)
- Amber/attention design token discipline is correct
- No stacked nudges observed in dogfood (one at a time is respected where nudges actually render)

**Gaps (anchor-level)**

- **No one-at-a-time enforcement** — the anchor is honoured by convention, not by code. No registry/selector ensures only one nudge renders per panel if multiple hooks return values
- **Only Savings nudge wired** — the other three contextual nudges (Yearly Bills shortfall, Wealth account, Cashflow Calendar) have stub hooks returning null
- `useSavingsNudge()` and `useWealthAccountNudge()` explicitly defer to a future Assets re-implementation

**Next steps (prioritised)**

1. Build a `useActiveNudge(panel)` selector that takes a priority-ordered list of candidate nudges and returns exactly one — codifies anchor #13 so new nudge types can be added safely
2. Implement the Yearly Bills shortfall nudge (requires capability #2 step 2 as the data source)
3. Implement the ISA allowance nudge on `/surplus` (capability #4 step 1 provides the UI slot)

---

### 12. Gifts planner — 8/10

_Coverage 8 · Realisation 8_

**What works**

- Full CRUD for persons / events / allocations / annual budget
- Two-panel layout with Gifts / Upcoming / Config modes
- Per-person list with planned vs bought vs `£X spent` (correct scoped use of "spent" per anchor #3)
- Over-budget amber signal (`OverBudgetSignal.tsx`) — the only "non-calm" moment that's permitted
- Anchor compliance is tight: the waterfall shows the annual gift **budget**, not the sum of actuals

**Gaps**

- In the dogfood view, "Spent / Planned / Budget" are three columns — a user unfamiliar with the Gifts-exception might interpret "Spent" as a transaction tracker. A one-line tooltip clarifying "Spent here means amounts you've recorded against planned gifts" would help
- No linking from individual gift events to the corresponding Discretionary item (closing the loop between planner and waterfall)

**Next steps (prioritised)**

1. Add the definitions tooltip on "Spent" within the Gifts planner to pre-empt the "is this a ledger?" misread
2. When a gift event is marked bought, optionally reduce the month's discretionary `Gifts` subcategory allocation — or at least show a "vs budget" indicator
3. Consider an "export gift list" action for practical use (birthdays etc.)

---

### 13. Purchases planner — 6/10

_Coverage 6 · Realisation 6_

**What works**

- Status grouping (Scheduled / Active / Done), priority badges, funding sources multi-select
- `PurchaseListPanel` and `PurchaseDetailPanel` are clean and consistent with the design system
- Language compliance: "estimated cost / scheduled / priority" — no "spent / paid" leakage

**Gaps**

- **Routing is unclear** — the planner appears as a sidebar in Discretionary rather than a top-level surface; the spec hints at a Planner page where Gifts and Purchases sit together
- **Gifts section missing from the planner left panel** — spec lists both Purchases and Gifts side by side in a shared Planner sidebar; code has them in different places
- **Year selector behaviour varies between Gifts and Purchases**

**Next steps (prioritised)**

1. Consolidate Gifts and Purchases under a shared `/planner` route with a common left panel, matching the spec — or update the spec to reflect the current split and pick one story
2. Standardise the year selector pattern between the two planners
3. Add a "total planned cost for year" KPI at the top of the Purchases list

---

### 14. Household & multi-member — 7/10

_Coverage 7 · Realisation 7_

**What works**

- Owner/Member role hierarchy
- Household switcher in nav
- 24h invite tokens (no email flow required — matches the minimal-dependencies posture)
- Per-household join flow via `AcceptInvitePage`
- Member removal works
- Recent fix `af81806` wraps the join mutation in `audited()` for proper audit coverage of invite-accepts

**Gaps**

- **Ownership transfer not implemented** (spec has it deferred)
- **Household deletion not implemented**
- **Invite rate-limit spec'd (5/hr) but no dedicated handler found** — relies on the global 500/15m which is not the same thing
- Member-to-tier attribution (who owns this income? who's on this pension?) is inconsistently surfaced in the UI

**Next steps (prioritised)**

1. Implement the per-household 5-invites-per-hour rate limit the spec calls for
2. Surface member attribution consistently across tiers (feeds #1 and #9 next steps)
3. Implement household deletion as an owner-only action with an audit log entry

---

### 15. Auth & session lifecycle — 7/10

_Coverage 7 · Realisation 6_

**What works**

- 15-minute access token in memory (Zustand) + 7-day httpOnly refresh cookie
- Rotation on every refresh + reuse detection
- 30-day absolute cap
- Bootstrap fetch on app load prevents logout-on-refresh
- JWT secret rejection in production for weak secrets
- Global 500 req / 15m per authed user rate limit

**Gaps (anchor-level)**

- **`auth.routes.ts:180` returns a 404 with an explicit error body** — this is the single most concerning finding in the review. Depending on which auth flow it's on, it can leak whether an account exists. Fix and generalise to "invalid or expired token" / "invalid credentials"
- **Session loss observed in dogfood** — direct URL navigation twice bounced to `/login` despite recent auth. Could be agent-browser cookie handling, could be overly-aggressive cookie expiry; worth a real-browser repro before concluding
- **No per-route login-attempt throttling** — only the global rate limit

**Next steps (prioritised)**

1. Audit all four `reply.status(404).send` sites in `auth.routes.ts` and `households.ts` — replace with generic error throws via the `AppError` hierarchy
2. Add a dedicated login-attempt throttle (e.g. 10 failed attempts per 5m per email/IP pair)
3. Manually repro the session-loss observation in a real browser to rule out agent-browser cookie handling

---

### 16. Settings — 7/10

_Coverage 7 · Realisation 7_

**What works**

- Staleness threshold configuration across 6 types (income_source / committed / yearly / discretionary / savings / wealth)
- Surplus benchmark configuration (10% default, matches design-philosophy table)
- ISA year configuration (April 6 UK — anchor #5 respected)
- Member management, snapshot rename/delete, trust account names
- `HouseholdSettings` auto-created on household creation

**Gaps**

- **Household growth-rate defaults (Property / Vehicle / Other) not surfaced** — the fields will exist (migration staged) but there's no UI section
- **Audit log entry point unclear** in dogfood — spec has owner/admin visibility but it wasn't immediately findable in Settings
- **Waterfall rebuild wizard entry point** needs UX treatment

**Next steps (prioritised)**

1. Add the Growth Rates Settings section (household defaults for account classes + asset classes) — unblocks correct forecast behaviour
2. Make the Audit Log entry point in Settings prominent and discoverable
3. Add a "Rebuild waterfall" action as a deliberate, confirmable destructive operation

---

### 17. Financial literacy & help — 8/10

_Coverage 8 · Realisation 8_

**What works**

- 41 glossary terms defined in `docs/2. design/definitions.md`
- Dedicated `/help` page with search, glossary A–Z, concepts section, related-terms linking
- In-app `GlossaryTermMarker` + `GlossaryPopoverContext` + `ConceptDetailView` components
- Entries use lowercase "finplan" correctly
- First entry ("Amortised (÷12)") correctly explains the committed-tier pot concept

**Gaps**

- **"User Manual" section is a "Coming soon" placeholder** — either build a minimal onboarding flow or remove the section
- **Popover entrance animation needs explicit `prefers-reduced-motion` verification** (not confirmed in desk review)
- **Tooltip coverage in-app body text** is patchy — some financial terms in empty states don't have glossary markers

**Next steps (prioritised)**

1. Do a sweep of UI copy and add `GlossaryTermMarker` on every first-use of a glossary term in each page's body text
2. Verify popover entrance animation is skipped under `prefers-reduced-motion`
3. Build even a thin User Manual — a single "Getting started with finplan" walkthrough would replace the stub

---

### 18. Design system & UI polish — 9/10

_Coverage 9 · Realisation 9_

**What works (a lot)**

- 249 `.tsx` component files, 18 component directories
- Full design-token system; **zero** hardcoded hex values found across component code
- Tier colour discipline is tight (income cyan / committed indigo / discretionary purple / surplus teal) and respected everywhere
- Surface elevation hierarchy (surface / surface-elevated / surface-overlay)
- Page headers standardised via `PageHeader`; left panels follow the scroll-structure rule (flex-col h-full + PageHeader + flex-1 overflow-y-auto)
- Ghost add buttons, breakout cards, tier page entry animation, loading/error states, staleness indicators all built and used consistently
- Dashed-border anchor-exceptions (`SnapshotDot` auto-snapshot, `CashflowYearBar` today-marker) are the only exceptions and match the spec

**Gaps**

- Still opportunity to consolidate some variant components (many UI specs landed iteratively — a "design-system pass-2" would be worthwhile but isn't urgent)
- Minor: `critique-fixes` folder suggests known nits are being chipped away iteratively, which is healthy but indicates the polish pass isn't complete

**Next steps (prioritised)**

1. Write a `components/_inventory.md` (or Storybook-equivalent) so the 249 components are discoverable — prevents future duplication
2. Do a final design-polish sweep pairing each page against its design-system rule (left-panel padding, right-panel header height, etc.)
3. Accept that 9 is the realistic ceiling here until more product features exist to style

---

### 19. Staleness & freshness — 8/10

_Coverage 8 · Realisation 8_

**What works**

- `StalenessIndicator` component (amber 5px dot + "14mo ago" label)
- `isStale(lastReviewedAt, thresholdMonths)` utility
- Per-tier thresholds in `HouseholdSettings` (6 types)
- Placement is sensible: tier-level badge in left panel, item rows in right panel, ItemDetailPanel, Wealth accounts
- **Never blocking** — amber only, no disabled states triggered by staleness (anchor #12 respected)
- `stalenessLabel()` returns localised strings ("this month", "N months ago")

**Gaps**

- **No household-level "time since last review" surface** — the Review Wizard exists but nothing surfaces "your plan is N months stale" at the app level
- Staleness thresholds could use inline explanation tooltips in Settings

**Next steps (prioritised)**

1. Surface a small "Reviewed N days ago" chip in the top nav that opens the Review Wizard on click
2. Add tooltip explanations next to each staleness threshold in Settings
3. Consider a single "staleness health" score (not a judgement, an arithmetic summary) on Overview

---

### 20. Audit log & data integrity — 8/10

_Coverage 8 · Realisation 8_

**What works**

- **72 `audited()` calls across 18 services** — coverage is actually broad, not narrow (contrary to my initial grep result which looked at routes only; wraps live at the service layer)
- Coverage spans: assets, cashflow, gifts, household, member, planner, review-session, settings, snapshot, subcategory, waterfall
- Transactional wrapper (fetch-before → mutate → diff → write log atomically)
- Action naming is consistent SCREAMING_SNAKE_CASE
- Role-gated 403 for non-owner/admin access to audit log UI
- UI has filter/search across Who/When/Action/Resource/Changes

**Gaps**

- **Services are covered; I did not verify every service's `audited()` covers every mutation path** — there may be a few create/update/delete paths in those services that bypass the wrapper
- **Snapshot immutability** is enforced at the route level (auto-snapshot protection), but the audit trail for manual-snapshot edits wasn't verified end-to-end in dogfood

**Next steps (prioritised)**

1. Do an internal audit: for each service file, count `audited()` calls vs distinct mutation methods, report any mismatch
2. Add an end-to-end test asserting that every audited action appears in the audit log UI within N seconds
3. Consider exposing the audit log for the current user (self-view) even without owner/admin — a privacy-positive affordance

---

### 21. Security posture — 6/10

_Coverage 7 · Realisation 6_

**What works**

- **`authMiddleware` on 32 route files** (all substantive routes)
- **Zero `req.params.householdId` leakage** — data scoping uses `req.user.activeHouseholdId` everywhere (anchor-critical)
- Strong JWT secret validation (rejects common weak secrets in production)
- Refresh token rotation + reuse detection
- Generic error messages in `errorHandler` middleware
- `ErrorBoundary` on the frontend prevents crash loops

**Gaps (anchor-level)**

- **12 route files use `reply.status().send()` for errors** instead of throwing `AppError` subclasses per CLAUDE.md. Confirmed by sampling — these are real error paths (400/403/404/409), not legitimate 201 responses. `auth.routes.ts:180` (404 leaking account existence) is the most concerning single instance
- **No CSP reported in the codebase** (not checked exhaustively)
- **No dedicated per-route login throttling** beyond the global rate limit

**Next steps (prioritised)**

1. **Highest priority:** Replace all `reply.status(4xx|5xx).send({error})` with throws of the appropriate `AppError` subclass — enforces anchor #"error masking" (generic messages) and unifies error handling. Start with `auth.routes.ts` and `households.ts`
2. Add per-route login-attempt throttling on `POST /auth/login` and password-reset endpoints
3. Add a CSP header via `@fastify/helmet` if not already present

---

### 22. Performance & resilience — 7/10

_Coverage 6 · Realisation 7_

**What works**

- Four-state decision tree pattern (loading → error → empty → data) codified via `PanelError`, `SkeletonLoader`, `StaleDataBanner`, `GhostedListEmpty`
- Shimmer animations respect `prefers-reduced-motion`
- `ErrorBoundary` in place
- Background-refresh fail handled gracefully via `StaleDataBanner` (anchor-consistent: amber, not red)

**Gaps**

- **CLAUDE.md mentions RxDB** — no RxDB imports found; either the CLAUDE.md is out of date or local-first/offline support was deferred. Worth aligning docs to reality
- **No explicit "offline mode" UI** — the app assumes network is available
- **No optimistic update pattern noted** — users may notice mutation latency on slower connections

**Next steps (prioritised)**

1. Update CLAUDE.md to remove the RxDB mention (or add it as a planned capability with a spec)
2. Audit TanStack Query usage for consistent optimistic updates on mutation paths
3. Add an offline indicator chip when the API is unreachable

---

### 23. Accessibility — 4/10

_Coverage 4 · Realisation 5_

**What works**

- `prefers-reduced-motion` respected in `index.css`, `useAnimatedValue.ts`, `utils/motion.ts`
- Some `aria-selected`, `aria-label`, `aria-hidden` usage
- Popovers have specified keyboard behaviour (Escape closes, Tab into content) — spec'd if not fully implemented

**Gaps**

- **Keyboard navigation is explicitly deferred** (`docs/4. planning/_future/keyboard-navigation/`) — no global shortcuts yet beyond Ctrl+K (which exists and works)
- **Semantic HTML audit not done** — no systematic check that headings, landmarks, form labels all hold up
- **No screen-reader testing documented**
- **No colour-contrast check against WCAG AA** documented (dark theme + amber attention probably passes, but not verified)

**Next steps (prioritised)**

1. Commission a one-off WCAG AA contrast audit of the design tokens — fastest way to surface systemic issues
2. Pull `keyboard-navigation-spec.md` forward — even a minimal "Tab through panels, Enter to open detail, Escape to close" implementation is a big win
3. Add `<main>`, `<nav>`, `<aside>` landmarks to the two-panel shell components if not present

---

### 24. Mobile experience — 1/10

_Coverage 1 · Realisation 1_

**What works**

- Nothing — explicitly deferred per anchor #6 and `docs/4. planning/_future/mobile-experience/mobile-experience-spec.md`

**Gaps**

- **Everything** — intentionally, for now

**Next steps (prioritised)**

1. Decide the mobile story: read-only spot-check view vs full responsive? Which pages? Which breakpoint?
2. If read-only: build an Overview-only mobile shell first (highest value/effort ratio)
3. If responsive: start with the two-panel layout shell and push one tier page through as a reference implementation

---

## Cross-cutting themes

### Theme A — "Schemas are ahead of UIs"

Across Discretionary (linkedAccountId migration live, UI absent), Surplus (ISA schema live, allowance bar absent), Assets (rate defaults staged, Settings UI absent), and Forecast (retirement stacked-area pending Assets), the pattern repeats: the data layer is further along than the screens. This is a planning dividend — it means UI work can ship quickly without data migrations — but it also means the user-visible score is systematically below the architectural score until the UIs land.

### Theme B — "Anchor-by-convention, not anchor-by-code"

Several anchors are respected by convention but not enforced by code:

- Nudge one-at-a-time rule (no selector)
- Generic auth error messages (some routes still leak via `reply.status(404)`)
- Plan-not-ledger vocabulary (mostly disciplined, one borderline "you should" on /surplus)

Turning convention into codified guards (lint rules, type-level enum guards, wrapper functions) would make the product more robust to future contributor drift.

### Theme C — "Temporal and empty-state stories are the UX weak points"

Overview in the empty state feels underpopulated; Goals is a stub with a blank left panel; Forecast Net Worth chart body is empty until accounts exist; snapshot timeline isn't visible in the empty state. The happy path is beautiful; the "just signed up" path needs work. This is a high-leverage fix because it's the first impression.

### Theme D — "Cross-cutting infrastructure quietly outruns feature capabilities"

Auth, audit, staleness, help, and the design system are all 7–9. The tier capabilities and temporal surfaces are 5–7. That's actually a healthy ordering for a product in this phase — the scaffolding carries the weight while features catch up — but it means leaning into feature surfaces is where the next leap in overall score will come from.

### Theme E — "Multi-member is half-realised"

The household/invite/role model works. The _consequences_ of multi-membership across the product (member attribution on income, member-linked pensions, per-member ISA allowance surfaces, per-member retirement projections) are missing. Every tier and the Forecast will level up once member attribution is consistently surfaced.

---

## Top 10 next steps overall

Ranked by leverage × effort. "Leverage" = how much the score moves. "Effort" = rough t-shirt estimate.

| #   | Action                                                                                               | Capabilities improved | Leverage                     | Effort |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------- | ------ |
| 1   | Fix inline `reply.status(4xx)` error responses — start with `auth.routes.ts`, extend to the 12 files | 15, 21                | High (real anchor violation) | S      |
| 2   | Build the Yearly Bills Cashflow Calendar UI                                                          | 2, 11                 | High                         | L      |
| 3   | Make the snapshot timeline unconditionally visible on `/overview`                                    | 5, 6                  | High                         | S      |
| 4   | Ship Discretionary → Savings account linking UI (form + popover)                                     | 3, 7, 9               | High                         | M      |
| 5   | Add ISA allowance indicator on `/surplus`                                                            | 4, 11                 | Medium                       | S      |
| 6   | Surface member attribution consistently across tiers                                                 | 1, 7, 9, 14           | High                         | M      |
| 7   | Codify nudge one-at-a-time via `useActiveNudge(panel)` selector                                      | 11 + future nudges    | Medium                       | S      |
| 8   | Either ship or remove the Goals page (don't leave a stub)                                            | 8                     | Medium                       | S-M    |
| 9   | Add household growth-rate defaults section in Settings                                               | 9, 7, 16              | Medium                       | S      |
| 10  | Rewrite "you should have" copy on `/surplus` to arithmetic-descriptive phrasing                      | 4 (anchor)            | Low impact, high symbolism   | XS     |

Together these 10 moves would lift the mean score from ~6.0 to ~7.3 and the median from 6.5 to 7.5, closing most of the gap between "architecture" and "experience" scores.

---

## Appendix — Evidence sources

### Docs consulted

- `docs/2. design/design-anchors.md` — vision yardstick
- `docs/2. design/design-philosophy.md` — 8 core principles
- `docs/5. built/**/*-spec.md` — shipped feature specs (20+ folders)
- `docs/4. planning/asset-and-account-growth-and-contributions/` — in-flight
- `docs/4. planning/_future/` — deferred work (mobile, keyboard-nav, pence-arithmetic, CI)
- `docs/3. architecture/system/auth-session-lifecycle.md` — auth depth

### Code paths cited

- `apps/backend/src/routes/` — 32 route files, 12 with inline error responses
- `apps/backend/src/services/` — 18 files with `audited()` wrappers (72 calls total)
- `apps/backend/prisma/schema.prisma` — Prisma model definitions
- `apps/backend/prisma/migrations/20260419000000_add_contribution_link_and_asset_rate_defaults/` — confirms linkedAccountId migration is live
- `apps/frontend/src/pages/` — all 24 page files visited
- `apps/frontend/src/components/` — 249 `.tsx` component files

### Dogfood artefacts

- `dogfood-output/screenshots/` — 14 page screenshots captured on 2026-04-20
- Agent session continuation ID available on request (agent-browser session)

### Corrections applied during review

- Earlier agent grep reported 1 `audited()` call (routes-only grep); correct count is 72 across services
- Earlier agent flagged "spent" in Gifts as anchor violation; anchor #3 explicitly permits it — removed from the violation list
- `linkedAccountId` was reported "not yet in schema"; migration has in fact landed (2026-04-19) — coverage score adjusted up
