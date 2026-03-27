# Overview Snapshot Timeline — Approved Design

**Date:** 2026-03-25
**Feature:** overview-snapshot-timeline
**Status:** Approved

---

## Context

The existing spec for the snapshot timeline left the overflow behaviour unspecified — it noted that ◂/▸ gap navigation arrows should appear but gave no detail on how the timeline behaves when there are many snapshots. This design session resolved that open question and redesigned the timeline strip as a result.

Expected snapshot volume: ~5 per year. After 5 years a typical user has ~25 snapshots.

---

## Timeline Strip Layout

The strip lives above the overview waterfall and is always visible. It has two rows:

**Meta row:**

```
[mm/yy – mm/yy]                              [+ Save snapshot]
```

- Date range label (left): `font-numeric`, 10px, `text-tertiary`. Shows earliest–latest visible snapshot in the current viewport window. Updates dynamically as the user scrolls.
- Save snapshot button (right): secondary button style, right-aligned. Hidden during snapshot mode. 12px right padding from container edge.

**Bar row:**

```
[◂]   [scrollable track ··· dots ··· year lines]   [▸]   [Now]
```

- ◂ and ▸ are styled bordered buttons (surface background, 28×28px, `radius`). Disabled at scroll limits.
- 12px right padding from container edge.
- Now button sits right of ▸, same height as arrows. Styled with `action` colour. Dims/disables when already at live (right edge) position.

---

## Proportional Spacing with Maximum Cap

Dot positions are computed by accumulating gaps between consecutive snapshots:

```
gap_px = min(days_between_snapshots × 1.1, 130)
dot_x  = sum of all preceding gaps + PAD_LEFT
```

- Nearby snapshots (e.g. review wizard + manual save in same week) stay close together
- Long gaps (e.g. 18 months of inactivity) are capped at 130px — the track doesn't become infinitely wide
- The "Now" pip sits at the right end of the track at a fixed offset after the last snapshot

---

## Scroll Behaviour

Three input methods, all equivalent:

- **Drag** — click+drag the track horizontally
- **Scroll wheel** — wheel up = forward in time (towards Now); wheel down = back in time
- **Arrow buttons** — each press pans by a fixed step (~200px)

Left and right edge fade masks (gradient overlays) indicate that more content exists beyond the viewport.

---

## Year Markers

At each 1 January boundary, a faint vertical line (`rgba(238,242,255,0.07)`) runs the full height of the track, with the year as a label at the bottom (`font-numeric`, 9px, `text-muted`).

---

## Dot Styling

| Type                       | Style                                  |
| -------------------------- | -------------------------------------- |
| Auto (Jan 1 — Auto)        | Dashed ring, low-opacity fill          |
| Manual / wizard            | Solid ring, standard fill              |
| Selected (active snapshot) | Solid, `action` colour fill, glow ring |

Hover tooltip: snapshot name + full date (e.g. "April 2023 — 10 April 2023").

---

## Empty State

When no snapshots exist:

- Track shows `No snapshots yet` in `text-muted`
- No dots, no date range label, no year markers
- `[+ Save snapshot]` button still visible
- Now button is dimmed (no live → snapshot navigation possible)

---

## Snapshot Mode (Read-Only)

When a dot is clicked, the page enters snapshot mode:

1. **Page header transforms** to a breadcrumb:

   ```
   Overview  ›  April 2023  ·  Read only            [← Live view]
   ```

   - Snapshot name truncated at ~40 characters with ellipsis
   - "Read only" tag: amber colour (`attention` token), low-opacity background
   - `← Live view` button: secondary style, exits snapshot mode

2. **Timeline strip stays visible** — the user can click other dots to navigate between snapshots without exiting first. The selected dot is highlighted.

3. **`[+ Save snapshot]`** is hidden.

4. **Edit controls** (Edit, Still correct, add/delete actions) are hidden from the waterfall panels.

5. **Now button** in the bar row also exits snapshot mode (equivalent to `← Live view`).

Exiting snapshot mode (via `← Live view` or Now) restores: page header to "Overview", save button, all edit controls. Selected dot is deselected.
