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
- [ ] How many dots are visible before scrolling is needed?
- [ ] Is there a "return to live view" button, or does clicking outside the timeline work?
- [ ] Do snapshot dots show a label (name/date) on hover?
