# Goals UX Enhancement — Design

**Date:** 2026-03-09
**Status:** Approved

---

## Context

The Goals feature was recently upgraded with automatic account-driven progress tracking (March 2026). This design addresses the next layer of improvements across three dimensions:

1. **Form usability** — client-side validation, income period context
2. **Engagement** — goal completion celebration, accessible progress display
3. **Robustness** — re-link account recovery, timezone-correct income periods

North star: "Make the future feel understandable, not intimidating." All changes follow the design principles: Clarity over Cleverness, Progress without Pressure, Calm by Default (Energy on Demand).

---

## Changes

### 1. Client-side Validation

**Problem:** All form validation is server-side. Submitting with an empty name or missing required fields requires a full API roundtrip before the user sees feedback.

**Solution:** Wire `createGoalSchema.safeParse()` (existing shared Zod schema) into `GoalForm.tsx` on submit and on blur for key fields. Render `<p className="text-destructive text-sm mt-1">` beneath each affected field.

Fields validated client-side:
- `name` — required, max 100 chars
- `targetAmount` — required, positive number
- `linkedAccountId` — required when `type === 'debt_payoff'`
- `incomePeriod` — required when `type === 'income'`

No new library. Shared schemas already in `packages/shared/src/schemas/goal.schemas.ts`.

---

### 2. Income Period Context

**Problem:** The Monthly/Annually toggle doesn't explain what date range will be counted.

**Solution:** Below the toggle, show the actual computed range using browser local time:
```
Counting transactions 1 Mar – 31 Mar 2026   (monthly)
Counting transactions 1 Jan – 31 Dec 2026   (annually)
```
Styled `text-xs text-muted-foreground`. Computed client-side using `Intl.DateTimeFormat` — no API call.

---

### 3. Accessible Progress Bar

**Problem:** The 3px bar uses colour-only status cues; no ARIA attributes; milestone markers lack labels.

**Changes:**
- Height: `h-[3px]` → `h-1.5` (6px)
- Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label`
- "On track" / "Behind schedule" as text + icon (never icon-only)
- Milestone marker divs: add `title` attributes ("25% milestone", etc.)

---

### 4. Hide Add Contribution for Auto-tracked Goals

**Problem:** "Add Contribution" appears on all goal types including auto-tracked ones (savings, investment, net_worth, income), creating confusion.

**Solution:** Render the button only when `goal.type === 'purchase' && !goal.linkedAccountId`.

---

### 5. Re-link Account Recovery

**Problem:** When a linked account is deleted, the goal shows a warning but offers no recovery. The only option is to delete and recreate the goal.

**Solution:** Add a "Re-link account" button inside the `linkedAccountMissing` warning banner. Clicking opens an account selector modal. On selection, sends `PUT /goals/:id` with `{ linkedAccountId }` and refetches. No backend changes needed — existing update endpoint handles this.

---

### 6. Timezone-Aware Income Periods

**Problem:** Backend uses `startOfMonth(new Date())` which is UTC-based. UK users in BST (UTC+1, April–October) miss the first hour of each month/year.

**Solution:**
- Frontend sends `X-Timezone: <Intl timezone>` header with goal requests
- Backend adds `date-fns-tz` dependency
- `getUserGoalsWithProgress(householdId, timezone = 'UTC')` uses `toZonedTime(now, timezone)` before computing period boundaries

---

### 7. Goal Completion Card State (Persistent)

**Problem:** No visual distinction between a goal at 50% and one at 110%. Completing a goal requires knowing to edit it.

**Solution:** When `progressPercentage >= 100 && status === 'active'`:
- Card border: `border-2 border-success`
- Progress bar: full width, teal
- Header: `<Badge variant="success">Goal reached!</Badge>`
- On-track row replaced with `<Button>Mark Complete</Button>` → sends `PUT /goals/:id` with `{ status: 'completed' }`

Persists until user acts (no auto-archiving).

---

### 8. Celebration Animations

**Trigger:** `GoalsPage` tracks previous `progressPercentage` per goal in a ref. When data refreshes and a goal transitions from `< 100` to `>= 100`, a celebration fires.

**Variants** (5, randomly selected per trigger for surprise and variety):

| # | Name | Implementation |
|---|------|----------------|
| 1 | Confetti burst | Coloured rectangles tumble down |
| 2 | Coin shower | Gold circles rain from top |
| 3 | Star scatter | ★ symbols burst outward from centre |
| 4 | Fireworks pop | 3 radial dot bursts |
| 5 | Balloon float | Ovals drift up with gentle drift |

**Component:** `GoalCelebration.tsx` — `ReactDOM.createPortal` fixed overlay (`pointer-events: none`), auto-unmounts after ~2.8s.

**Dependencies:** Implemented using `framer-motion` (already a project dependency) for all 5 variants — `canvas-confetti` was not added.

---

### 9. Empty State

Align to existing `Card > CardContent p-12 text-center` pattern (same as AccountsPage, TransactionsPage). Verify copy is consistent in tone.

---

## Files Modified

| File | Change |
|------|--------|
| `apps/frontend/src/components/goals/GoalForm.tsx` | Steps 1, 2 |
| `apps/frontend/src/pages/GoalsPage.tsx` | Steps 3, 4, 5, 7, 8, 9 |
| `apps/frontend/src/services/goal.service.ts` | Step 6 |
| `apps/backend/src/routes/goal.routes.ts` | Step 6 |
| `apps/backend/src/services/goal.service.ts` | Step 6 |
| `apps/frontend/src/components/goals/GoalCelebration.tsx` | Step 8 (new) |
| `apps/frontend/package.json` | Step 8 (no new dependency — framer-motion reused) |
| `apps/backend/package.json` | Step 6 (date-fns-tz) |

---

## Verification

1. Submit GoalForm with empty name → inline error, no network call
2. Select income type, toggle period → correct local date range shown
3. Inspect progress bar → `role="progressbar"`, `aria-valuenow` present; status is text + icon
4. Savings goal → no Add Contribution button; manual purchase goal → button present
5. Delete linked account → warning with Re-link button; re-link → progress restores
6. Income goal with BST timezone → counts from local midnight on the 1st
7. Goal at 100% → teal border, "Goal reached!" badge, "Mark Complete" CTA
8. Cross 100% threshold → one of 5 random animations fires and cleans up after 2.5s
9. Click "Mark Complete" → status = completed; no re-celebration
