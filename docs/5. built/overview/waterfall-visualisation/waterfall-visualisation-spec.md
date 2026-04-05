---
feature: waterfall-visualisation
design_doc: docs/4. planning/waterfall-visualisation/waterfall-visualisation-design.md
creation_date: 2026-04-05
status: backlog
implemented_date:
---

# Waterfall Visualisation

> **Purpose:** Captures _what_ the feature does and _why_ — user stories, acceptance criteria, and interface-level implementation constraints. This is the input to `/write-plan`. It is intentionally not a technical plan: no Prisma syntax, no route code, no component file paths.

## Intention

The waterfall is finplan's identity — the income → committed → discretionary → surplus cascade. The current Overview page communicates this through text-only tier headings and totals, but doesn't visually show the flow of money or the composition of each spending tier. A Sankey diagram and two doughnut charts make the waterfall immediately legible and give finplan its signature visual.

## Description

Three new visualisations are added to the Overview page's default right-panel state (when no tier is selected). The right panel splits vertically: a compact Net Worth card centred above, then a Sankey waterfall flow diagram and two doughnut charts (Committed, Discretionary) on the left, with the existing four sparkline trend cards on the right. The Sankey shows income flowing into committed and discretionary spend, with surplus exiting. Each doughnut breaks its tier down by subcategory, with click-to-drill-down into individual items.

## User Stories

- As a user, I want to see a visual flow of my income through committed and discretionary spend to surplus so that the waterfall cascade is immediately intuitive.
- As a user, I want to see what makes up my committed spend at a glance (as a doughnut chart) so that I understand the composition of my obligations without clicking into the tier.
- As a user, I want to see what makes up my discretionary spend at a glance (as a doughnut chart) so that I can quickly assess where my choices are allocated.
- As a user, I want to click a doughnut segment to see the individual items within that subcategory so that I can drill deeper without leaving the overview.
- As a user, I want to hover over a Sankey band to see the tier name and amount so that I can read exact figures from the visual.

## Acceptance Criteria

- [ ] The right panel default state (no tier selected) shows a vertical split layout: visualisations on the left, sparkline cards on the right
- [ ] A compact Net Worth card with value and sparkline is centred above the split
- [ ] The Sankey diagram renders three columns: Income (left) → Committed & Discretionary stacked (centre) → Surplus (right)
- [ ] Sankey band widths are proportional to their tier's monthly total
- [ ] Hovering a Sankey band shows a tooltip with the tier name and formatted amount (e.g., "Committed — £4,817/mo")
- [ ] The Sankey has no click interaction
- [ ] A Committed doughnut chart renders with segments for each subcategory, coloured using the Tailwind indigo scale (`#818cf8` → `#1e1b4b`)
- [ ] A Discretionary doughnut chart renders with segments for each subcategory, coloured using the Tailwind purple scale (`#c084fc` → `#3b0764`)
- [ ] Segments are ordered by value descending — the largest subcategory gets the brightest shade
- [ ] Each doughnut displays a colour-keyed legend beside it (dot + subcategory name), capped at 7 entries
- [ ] If a tier has more than 7 subcategories, the 7th legend entry reads "N others" and its segment aggregates the remaining subcategories
- [ ] The doughnut centre displays the tier's total amount in `font-numeric`
- [ ] Clicking a doughnut subcategory segment animates the chart to show items within that subcategory
- [ ] In drill-down view, the centre text changes to the subcategory total (not the tier total)
- [ ] In drill-down view, the legend updates to show individual item names
- [ ] In drill-down view, a back link appears to return to the subcategory view
- [ ] Clicking the back link animates the doughnut back to the subcategory view
- [ ] A tier with a single subcategory renders as a full ring (no gap)
- [ ] A tier with zero items renders as an empty ring with a "No items" label in the centre
- [ ] When a tier is selected in the left panel, the right panel switches to the existing item list view (the visualisation layout is replaced, not layered)
- [ ] Deselecting a tier (or navigating back to no selection) restores the visualisation layout
- [ ] When viewing a historical snapshot, the visualisations reflect the snapshot data and are non-interactive (no drill-down)
- [ ] All chart animations respect `prefers-reduced-motion` (instant transitions when reduced motion is preferred)
- [ ] The split layout does not require horizontal scrolling at the minimum viewport width (1024px)

## Open Questions

_None — all decisions resolved during design._

---

## Implementation

> Interface-level constraints for the implementor. Describes _what_ is needed — entities, operations, UI units — without specifying _how_ to build them. `/write-plan` makes the technical decisions (Prisma syntax, route shapes, file paths, component code).

### Schema

No schema changes required. All data is already available through existing waterfall entities and the computed summary.

### API

No new API operations required. The existing waterfall summary endpoint already returns:

- Tier totals (income, committed monthlyTotal + monthlyAvg12, discretionary total, surplus amount)
- `bySubcategory` arrays for committed and discretionary (each with id, name, monthlyTotal, itemCount)
- Individual item arrays (committed bills, yearly bills, discretionary categories, savings allocations) — needed for drill-down, filterable client-side by subcategory

### Components

- **FinancialSummaryPanel** (existing) — must be restructured from a single-column card list to the new split layout. Becomes the container for the Net Worth card, visualisation column, and sparkline column.
- **WaterfallSankey** — renders the three-column Sankey flow diagram. Accepts tier totals as props. Computes band paths using d3 path generators. Renders hover tooltips. Read-only, no click handlers.
- **TierDoughnut** — renders a single doughnut chart for a given tier. Accepts subcategory data and a colour scale. Manages two states: subcategory view (default) and item drill-down view. Handles segment click to drill down, back link to return. Renders the colour-keyed legend. Shows the appropriate centre text (tier total or subcategory total depending on state).
- **DoughnutLegend** — renders the colour-keyed legend beside a doughnut chart. Accepts an array of entries (colour, label) capped at 7. The 7th entry aggregates overflow as "N others".
- **NetWorthCard** (existing) — may need minor layout adjustment to render centred above the split rather than as a full-width card in a column.
- **TierSummaryCard** (existing) — the four sparkline cards. No changes needed to the cards themselves; they move into the right column of the split layout.

### Notes

- **Colour scale generation**: for each tier, generate an array of up to 7 colours by stepping through the Tailwind hue scale (indigo for committed, purple for discretionary). The brightest shade is assigned to the largest-value subcategory, descending. Colours are assigned by value rank, not by subcategory identity — the same subcategory may get a different shade if its relative size changes.
- **Subcategory-to-item mapping for drill-down**: the waterfall summary includes flat item arrays (committed bills, yearly bills, discretionary categories, savings allocations). To show items within a subcategory, filter these arrays client-side by the subcategory's id. For committed, both monthly bills and yearly bills (as ÷12 values) within the subcategory should be combined into a single item list.
- **Drill-down animation**: the doughnut segments should transition smoothly between subcategory view and item view. Use 150–200ms ease-out timing, consistent with the design system's motion rules. Under `prefers-reduced-motion`, transitions are instant (no animation).
- **Sankey path computation**: use d3's path utilities to compute cubic Bezier curves connecting the three columns. Band height at each column is proportional to the tier's share of income. The surplus band on the right column represents income minus committed minus discretionary.
- **Snapshot mode**: when a historical snapshot is active (`SnapshotBanner` visible), the visualisations render with snapshot data. Doughnut drill-down is disabled — segments are not clickable. The Sankey tooltip still works on hover.
- **Responsive behaviour**: the split layout must fit within the right panel at the minimum viewport width (1024px minus the 360px left panel = 664px available). The visualisation column and sparkline column share this space. If the available width is too narrow for a comfortable split, the sparkline column could stack below, but this is an implementation decision for `/write-plan`.
