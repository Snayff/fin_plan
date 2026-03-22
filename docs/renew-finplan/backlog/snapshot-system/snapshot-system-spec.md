---
feature: snapshot-system
status: backlog
priority: high
deferred: false
phase: 10
implemented_date:
---

# Snapshot System

## Intention
Snapshots let users track their financial progress over time by preserving point-in-time records of their plan. They provide a history without requiring manual effort, and serve as the output of the review wizard.

## Description
Named, timestamped snapshots are created automatically at key moments (1 Jan each year, review wizard completion, significant value changes) or manually. Snapshots are read-only. Per-item history (24 months) is independent of snapshots and always available.

## User Stories
- As a user, I want snapshots created automatically at key moments so that I have a history without manual effort.
- As a user, I want to manually save a snapshot at any time so that I can capture a meaningful moment.
- As a user, I want to give snapshots meaningful names so that I can identify them in the timeline.
- As a user, I want 24 months of per-item history available at all times, independent of snapshots, so that individual item changes are always visible.

## Acceptance Criteria
- [ ] Auto-creation triggers: 1 January each year, Review Wizard completion, significant value change, manual via `[+ Save snapshot]`
- [ ] Snapshot names are unique per household
- [ ] Auto-generated names are reserved and cannot be reused for manual snapshots
- [ ] Snapshots are read-only — no editing possible in snapshot mode
- [ ] Per-item history shows 24 months regardless of current snapshot view
- [ ] Timeline shows snapshot dots; gap navigation with ◂ / ▸
- [ ] Snapshots can be renamed and deleted in Settings

## Open Questions
- [ ] What constitutes a "significant value change" that triggers an automatic snapshot?
- [ ] What are the reserved auto-generated name formats (e.g. "Jan 2026 — Auto")?
- [ ] Is there a maximum number of snapshots per household?
