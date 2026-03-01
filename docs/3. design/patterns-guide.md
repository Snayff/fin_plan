# UI Patterns Guide

**Live visual reference:** navigate to `/design` while running the dev server.
This document captures the *why* and *when* decisions that can't be shown in a rendered preview.

---

## Component Choice Rules

### Button variant → action consequence

| Variant | Use for |
|---|---|
| `default` (orange) | The primary CTA on a page or form. One per section maximum. |
| `secondary` | Cancel, back, or secondary actions alongside a primary. |
| `outline` | Tertiary actions that need a border but less weight than secondary. |
| `ghost` | Low-priority inline actions (e.g. "View details" in a list row). |
| `destructive` | Triggering a delete — always paired with `ConfirmDialog`. |
| `link` | Navigation-style inline actions (e.g. "Learn more"). |

### Dialog vs ConfirmDialog

- **Modal** — for create/edit flows. Contains a form. User is doing work.
- **ConfirmDialog** — for irreversible or destructive actions only. User is making a decision.
  - `variant="danger"` for deletes and data loss
  - `variant="warning"` for actions with side effects (e.g. archiving)
  - `variant="info"` for neutral confirmations (e.g. "Start new period?")

### Toast vs inline Alert vs field error

| Scenario | Pattern |
|---|---|
| Mutation succeeded | `showSuccess()` toast |
| Mutation failed (server/network error) | `showError()` toast + destructive-subtle block in form |
| Field validation failed | Inline `text-xs text-destructive` below the field |
| Persistent page-level warning | `<Alert>` component (stays visible until resolved) |

### Card vs plain div

Use a `<Card>` when content:
- Is visually distinct from the page background
- Groups related data or controls
- Would benefit from the border + shadow elevation

Use a plain `<div>` when:
- You're inside a Card already (no card-in-card nesting)
- You need a simple row or inline grouping without visual weight

### Table vs Card list

| Use Table when | Use Card grid when |
|---|---|
| 5+ records with 3+ comparable columns | 4 or fewer records, or primarily visual data |
| Users need to scan and compare column values | Each item has a distinct shape or actions |
| Sorting or filtering is applied to the list | Items benefit from breathing room and icons |

---

## Financial Data Conventions

- **Always use `font-mono` for amounts** — alignment matters when scanning figures
- **Income is `text-success`** (teal), expenses use default `text-foreground` — not red. Red is reserved for errors.
- **Currency symbol** placement: defined globally, consistent across all pages. Check `src/lib/currency.ts` for the helper.
- **Negative values** displayed as `–$xxx` (en-dash), not `-$xxx` (hyphen)

---

## Accessibility Reminders

- Every `<Input>` must have a paired `<Label htmlFor="...">` — never skip labels for "clean" UI
- Minimum touch target size: 40×44px — already satisfied by the default Button sizes
- Destructive actions require a ConfirmDialog — this is an accessibility principle (prevent irreversible mistakes), not just UX polish
- Use semantic HTML elements (`<h1>`–`<h6>`, `<nav>`, `<main>`, `<section>`) — the CSS heading hierarchy in `index.css` applies automatically

---

## Tone of Voice (copy inside the UI)

- **Empty states:** encouraging, action-oriented. "Set your first goal" not "No goals found."
- **Error states:** clear and practical, no blame. "Could not load accounts — check your connection." Not "Error: 500."
- **Destructive confirmations:** honest about consequences, not alarming. "This will remove the goal and all its progress." Not "WARNING: PERMANENT DELETION."
- **Button labels:** verb-first, specific. "Save goal" not "Submit". "Delete account" not "Confirm."

---

## Maintenance

Each pattern file owns its category. When you update a component, update the corresponding pattern file:

| File | Category |
|---|---|
| `src/components/design/patterns/FoundationPatterns.tsx` | Colors, typography, spacing |
| `src/components/design/patterns/ComponentPatterns.tsx` | Button, Card, Badge, Input, Select, Alert |
| `src/components/design/patterns/FormPatterns.tsx` | Form layout, validation, errors, disabled |
| `src/components/design/patterns/StatePatterns.tsx` | Loading, empty, error states |
| `src/components/design/patterns/FeedbackPatterns.tsx` | Toast, Modal, ConfirmDialog |
| `src/components/design/patterns/DataDisplayPatterns.tsx` | Metric cards, Table, Charts |

The `/design` route imports real components, so rendered output never drifts. Only the decision text and code strings need manual updates.
