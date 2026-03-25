---
feature: review-wizard
status: implemented
priority: high
deferred: false
phase: 11
implemented_date: 2026-03-25
---

# Review Wizard

## Intention

Financial plans go stale over time. The review wizard gives users a focused, structured process to work through every stale item in one session, keeping the plan accurate and closing with a new snapshot as a record.

## Description

A full-screen 6-step wizard that surfaces stale items by category: Income, Monthly Bills, Yearly Bills, Discretionary, Wealth, and Summary. Each item card offers two actions: update or confirm as still correct. Users can exit and resume. Completing the wizard creates a named snapshot and returns to Overview.

## User Stories

- As a user, I want to review all stale items in one focused session so that I can bring my plan up to date efficiently.
- As a user, I want to confirm unchanged items without editing so that the review moves quickly.
- As a user, I want to exit the wizard and resume it later so that I am not forced to complete it in one sitting.
- As a user, I want a snapshot created when I complete the review so that I have a record of the reviewed state.

## Acceptance Criteria

- [ ] Full-screen mode (exempt from two-panel rule)
- [ ] 6 steps in order: Income, Monthly Bills, Yearly Bills, Discretionary, Wealth, Summary
- [ ] Stale items are shown first within each step
- [ ] Each item card shows `[ Update ]` and `[ Still correct ✓ ]` actions
- [ ] Progress bar and step indicator shown at the top
- [ ] Partial progress is saved; user can exit and resume
- [ ] Step 6 (Summary) shows: changes made, count of unchanged items, new surplus value, editable snapshot name (pre-populated)
- [ ] Completing the wizard creates a snapshot and navigates back to Overview
- [ ] Staleness rules are informational only — no item blocks progression

## Open Questions

- [x] What triggers the review wizard — manual entry from Overview/Settings only, or can the app prompt based on staleness count? **Manual only** — triggered from the [Review ▸] button in the Overview page header.
- [x] Is there a minimum number of stale items required to enter the wizard? **No minimum** — wizard can be entered at any time regardless of staleness state.
- [x] Can items be skipped entirely (not updated, not confirmed)? **Yes** — staleness rules are informational only; no item blocks progression to the next step.

---

## Implementation

### Schema

```prisma
model ReviewSession {
  id             String    @id @default(cuid())
  householdId    String    @unique
  currentStep    Int       @default(0)
  confirmedItems Json      @default("{}")  // { itemType: [id, ...] }
  updatedItems   Json      @default("{}")  // { itemId: { from: number, to: number } }
  startedAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

### API

```
GET    /api/review-session   → current session or null
POST   /api/review-session   → create/reset (step 0, empty confirmedItems/updatedItems)
PATCH  /api/review-session   → update { currentStep?, confirmedItems?, updatedItems? }
DELETE /api/review-session   → abandon (delete record)
```

**Data per step:**

```
Step 0 — Income:       GET /api/waterfall/income
Step 1 — Bills:        GET /api/waterfall/committed
Step 2 — Yearly:       GET /api/waterfall/yearly
Step 3 — Discretionary: GET /api/waterfall/discretionary + GET /api/waterfall/savings
Step 4 — Wealth:       GET /api/wealth/accounts
Step 5 — Summary:      derived from session.updatedItems + session.confirmedItems
```

### Components

- `ReviewWizard.tsx` — full-screen overlay (`z-index` over app); `const STEPS = ['Income', 'Bills', 'Yearly', 'Discretionary', 'Wealth', 'Summary']`; progress bar at top; `[✕ Exit]` closes overlay without deleting session

### Notes

**Session lifecycle:**

- On open: `GET /api/review-session`
  - If session exists → resume from `session.currentStep`
  - If no session → `POST /api/review-session` (fresh, step 0)
- On `[✕ Exit]` → close overlay only — do NOT delete session; partial progress preserved
- Session deleted only on "Save & finish" (Step 5) or explicit "Abandon review"

**Item card interactions:**

- "Still correct": `POST /api/waterfall/:type/:id/confirm` → `PATCH /api/review-session` add to `confirmedItems[type]` → mark card resolved (green ✓)
- "Update": expand inline form within card → on submit: `PATCH` item → `PATCH /api/review-session` add to `updatedItems[itemId] = { from, to }` → mark card resolved
- Non-stale items: grouped below stale items, collapsed by default; "Confirm all remaining ({n})" calls `POST /api/waterfall/confirm-batch`

**Step 5 — Summary "Save & finish":**

1. `POST /api/snapshots { name }` (user-editable, pre-populated "Month Year Review")
2. `DELETE /api/review-session`
3. Close wizard
4. Invalidate `['waterfall', 'snapshots']`
