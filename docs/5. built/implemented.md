# Implemented Features

Features that have completed the full pipeline and shipped, organised by category.

---

## Overview

### Overview Waterfall

- **Spec:** `docs/5. built/overview/overview-waterfall/overview-waterfall-spec.md`
- **Summary:** The waterfall is the core mental model of FinPlan.

### Overview Snapshot Timeline

- **Spec:** `docs/5. built/overview/overview-snapshot-timeline/overview-snapshot-timeline-spec.md`
- **Summary:** Users accumulate a history of financial snapshots over time.

### Overview Item Detail

- **Spec:** `docs/5. built/overview/overview-item-detail/overview-item-detail-spec.md`
- **Summary:** When a user selects a waterfall item, they need to see its current value, understand its history, and take action without leaving the overview context.

### Snapshot System

- **Spec:** `docs/5. built/overview/snapshot-system/snapshot-system-spec.md`
- **Summary:** Snapshots let users track their financial progress over time by preserving point-in-time records of their plan.

### Review Wizard

- **Implemented:** 2026-03-25
- **Spec:** `docs/5. built/overview/review-wizard/review-wizard-spec.md`
- **Summary:** Financial plans go stale over time.

### Waterfall Creation Wizard

- **Spec:** `docs/5. built/overview/waterfall-creation-wizard/waterfall-creation-wizard-spec.md`
- **Summary:** New users face an empty, unfamiliar interface.

---

## Committed

### Yearly Bills Calendar

- **Spec:** `docs/5. built/committed/yearly-bills-calendar/yearly-bills-calendar-spec.md`
- **Summary:** Annual bills are smoothed via a virtual pot model, but users need to see whether monthly contributions will cover each bill when it falls due.

---

## Discretionary

### Planner Gifts

- **Spec:** `docs/5. built/discretionary/planner-gifts/planner-gifts-spec.md`
- **Summary:** Gift-giving is a predictable, recurring expense that benefits from advance planning.

### Planner Purchases

- **Spec:** `docs/5. built/discretionary/planner-purchases/planner-purchases-spec.md`
- **Summary:** Users want to plan and track intended purchases without conflating them with transactional spending.

---

## Surplus

### Wealth Accounts

- **Spec:** `docs/5. built/surplus/wealth-accounts/wealth-accounts-spec.md`
- **Summary:** Users need a single place to view all their financial accounts and understand their total wealth picture.

### Wealth ISA Tracking

- **Spec:** `docs/5. built/surplus/wealth-isa-tracking/wealth-isa-tracking-spec.md`
- **Summary:** UK residents have an annual ISA allowance that resets each April.

### Wealth Trust Savings

- **Spec:** `docs/5. built/surplus/wealth-trust-savings/wealth-trust-savings-spec.md`
- **Summary:** Some household members hold savings on behalf of others.

---

## UI

### Foundation UI Primitives

- **Spec:** `docs/5. built/ui/foundation-ui-primitives/foundation-ui-primitives-spec.md`
- **Summary:** Several shared components defined in the design system are used across multiple pages and features.

### Design Polish

- **Spec:** `docs/5. built/ui/design-polish/design-polish-spec.md`
- **Summary:** The interface is functionally correct but emotionally flat.

### Layout Refinements

- **Implemented:** 2026-03-24
- **Spec:** `docs/5. built/ui/layout-refinements/layout-refinements-spec.md`
- **Summary:** The design-polish pass left five open questions unresolved.

### Breakout Cards

- **Spec:** `docs/5. built/ui/breakout-cards/breakout-cards-spec.md`
- **Summary:** FinPlan's disciplined 8px grid and two-panel layout create a calm, scannable interface but strict adherence can feel monotonous.

### CTA Card Redesign

- **Design:** `docs/5. built/ui/cta-card-redesign/cta-card-redesign-design.md`
- **Summary:** Redesigned call-to-action card component.

### Nudge Card

- **Spec:** `docs/5. built/ui/nudge-card/nudge-card-spec.md`
- **Summary:** Users benefit from seeing mechanical observations about their finances without the app telling them what to do.

### Loading & Error States

- **Spec:** `docs/5. built/ui/loading-error-states/loading-error-states-spec.md`
- **Summary:** Query-driven panels currently handle loading, error, and empty states inconsistently.

### Navigation & Page Structure

- **Spec:** `docs/5. built/ui/navigation-and-page-structure/navigation-and-page-structure-spec.md`
- **Summary:** The current 3-page structure silos content away from the waterfall.

### Definition Tooltip

- **Spec:** `docs/5. built/ui/definition-tooltip/definition-tooltip-spec.md`
- **Summary:** Financial terms in FinPlan have specific meanings that may differ from everyday usage.

### Financial Literacy Help

- **Spec:** `docs/5. built/ui/financial-literacy-help/financial-literacy-help-spec.md`
- **Summary:** Financial terminology creates friction.

### Staleness Indicators

- **Spec:** `docs/5. built/ui/staleness-indicators/staleness-indicators-spec.md`
- **Summary:** Users need to know when a financial value hasn't been reviewed recently and may no longer reflect reality.

---

## Infrastructure

### Settings

- **Implemented:** 2026-03-25
- **Spec:** `docs/5. built/infrastructure/settings/settings-spec.md`
- **Summary:** Users need to configure household-specific parameters that affect calculations, thresholds, and display across the entire app.

### Household Management

- **Spec:** `docs/5. built/infrastructure/household-management/household-management-spec.md`
- **Summary:** FinPlan supports shared household finances.

### Testability Improvements

- **Spec:** `docs/5. built/infrastructure/testability-improvements/testability-improvements-spec.md`
- **Summary:** Several categories of backend logic are untestable as written.
