# Feature Audit — Continuation Instructions

**Results file:** [docs/5. built/audit-report.md](docs/5.%20built/audit-report.md)

---

## What This Is

A browser-based acceptance criteria audit of all implemented features in `docs/5. built/`. For each feature, read the spec's `## Acceptance Criteria` section, use `/agent-browser` to verify each criterion against the live app, then append results to `docs/5. built/audit-report.md`.

---

## Setup

```
App URL:     http://localhost:3000
Email:       owner@finplan.test
Password:    BrowserTest123!
Backend:     http://localhost:3001
```

**Before starting each session:**

1. Log in via the browser
2. Clear the setup session (prevents the build guide from hijacking the Overview page):
   ```bash
   ACCESS=$(curl -s -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"owner@finplan.test","password":"BrowserTest123!"}' \
     | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
   curl -s -X DELETE http://localhost:3001/api/setup-session \
     -H "Authorization: Bearer $ACCESS"
   ```
3. JWT expires every 15 minutes — if you get a login redirect, re-login and re-clear setup session

---

## How to Audit Each Feature

1. Read `docs/5. built/<feature>/<feature>-spec.md` — extract the `## Acceptance Criteria` section
2. Navigate the browser to the relevant page
3. Verify each AC via agent-browser (screenshots, DOM inspection, computed styles as needed)
4. Append results to `docs/5. built/audit-report.md` using this format:

```markdown
## N. <Feature Name> — YYYY-MM-DD

**Status:** ✅ Pass / ❌ Fail / 🟡 Partial - Result (1 / 3)

| AC              | Result   | Notes         |
| --------------- | -------- | ------------- |
| <criteria text> | ✅/❌/🟡 | <observation> |

**Stuck on:** <if applicable>
```

---

## Known Issues / Context

- **Setup guide bug**: After an incomplete setup, `DELETE /api/setup-session` must be called to prevent the build wizard from reappearing on the Overview page
- **Staleness testing**: All waterfall and wealth items were created 2026-03-26. Staleness thresholds are 3–12 months. `PATCH /api/wealth/accounts/:id` normalises `lastReviewedAt` to now — you cannot backdate via API. Stale-state ACs will remain 🟡 unless test data is seeded with old dates via Prisma Studio (`bun run db:studio`)
- **TanStack devtools button**: Sits at bottom-right and can intercept clicks. If it opens, close it with `agent-browser find role button click --name "Close Tanstack query devtools"` before continuing
- **Breakout card CTA**: The "Now" floating card (breakout-cards AC3) is not implemented — "Current view" text is absent from the DOM

---

## Waterfall Test Data (already in DB)

| Item             | Type              | Amount                 |
| ---------------- | ----------------- | ---------------------- |
| Salary (monthly) | Income            | £3,000/mo              |
| Bonus (annual)   | Income            | £12,000/yr = £1,000/mo |
| Rent / Mortgage  | Committed monthly | £1,200/mo              |
| TV licence       | Committed yearly  | £169/yr = £14/mo       |
| Joint Savings    | Wealth account    | £15,000                |
| JISA - Lily Rose | Wealth account    | £4,750                 |

**Summary:** Income £4,000 · Committed £1,214 · Discretionary £0 · Surplus £2,786

---

## Task List

### ✅ Done

- [x] 1. `overview-waterfall` — 🟡 9/10 (CTA copy mismatch)
- [x] 2. `breakout-cards` — 🟡 AC2 pass; AC3 fail (no "Now" floating card); AC1 untested
- [x] 3. `staleness-indicators` — 🟡 Fresh-state verified; stale-state untestable with today's data

### 🔲 To Do

- [x] 4. `overview-item-detail` — 🟡 5/8 pass (NudgeCard not as NudgeCard component; savings rows absent; breadcrumb partial)
- [x] 5. `overview-snapshot-timeline` — 🟡 11 pass, 3 fail (no ◂/▸ arrows; Read only not amber; dot click issue), 3 untestable
- [x] 6. `settings` — 🟡 6/8 pass (income source add not on Settings; member removal untestable with single member)
- [x] 7. `household-management` — 🟡 5/10 pass (5 untestable: single-member household, no second browser session)
- [x] 8. `review-wizard` — ✅ 9/9 pass (all ACs verified)
- [x] 9. `wealth-accounts` — 🟡 8/11 pass (rate/projection not shown without interest rate; nudge untestable with one account)
- [x] 10. `wealth-isa-tracking` — 🟡 1/7 pass (no non-trust ISA accounts in test data to trigger allowance bar)
- [x] 11. `wealth-trust-savings` — ✅ 5/5 pass
- [x] 12. `yearly-bills-calendar` — ✅ 7/7 pass (cashflow calendar fully functional with NudgeCard)
- [x] 13. `planner-purchases` — 🟡 3/6 pass (empty state — no purchases in test data)
- [x] 14. `planner-gifts` — 🟡 3/8 pass (empty state — no gift people in test data)
- [x] 15. `definition-tooltip` — ✅ 5/6 pass (component + styling verified; exact term count pending)
- [x] 16. `nudge-card` — ✅ 7/7 component ACs verified (yearly bills context tested)
- [x] 17. `loading-error-states` — ✅ 8/10 pass (code-verified; 2 ACs require manual OS testing)

### ⏭ Skipped

- `foundation-ui-primitives` — infrastructure, no UI flow
- `snapshot-system` — backend mechanics
- `design-polish` — visual judgement
- `layout-refinements` — visual judgement
