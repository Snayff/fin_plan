---
feature: loading-error-states
status: approved
date: 2026-03-24
---

# Loading & Error States — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

No systematic approach to loading, error, and empty states across the frontend. Around eight panels fire queries but handle failures inconsistently — most silently swallow errors, show nothing during load, and render blank space when data is absent. Users have no feedback when something goes wrong, and no way to recover without a full page reload.

## Approved Approach

Introduce three consistent rules — one per data state — applied uniformly across all query-driven panels:

- **Loading**: show `SkeletonLoader` (existing component) until data arrives
- **Error**: show a new `PanelError` component (ghost skeleton behind a blur overlay) for hard failures with no cached data; use the existing `StaleDataBanner` for background refetch failures where the user still sees last-known data
- **Empty**: show `GhostedListEmpty` (existing component) with a contextual CTA

This was chosen over a "global spinner + toast" approach because it keeps the error context local to the panel that failed, which is clearer for users managing multi-panel layouts like the Planner page.

## Key Decisions

| Decision                 | Choice                                                                    | Rationale                                                                            |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Error component style    | Ghost skeleton behind blur overlay, not a coloured alert banner           | Maintains spatial context — user sees where data would be. A banner would lose that. |
| Hard error vs stale data | `isError && !data` → PanelError; `isError && data` → StaleDataBanner only | User should keep seeing last-known data if available — PanelError would occlude it   |
| Retry mechanic           | "Retry" button calls `refetch` directly                                   | Avoids full page reload; consistent with how TanStack Query handles recovery         |
| Error colour             | `--destructive` red for label/button only                                 | Red = app errors, per design system. Not amber (amber = staleness nudges).           |
| Mutation feedback        | Out of scope — toast system is already consistent                         | Scope control: don't touch what's working                                            |

## Out of Scope

- Mutation feedback (toasts) — already solid, no changes needed
- `useStaleDataBanner` hook internals — correct as-is
- `StaleDataBanner`, `GhostedListEmpty`, `SkeletonLoader` component internals — no changes to existing components
- Panels already handling all three states correctly (`AccountListPanel`, `SnapshotsSection`, `OverviewPage` loading state)
- Offline detection or service worker caching

## Visual Reference

- `panel-error-final.html` — final error state design across calendar and list panel variants
- `skeleton-visibility-variants.html` — three opacity/colour variants explored; variant 2 selected
