# Loading & Error States — Design

**Date:** 2026-03-24
**Status:** Approved

## Problem

No systematic approach to loading, error, and empty states across the frontend. ~8 panels fire queries but handle failures inconsistently — most silently swallow errors, show nothing during load, and render blank space when data is absent. Mutation feedback (toasts) is already solid and is out of scope.

## Decisions

### 1. Loading state

**Rule:** Any panel that fires a query shows `SkeletonLoader` with the appropriate variant until data arrives (`isLoading && !data`).

- **Component:** existing `SkeletonLoader` — `left-panel` or `right-panel` variant (no new component needed)
- **Panels to fix:** `PlannerPage`, `SettingsPage`, `AccountDetailPanel`, `ItemDetailPanel`, `SnapshotTimeline`
- **Already correct:** `OverviewPage`, `WealthPage`, `CashflowCalendar` — untouched

---

### 2. Error state

**Rule:** When a query fails, show `PanelError` inline (new component) **and** the global `StaleDataBanner` via the existing `useStaleDataBanner` hook. Both show simultaneously.

**`PanelError` component (new):**

- Ghost skeleton behind a blur overlay — static (no shimmer), opacity 0.30, colour `#2a3f60`
- Overlay: `rgba(8, 10, 20, 0.70)` background, `backdrop-filter: blur(2px)`
- "Failed to load" label in `--destructive` (`#ef4444`)
- Short contextual message in `--text-muted`
- "Retry" button: `--destructive-subtle` background (`hsl(0, 40%, 15%)`), `--destructive-border` border, `--destructive` text
- Props: `onRetry` (calls `refetch`), `variant` (`left` | `right` | `detail`) for skeleton sizing, optional `message`

**Background refetch failures** (stale data already on screen): `StaleDataBanner` only. No `PanelError` — user keeps seeing last-known data. This distinction is: `isError && !data` → PanelError; `isError && data` → StaleDataBanner only.

**Panels to fix:** `OverviewPage`, `WealthPage`, `PlannerPage`, `SettingsPage`, `CashflowCalendar`, `ItemDetailPanel`, `AccountDetailPanel`, `GiftPersonDetailPanel`

---

### 3. Empty state

**Rule:** When a query succeeds but returns no data (`!isLoading && !isError && data.length === 0`), show `GhostedListEmpty` with a contextual `message` and either a `+` CTA button or guidance text. Never render a blank panel or silent null.

- **Component:** existing `GhostedListEmpty`
- **Panels to fix:** `SnapshotTimeline`, `PlannerPage` (purchases list, gift events list), `SettingsPage` sections that currently render nothing
- **Already correct:** `AccountListPanel`, `SnapshotsSection` — untouched

---

### 4. Documentation

Add a **"Data states"** section to `docs/2. design/design-system.md` with the canonical decision tree:

| State              | Condition                                     | Component                        | Notes                          |
| ------------------ | --------------------------------------------- | -------------------------------- | ------------------------------ |
| Loading            | `isLoading && !data`                          | `SkeletonLoader`                 | left / right / detail variant  |
| Error (no data)    | `isError && !data`                            | `PanelError` + `StaleDataBanner` | `onRetry` = `refetch`          |
| Error (stale data) | `isError && data`                             | `StaleDataBanner` only           | user keeps last-known data     |
| Empty              | `!isLoading && !isError && data.length === 0` | `GhostedListEmpty`               | always include CTA or guidance |
| Success            | `data && data.length > 0`                     | content                          | silence = approval             |

---

## What is NOT changing

- Mutation feedback — toast system is consistent and working well
- `useStaleDataBanner` hook — already correctly watches QueryClient for errors
- `StaleDataBanner` component — correct amber treatment for connectivity failures
- `GhostedListEmpty` and `SkeletonLoader` component internals
- Any panel already handling all three states correctly

## Visual reference

Mockups at `.superpowers/brainstorm/850-1774376636/`:

- `panel-error-final.html` — error state across calendar and list panels
- `skeleton-visibility-variants.html` — opacity/colour variants (variant 2 selected)
