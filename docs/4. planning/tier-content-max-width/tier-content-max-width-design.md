---
feature: tier-content-max-width
status: approved
type: design
---

# Design: Tier Content Max-Width

## Problem

On wide viewports the `ItemArea` right panel stretches to fill all remaining space after the 360px left sidebar. This creates an unbounded gap between item names (left-aligned) and amounts (right-aligned) in each `ItemRow`, making the rows hard to scan and visually disconnected.

## Decision

Add `max-w-3xl` (768px) to the outer container of `ItemArea`. The right panel shell continues to fill the full viewport; only the content column is capped. Left-aligned — no centering.

## Scope

Single-file, single-class change. No layout restructuring, no new components, no responsive breakpoints added.

**File:** `apps/frontend/src/components/tier/ItemArea.tsx:75`

```diff
- <div className="flex flex-col h-full">
+ <div className="flex flex-col h-full max-w-3xl">
```

This constrains both the category header row (subcategory name / item count / total / + Add) and the item list beneath it, keeping them visually unified at a readable width on any viewport.

## What is unaffected

- `ItemRow`, `ItemAccordion`, `ItemForm` — no changes
- `TwoPanelLayout`, `TierPage`, `SubcategoryList` — no changes
- The right panel background and ambient glow still fill the full viewport
- All tier pages (Income, Committed, Discretionary, Surplus) benefit automatically since they all render `ItemArea`

## Visual Reference

See `mockups/full-screen-v2.html` for the approved full-screen preview.

## Verification

1. Open any tier page (Income is easiest with existing data)
2. Expand the browser to a wide viewport (1400px+)
3. Confirm: item rows stop growing at ~768px; the right side of the panel is empty canvas
4. Confirm: the category header (title, count, total, + Add) aligns with the item rows within the same column
5. Confirm: at narrower viewports (~1024px minimum) the content fills naturally without overflow
