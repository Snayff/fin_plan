# Waterfall Wizard — Design Document

**Status:** Removed (entry points stripped, to be redesigned)

## Background

FinPlan previously shipped a 7-step "Waterfall Creation Wizard" embedded in the Overview page. The wizard walked new users through adding income, committed bills, yearly bills, discretionary categories, and savings allocations in sequence, with session persistence so users could resume where they left off.

### What existed

- **WelcomePage** created a household, then redirected to `/overview?build=1` to launch the wizard.
- **OverviewPage** detected the `?build=1` param (or an existing `WaterfallSetupSession` in the DB) and entered "build mode" — rendering a `BuildGuidePanel` on the right and a locked-down `WaterfallLeftPanel` on the left.
- **BuildGuidePanel** provided quick-pick chips, phase navigation (Back/Next), and a summary/finish step.
- **WaterfallLeftPanel** accepted a `buildPhase` prop that dimmed future tiers and disabled navigation during the wizard.
- **Setup session** (`WaterfallSetupSession` model) tracked the current step in the DB so the wizard could resume across page reloads.

### Why it was removed

1. **Forced re-entry:** If a user exited the wizard mid-way, visiting the Overview page would detect the persisted session and force them back into build mode. There was no clean opt-out.
2. **Data model evolution:** The waterfall data models are being rebuilt. The wizard was tightly coupled to the original schema (flat subcategories, specific frequency assumptions). Rebuilding the wizard on top of models that are about to change would create throwaway work.
3. **Simpler onboarding path:** Users can add items directly through the tier pages (Income, Committed, Discretionary, Surplus) without a guided wizard. The Overview page shows an empty state with a prompt to get started.

## Current state

- **WelcomePage** still handles first-login household creation, but now redirects to `/overview` (no `?build=1`).
- **OverviewPage** shows the normal overview or `OverviewEmptyState` — no build mode.
- **WaterfallLeftPanel** no longer accepts a `buildPhase` prop; all tier rows are always interactive.
- **Backend setup-session routes** (`/api/setup-session`) remain in place but are unused by the frontend.
- **Build module** (`components/overview/build/`) still exists on disk but is no longer imported.

## Future direction

When the new data models stabilise, the wizard should be redesigned with these goals:

1. **Opt-in only** — never force users into the wizard. Offer it on first login and from Settings.
2. **Resumable without trapping** — if a user exits mid-wizard, they can resume via an explicit action, not an automatic redirect.
3. **Aligned to new models** — the step sequence and quick-pick options should reflect the final subcategory/item structure.
4. **Settings entry point** — a "Build waterfall from scratch" option in Settings to re-run the wizard at any time.
