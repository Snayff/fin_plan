# Context Breadcrumb Header — Design Spec

**Date:** 2026-04-19  
**Status:** Approved

---

## Problem

The settings left panel shows a sub-label below the `PageHeader` to identify the active instance (e.g. household name "Snaith" under "HOUSEHOLD"). The current treatment (`text-foreground/65 font-semibold`) reads as interactive — it looks like a heading that could be clicked or a nav target.

## Goal

Make the active instance name feel like static context — a label that tells you _where you are_, not something you can act on.

---

## Pattern: Context Breadcrumb Header

### When to use

Use when a page or panel header represents a **category** (e.g. "Household", "Profile") and there is an **active instance** of that category whose name is meaningful context (e.g. "Snaith"). The instance name is informational only — never interactive.

Do **not** use this pattern for navigational breadcrumbs (use the existing `← Category / Item` pattern in right-panel headers instead).

### Visual anatomy

```
HOUSEHOLD / Snaith
```

- Category label: existing `PageHeader` title style — `font-heading text-lg font-bold uppercase tracking-tier text-page-accent`
- Separator: `/` — `text-foreground/25`, same size as instance name
- Instance name: `font-body text-xs font-normal text-foreground/45` — clearly subordinate, no hover, `cursor-default`

All three elements are **inline on the same baseline row**, inside the existing `PageHeader` container. No separate `<p>` element below the header.

### What makes it read as non-interactive

- Normal font weight (not semibold/medium)
- Low opacity (45%) — same register as metadata/helper text
- No hover state
- No cursor change (`cursor-default` is inherited; do not set `cursor-pointer`)
- Inline with the uppercase title — reads as an annotation, not a target

---

## Component changes

### `PageHeader` — add `contextName` prop

```tsx
interface PageHeaderProps {
  title: string;
  colorClass?: string;
  total?: number | null;
  totalColorClass?: string;
  contextName?: string; // NEW — instance name shown inline after title
}
```

Render the separator and name inline when `contextName` is provided:

```tsx
<h1 className={`font-heading text-lg font-bold uppercase tracking-tier ${colorClass}`}>
  {title}
  {contextName && (
    <>
      <span className="font-normal text-foreground/25 mx-1.5">/</span>
      <span className="font-body text-xs font-normal normal-case tracking-normal text-foreground/45">
        {contextName}
      </span>
    </>
  )}
</h1>
```

### `SettingsLeftPanel` — replace `subLabel` with `contextName`

Remove the `subLabel` / `subLabelClassName` props for the instance-name use case. Accept a `contextName` prop instead and pass it to `PageHeader`.

The Profile Settings descriptive sub-label ("Your personal preferences") is a **different pattern** — a plain description, not an instance name. Keep `subLabel` for that case or migrate it separately once that pattern is defined.

### `HouseholdSettingsPage`

Replace:

```tsx
subLabel = { householdName };
subLabelClassName = "text-foreground/65 font-semibold";
```

With:

```tsx
contextName = { householdName };
```

---

## Design system update (§ 8.2)

Update the Household Settings entry in `design-system.md § 8.2` to:

> **Household Settings** — title "Household"; active household name displayed inline as a context breadcrumb (`contextName` prop on `PageHeader`) — see Context Breadcrumb Header pattern (§ 3.X).

Add a new § 3.X "Context Breadcrumb Header" section to `design-system.md § 3` describing the pattern, anatomy, and when to use it.

---

## Verification

1. Open `/settings/household` — header reads "HOUSEHOLD / Snaith" (or active name) on one line
2. Hover over the name — no highlight, no cursor change
3. Click the name — nothing happens
4. Open `/settings/profile` — "Profile" heading still renders without a context name (unaffected)
5. Check at narrow settings panel width — name truncates gracefully within the `<h1>`, does not wrap awkwardly
