---
feature: waterfall-visualisation
status: approved
creation_date: 2026-04-05
implemented_date: 2026-04-20
---

# Waterfall Visualisation — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

The Overview page shows the waterfall as a text-based list of tier headings and totals. While functional, this doesn't visually communicate the flow of money through the waterfall — the core mental model of finplan. There is no at-a-glance breakdown of what makes up Committed or Discretionary spend. Users must click into each tier to understand composition. A visual representation of the waterfall flow (Sankey) and tier composition (doughnut charts) would make the Overview page immediately informative and reinforce finplan's identity.

## Approved Approach

Add three new visualisations to the Overview page's default right-panel state (when no tier is selected), presented within a vertical split layout alongside the existing sparkline trend cards.

**Layout:**

- The right panel splits vertically into two columns
- A compact Net Worth card sits centred above the split
- Left column: Sankey waterfall flow diagram + two doughnut charts (Committed & Discretionary) side by side
- Right column: four sparkline trend cards (Income, Committed, Discretionary, Surplus) stacked vertically
- When a tier is clicked in the left panel, the right panel switches to the existing item list / item detail views as normal — the visualisations are only the default state

**Sankey diagram:**

- Three-column flow: Income → Committed & Discretionary (stacked vertically in the middle column) → Surplus
- Band widths proportional to tier amounts
- Hover-only interaction — tooltip shows tier name and amount
- No click navigation, purely visual and read-only

**Doughnut charts:**

- One per spending tier: Committed (indigo hue family) and Discretionary (purple hue family)
- Segments represent subcategories by default, with a colour-keyed legend beside each chart
- Clicking a subcategory segment drills into individual items within that subcategory — the doughnut animates to show the item breakdown
- A back link appears to return to the subcategory view
- Total amount displayed in the centre of each doughnut

This approach was chosen because it keeps all visualisations within the existing two-panel shell (no new page), preserves the sparkline trend cards (additive, not replacing), and puts the Sankey — finplan's signature visual — front and centre.

## Key Decisions

| Decision                 | Choice                                                               | Rationale                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Placement                | Split right panel vertically (visuals left, sparklines right)        | Additive — nothing lost. Charts are visible without scrolling. No new page needed.                                                     |
| Net worth position       | Compact card centred above the split, not full width                 | Avoids dominating the layout; the Sankey and doughnuts are the focus                                                                   |
| Sankey structure         | Income → Committed & Discretionary → Surplus (3-column)              | Mirrors the waterfall mental model — income enters, two deductions in the middle, surplus exits                                        |
| Sankey interaction       | Hover tooltips only, no click                                        | The left panel already handles tier navigation — duplicating it on the Sankey adds complexity without value                            |
| Doughnut segments        | Subcategories by default, click to drill into items                  | Subcategories give meaningful groupings at a glance; item-level drill-down available on demand                                         |
| Doughnut drill-down exit | Back link above/below the chart                                      | Simple, discoverable. Centre-click was considered but less obvious                                                                     |
| Segment colour palette   | Lightness/saturation variations within the tier's Tailwind hue scale | Visually distinct segments while staying within the tier's colour identity. More readable than opacity variations on a dark background |
| Committed palette        | Tailwind indigo scale: `#818cf8` → `#1e1b4b`                         | Matches `tier-committed` (`#6366f1`) hue family                                                                                        |
| Discretionary palette    | Tailwind purple scale: `#c084fc` → `#3b0764`                         | Matches `tier-discretionary` (`#a855f7`) hue family                                                                                    |
| Segment ordering         | Largest value gets brightest shade, descending                       | Natural visual hierarchy — the biggest slice is the most prominent                                                                     |
| Legend cap               | Maximum 7 entries                                                    | Prevents the key from overwhelming the doughnut. Covers the vast majority of real-world tier compositions                              |
| Single subcategory       | Full ring, still shown as doughnut                                   | Consistency — the chart is always a doughnut regardless of segment count                                                               |
| Empty tier               | Empty ring with "No items" message                                   | Clear feedback, maintains layout structure                                                                                             |
| Chart libraries          | recharts for doughnuts/sparklines, d3 for Sankey paths               | Both already installed (`recharts@^2`, `d3@^7.9.0`). No new dependencies                                                               |
| Data source              | `useWaterfallSummary()` for tier totals and `bySubcategory` arrays   | Already provides all needed data (name, monthlyTotal, itemCount per subcategory)                                                       |

## Out of Scope

- Click-to-navigate on the Sankey diagram
- Sankey animation or transitions beyond hover tooltip
- Mobile/responsive layout for the split panel
- Forecasting integration or projection overlays
- Additional chart types (bar charts, area charts, etc.)
- Doughnut charts for Income or Surplus tiers
- New backend endpoints — all data is already available via existing hooks

## Visual Reference

- `placement-split-v2.html` — approved layout: net worth centred above, Sankey + doughnuts on left, sparklines on right
- `colour-palette-options.html` — palette comparison showing all three options (B selected: hue-family variations)
