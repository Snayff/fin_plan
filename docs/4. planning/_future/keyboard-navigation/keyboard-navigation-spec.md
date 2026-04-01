---
feature: keyboard-navigation
status: backlog
priority: low
deferred: true
phase:
implemented_date:
---

# Keyboard Navigation

## Intention
Some users prefer or require keyboard-only operation. Full keyboard operability ensures FinPlan is accessible to power users and to those who cannot or prefer not to use a mouse.

## Description
Full keyboard operability across all interactive elements: navigation between pages, waterfall tier and item selection, form inputs, button activation, modal and wizard focus management. Tab order follows a logical, predictable flow.

## User Stories
- As a keyboard user, I want to navigate between all pages and interactive elements using Tab so that I can operate FinPlan without a mouse.
- As a keyboard user, I want focus indicators visible at all times so that I always know where I am.
- As a keyboard user, I want modals and wizards to trap focus correctly so that Tab does not escape the active context.
- As a keyboard user, I want to dismiss dismissible elements with Escape so that I can recover from accidental openings.

## Acceptance Criteria
- [ ] All interactive elements are reachable via Tab
- [ ] Tab order follows a logical visual flow on each page
- [ ] Focus indicators are visible at all times (not removed via `outline: none` without a replacement)
- [ ] Modals and wizard overlays trap focus within themselves
- [ ] Escape closes dismissible elements (modals, dropdowns, drawers)
- [ ] Enter and Space activate buttons and links per ARIA conventions
- [ ] Arrow keys navigate within composite widgets (e.g. timeline dots)

## Open Questions
- [ ] Are custom application-level keyboard shortcuts (e.g. `g o` for "go to overview") in scope, or only standard accessibility navigation?
- [ ] Should keyboard nav be designed as an enhancement to the existing UI or require structural changes?
