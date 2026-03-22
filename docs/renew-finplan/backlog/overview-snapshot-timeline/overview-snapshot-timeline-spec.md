---
feature: overview-snapshot-timeline
status: backlog
priority: high
deferred: false
phase: 10
implemented_date:
---

# Overview — Snapshot Timeline

## Intention

Users accumulate a history of financial snapshots over time. The timeline lets them browse that history directly from the overview, loading any past snapshot in read-only mode for comparison.

## Description

A row of clickable dots above the overview, each representing a saved snapshot. Clicking a dot loads the snapshot in read-only mode, replacing the live waterfall view. Gap navigation arrows allow scrolling through a long timeline. A banner clearly marks read-only mode and prevents editing.

## User Stories

- As a user, I want to see my saved snapshots as a timeline above the waterfall so that I can navigate to any point in my financial history.
- As a user, I want to click a snapshot dot to view my finances at that past date so that I can compare it to today.
- As a user, I want the snapshot view to be clearly marked as read-only so that I don't accidentally edit historical data.
- As a user, I want to navigate a long timeline with arrows so that I can reach older snapshots easily.

## Acceptance Criteria

- [ ] Snapshot dots are displayed in a horizontal row above the overview
- [ ] Each dot is clickable and loads its snapshot
- [ ] Loaded snapshot replaces the live waterfall view with the frozen values
- [ ] A read-only banner replaces the timeline navigator when a snapshot is loaded
- [ ] No editing is possible in snapshot mode (all edit actions are hidden or disabled)
- [ ] Gap navigation arrows ◂ / ▸ appear when the timeline is longer than the visible area
- [ ] Returning to live view restores the timeline navigator and edit actions

## Open Questions

- [x] How many dots are visible before scrolling is needed? **All dots are visible; ◂/▸ arrows appear for overflow navigation.** No fixed limit.
- [x] Is there a "return to live view" button, or does clicking outside the timeline work? **"Return to current ▸" button** in the snapshot banner; also clicking [Now] in the timeline exits snapshot mode.
- [x] Do snapshot dots show a label (name/date) on hover? **Yes — truncated snapshot name shown as a label.**

---

## Implementation

### Schema

```prisma
model Snapshot {
  id          String    @id @default(cuid())
  householdId String
  name        String
  isAuto      Boolean   @default(false)
  data        Json      // full serialised WaterfallSummary at creation time
  createdAt   DateTime  @default(now())
  @@unique([householdId, name])
}
```

### API

```
GET    /api/snapshots       → list (id, name, isAuto, createdAt only — not full data)
GET    /api/snapshots/:id   → full snapshot including data
POST   /api/snapshots       → create { name, isAuto? } — data auto-populated by server
PATCH  /api/snapshots/:id   → rename { name } — 409 if name already in use
DELETE /api/snapshots/:id   → delete
```

### Components

- `SnapshotTimeline.tsx` — horizontal dot row; dots positioned proportionally (oldest → today = full width); `[+ Save snapshot]` button always visible; ◂/▸ gap navigation; clicking dot loads snapshot; clicking [Now] clears snapshot
- `CreateSnapshotModal.tsx` — name input pre-populated "Month Year" (editable); 409 → inline error "A snapshot with this name already exists — choose a different name."

### Notes

- In snapshot mode: live waterfall panel replaced by `snapshot.data`; banner "Viewing: {name} · [Return to current ▸]" replaces timeline
- All edit actions (Edit, Still correct) hidden/disabled in snapshot mode
- "Return to current ▸" button OR clicking [Now] exits snapshot mode
- Dots show truncated snapshot name as a label on hover/below
- If no snapshots exist: show only [Now] at right; `[+ Save snapshot]` still visible
- Auto Jan 1 snapshot: waterfall summary endpoint checks on first load of new year; creates "January [YEAR] — Auto" silently if not already present
