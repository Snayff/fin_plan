---
feature: enhance-settings
status: approved
creation_date: 2026-04-18
implemented_date:
---

# Enhance Settings — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

The current Settings page has four classes of problem that reduce it below the quality bar of the rest of the app:

- **Bugs:** the left-nav active highlight uses a full-fill `bg-accent` style instead of the design system's indicator pattern; scroll-spy activation is out of sync with clicks so the highlight can lag or mis-target; Growth rates and Audit log sections have swapped `data-section-id` refs, breaking their nav entries. The household switcher dropdown can overflow the viewport horizontally because it anchors `left-0` relative to a trigger near the right edge of the nav.
- **Design-system drift:** left panel is 192px (`w-48`) instead of the canonical 360px, with no `PageHeader`, no left footer pattern, and no left panel scroll structure. The right panel is constrained to `max-w-2xl` inside a potentially wide area, leaving large empty whitespace.
- **Information architecture:** household-related interactions are fragmented — switching households is in the top nav, management (rename, invite, leave) is buried in Settings, creating a household is in the switcher. Sections are in no obvious order, and the split between personal and household scope is implicit.
- **Save model:** inconsistent — Display auto-saves, but Profile, Staleness, Surplus, ISA all require explicit Save clicks. Users can't predict what happens when they navigate away.

## Approved Approach

Split Settings into two scope-specific routes, redesign them to the canonical two-panel shell, make auto-save the default, and fix the household switcher dropdown.

### Routes

- `/settings/profile` — personal, cross-household. Accessed via a new profile avatar dropdown in the top nav.
- `/settings/household` — per-active-household. Accessed via the Household Switcher → "Household settings" action.
- `/settings` — redirects to `/settings/profile`.

### Top Nav Changes

- **Remove** the "Settings" text nav link.
- **Add** a circular profile avatar (initials/image, 32px, `rounded-full`) at the far right. Opens a dropdown with user name + email, `Profile settings`, `Sign out`.
- **Enrich** the household switcher dropdown with two groups:
  1. _Switch household_ — current household list (existing behaviour).
  2. _Actions_ — `Household settings`, `+ Create new household`.
- **Viewport-safe dropdowns:** anchored `right-0`; `max-height: min(420px, 100vh - 70px)` with internal scroll; background `surface-overlay`, border `surface-overlay-border`, radius 8px.

### Profile Settings Page

Two-panel layout. Left panel (360px) uses `PageHeader` with title "Profile" in `page-accent`, plus a sub-label "Your personal preferences" in `text-tertiary`. Flat nav (no groups):

- **Account** — name input (auto-save), email (read-only display).
- **Display** — Show pence toggle (existing behaviour retained).

### Household Settings Page

Two-panel layout. Left panel (360px) uses `PageHeader` with title "Household" in `page-accent`, plus a sub-label showing the active household name (e.g. "Snaith") in `text-secondary`. Grouped nav:

- **General** — _Details_, _Members & invites_
- **Financial** — _Surplus benchmark_, _ISA settings_, _Staleness thresholds_, _Growth rates_
- **Structure** — _Subcategories_
- **Advanced** — _Data_, _Audit log_

Role-based visibility unchanged: Growth rates / Audit log visible to owner + admin; Data visible to owner only; all other sections visible to all members (edit permissions governed by existing role rules).

### Right Panel Behaviour (scroll-spy, § 8 exception)

All sections render in a single long page inside the right panel. Left-nav click smooth-scrolls to the section and sets the active highlight immediately (don't wait for the observer); page scroll updates the active highlight via `IntersectionObserver`. Sections separated by horizontal dividers (`border-t border-foreground/6`) with `space-y-12` vertical rhythm (§ 1.4 exception). The right-panel header is sticky so it stays visible through scroll.

Section titles render per § 8: `font-heading`, weight 700, uppercase, 0.06em letter-spacing, `text-page-accent`.

### Auto-save Model

- **Text inputs:** debounce 600ms after last keystroke, then save.
- **Checkboxes / selects / sliders:** save immediately on change.
- **Success micro-reaction:** the input's border pulses `success` green (~1.5s keyframe) and a small "✓ saved" inline flash appears next to the field label for ~1.5s, then fades. No toast.
- **Failure:** revert the field to the last-known server value; show inline red helper text below the input (e.g. "Couldn't save — try again"). No toast.
- **Destructive actions** (leave household, remove member, reset data, cancel invite) are exempt — they keep `ConfirmationModal` confirmation and are explicit actions.

### Bug Fixes Bundled

- Left-nav active indicator switches to the design-system pattern (`bg-page-accent/14 border-l-2 border-page-accent rounded-r-sm`), not `bg-accent` full-fill.
- Click-to-scroll and scroll-spy coordinated: on click, set `activeSection` immediately and then smooth-scroll.
- Fix swapped `data-section-id` refs on Growth rates / Audit log.
- Household switcher dropdown anchored `right-0` with viewport-safe max-height.

## Key Decisions

| Decision                      | Choice                                                                        | Rationale                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Information architecture      | Split into two routes (`/settings/profile`, `/settings/household`)            | Matches scope boundary; removes fragmented household-action placement; aligns entry points with natural triggers (avatar for personal, switcher for household) |
| Left panel nav pattern        | Canonical indicator-pattern items, with group headers on Household Settings   | Same pattern as Waterfall Overview; group headers add structure without clicks                                                                                 |
| Right panel interaction       | Scroll-spy, single long page                                                  | Users frequently cross-reference settings; a long page is the correct shape for this task                                                                      |
| Save model                    | Auto-save by default, debounced 600ms for text                                | Removes explicit Save clicks; aligns with § 4.7 "prefer micro-reactions over toasts"                                                                           |
| Save failure feedback         | Inline helper text + field revert; no toast                                   | Localised to the failing field; toast would be ambient and miss context                                                                                        |
| Destructive actions           | Keep `ConfirmationModal` — never auto-save                                    | Prevents irreversible actions from being accidental                                                                                                            |
| Household switcher ergonomics | Host `Household settings` and `Create new household` inside the switcher      | Switcher becomes the unified household entry point                                                                                                             |
| Dropdown viewport safety      | `right-0` anchor + `max-height: min(420px, 100vh - 70px)` + `overflow-y-auto` | Prevents horizontal overflow at the right edge of the nav and vertical overflow on long household lists                                                        |
| Section order (Household)     | General → Financial → Structure → Advanced                                    | Top-to-bottom by frequency and severity: everyday details first, irreversible/audit last                                                                       |
| Role-based visibility         | Kept as-is                                                                    | No product change requested; port current rules to new pages                                                                                                   |
| Redirect                      | `/settings` → `/settings/profile`                                             | Preserves existing bookmarks; profile is the safer default                                                                                                     |

## Out of Scope

- Redesign of subcategory editing, audit log filtering, or member management internals — reuse existing components as-is.
- Changes to backend Settings API shape (routes, DTOs, validation).
- Mobile layout (desktop-first per anchor § 6).
- Keyboard shortcuts for settings navigation.
- Changes to the invite flow, household creation flow, or role promotion UI.
- Theme switching, light mode (out of scope per anchor § 7).

## Visual Reference

- `mockups/current-state-audit.html` — audit of current Settings problems (bugs, IA, design-system drift)
- `mockups/proposed-layout.html` — low-fi grouped-nav exploration with scope chips
- `mockups/split-settings.html` — mid-fi split architecture with avatar + enriched switcher
- `mockups/refined-aligned.html` — final high-fi mockup, strictly aligned to design tokens

## Design Standard Updates Applied

Alongside this design, the following changes have been applied to `docs/2. design/design-system.md`:

- **§ 7 Top Navigation Bar** — remove "Settings" nav link; document profile avatar pattern; document enriched household switcher (two groups: switch, actions); viewport-safe dropdown anchoring.
- **§ 8 Settings Page** — rewritten to describe two pages (Profile and Household), grouped left nav for Household Settings, scroll-spy pattern as a documented exception to § 3.2, horizontal dividers with `space-y-12` rhythm, auto-save default with field-level micro-reaction, destructive actions exempt from auto-save.
