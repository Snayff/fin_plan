---
feature: navigation-and-page-structure
status: draft
creation_date: 2026-03-26
status: in-progress
implemented_date:
---

# Navigation & Page Structure — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

The current 3-page structure (Overview, Wealth, Planner) creates silos. Wealth and Planner feel disconnected from the waterfall — they're parallel destinations with no structural relationship to the Income → Committed → Discretionary → Surplus cascade. Additionally, the current implementation is largely non-functional (left panel items unclickable, right panels have no fields), requiring a full rebuild.

## Approved Approach

**Waterfall-as-navigation:** The Overview becomes the hub. Each of the 4 waterfall tiers gets its own page. Wealth and Planner are dissolved and replaced by dedicated pages (Goals, Gifts) that feed into the waterfall tiers. All 8 pages appear in the top nav.

### Page Inventory

| Page          | Route            | Purpose                                                         |
| ------------- | ---------------- | --------------------------------------------------------------- |
| Overview      | `/overview`      | Waterfall hub — 4 clickable tier rows, full cascade summary     |
| Income        | `/income`        | Income items grouped by subcategory                             |
| Committed     | `/committed`     | Bills grouped by subcategory                                    |
| Discretionary | `/discretionary` | Spend categories and savings, grouped by subcategory            |
| Surplus       | `/surplus`       | Savings allocations; calculated surplus                         |
| Goals         | `/goals`         | Financial targets (e.g. buy house, save 50k) — future spec      |
| Gifts         | `/gifts`         | People + events config; feeds Discretionary > Gifts subcategory |
| Settings      | `/settings`      | Existing settings page, no structural change                    |

**Top nav (9 items):** Overview | Income · Committed · Discretionary · Surplus | Goals · Gifts · Help ···· Settings

**Top nav visual treatment:**

- Overview: `page-accent` purple (`#8b5cf6`) — active underline in same colour
- Tier names: their tier colour (Income=blue, Committed=indigo, Discretionary=purple, Surplus=teal)
- Goals, Gifts, Help: default muted text colour — no tier colour
- **Vertical separators** (1px, `rgba(238,242,255,0.12)`) after Overview and after Surplus — grouping: `[Overview] | [4 tiers] | [Goals · Gifts · Help ···· Settings]`

---

### Overview Page

- **Two-panel layout** — Anchor 17 preserved
- **Left panel:** The full waterfall cascade (4 tier rows + connectors). Each tier row is clickable — navigates to that tier's page. Clicking a sub-item on a tier row also navigates to that tier's page with that item loaded.
- **Right panel:** Reserved for analytics (scope: future). Currently shows a placeholder — not a blank void.
- Ambient glow: existing indigo/violet treatment unchanged.

### Tier Pages (Income, Committed, Discretionary, Surplus)

All four follow the same two-panel structure:

- **Left panel:** List of subcategories for that tier. Each subcategory row shows: stale dot (fixed-width column, left of name — names always align), subcategory name, total amount. Selecting a subcategory loads the right panel. Total shown at bottom of list.
- **Right panel:** Header with subcategory name, item count, total + ghost "Add" button (see Item UX below). Below: item list with accordion expand.

### Stale Indicator Positioning

All stale dots appear in a **fixed-width column to the LEFT of the text label** — in the Overview waterfall, in the subcategory list, and in the item list. This ensures all text labels remain vertically aligned regardless of stale state. Empty column when item is fresh.

### Item Data Model

Every item (across all tiers) has these fields:

| Field         | Type                       | Notes                                                                                    |
| ------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| Name          | Free text                  | "Mortgage", "Groceries", etc.                                                            |
| Amount        | GBP value                  | Annual amount for yearly items — app calculates ÷12                                      |
| Spend type    | Monthly / Yearly / One-off | Determines waterfall handling                                                            |
| Subcategory   | Dropdown                   | Defaults to currently selected subcategory                                               |
| Notes         | Free text, optional        | Context like "Fixed rate until 2027". Shown italic in detail view, textarea in edit form |
| Last reviewed | Timestamp                  | Set automatically on create, reset on "Still correct"                                    |

**Yearly item display:** `£840 · £70/mo` — annual amount shown first, ÷12 monthly equivalent after the dot. In detail view: `Yearly (÷12 = £70/mo)`.

### Item UX — Accordion Expand

Items are displayed as rows in a list. Clicking a row **expands it inline** (accordion style) to show:

- Detail grid: last reviewed, spend type, subcategory
- Notes (if present, italic; if empty, muted "No notes")
- **ButtonPair:**
  - **Fresh items:** only "Edit" button
  - **Stale items:** "Edit" + "Still correct ✓" (teal accent)
- Clicking "Edit" replaces the detail view with an edit form (name, amount, frequency, subcategory, notes textarea). Edit form **always** shows "Cancel", "Still correct ✓", and "Save".

Only one item expanded at a time — opening one closes others.

### Add Item — Header-Aligned Ghost Button

The "Add" action lives in the **right panel header**, right-aligned next to the subcategory title. It is a **ghost button** (transparent background, subtle border) that reveals accent colour on hover. This keeps it discoverable without competing with data rows.

- At rest: `+ Add` text, `rgba(238,242,255,0.45)` colour, `rgba(238,242,255,0.1)` border
- On hover: text brightens, border becomes `rgba(124,58,237,0.4)`, background tints `rgba(124,58,237,0.08)`
- Clicking inserts a new item form at the **top** of the item list

### Empty States

When a subcategory, tier page, or Overview has no data, the right panel shows a **centred callout gradient card** (indigo→purple, per design system) floating in the middle of the panel. No skeleton rows for full-page empty states.

**Card structure:** gradient header (callout-primary, `font-heading` weight 800) + body text (2–4 noun examples) + action button.

**Empty state copy pattern:**

- **Header:** action verb + context. "Add your housing costs", not "Add your first item"
- **Body:** 2–4 concrete noun examples, comma-separated. No full sentences. Helps the user understand what belongs in this subcategory.
- **Tone:** direct and helpful, never instructional. No "you should", no exclamation marks.
- **Button:** always "+ Add item" for subcategories. "Get started" for Overview (launches build wizard).
- **No "first":** avoid "Add your first item" — implies a sequence that may not exist.

**Copy reference:**

| Context                 | Header                   | Body                                                                          |
| ----------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Income › Salary         | Add your salary          | Employment income, take-home pay                                              |
| Income › Dividends      | Add your dividends       | Investment income, shareholder dividends                                      |
| Income › Other          | Add your income          | Rental income, freelance, side projects                                       |
| Committed › Housing     | Add your housing costs   | Rent, mortgage, council tax, insurance                                        |
| Committed › Utilities   | Add your utilities       | Gas, electric, water, internet, phone                                         |
| Committed › Services    | Add your services        | Streaming, TV, gym, subscriptions                                             |
| Committed › Other       | Add your committed costs | Any regular obligation not covered above                                      |
| Discretionary › Food    | Add your food budget     | Groceries, meal kits, work lunches                                            |
| Discretionary › Fun     | Add your fun spending    | Eating out, takeaways, cinema, hobbies                                        |
| Discretionary › Clothes | Add your clothes budget  | Clothing, shoes, accessories                                                  |
| Discretionary › Gifts   | Add your gift budget     | Configured from the Gifts page                                                |
| Discretionary › Other   | Add your spending        | Anything not covered in the categories above                                  |
| Surplus › Savings       | Add your savings         | Emergency fund, ISA, pension top-up                                           |
| Surplus › Other         | Add your surplus plans   | Anything else you do with your surplus                                        |
| Overview (empty)        | Build your waterfall     | Add your income, committed spend, and discretionary spend to see your surplus |

**Overview empty left panel:** ghosted cascade at ~25% opacity (tier names with "£—" placeholders + connectors) — teaches the waterfall structure even when empty.

### Subcategory System

Subcategories are **predefined per tier with user-configurable defaults.** Users can rename, reorder, and (within limits) add subcategories via Settings. The left panel always shows: up to N subcategories + "Other" (N TBD at spec time, suggested 6).

**Default subcategory map:**

| Tier          | Default Subcategories                       |
| ------------- | ------------------------------------------- |
| Income        | Salary, Dividends, Other                    |
| Committed     | Housing, Utilities, Services, Other         |
| Discretionary | Food, Fun, Clothes, Gifts _(locked)_, Other |
| Surplus       | Savings Allocations, Other                  |

**Locked subcategories:** `Gifts` in Discretionary cannot be removed. It is driven by the Gifts page configuration.

**Phase 1 vs Phase 2:**

- **Phase 1:** Subcategories are hardcoded constants. Items are grouped by their existing types mapped to the predefined subcategory names. No Settings UI for subcategory management. No `subcategory` field on the data model — grouping is derived from existing item type fields.
- **Phase 2:** Adds a `subcategory` field to the item data model (backend migration). Subcategory configuration UI in Settings: rename, reorder, add (up to N per tier), delete (except locked). Items become freely reassignable between subcategories via a dropdown on the edit form.

**Spend types:** Every item has a spend type — Monthly, Yearly (÷12 virtual pot model, already implemented), or One-off. This is set on item creation and displayed in detail view.

### Goals Page

Standalone page for financial targets (e.g. "Buy a house", "Save £50k emergency fund"). Full design is out of scope for this redesign — a prospective spec is needed. Navigation: top nav item, no parent tier. This page replaces what was previously called "Purchases" in the old Planner.

### Gifts Page

Standalone page for configuring gift recipients (people + events + budgets). This config drives the locked `Gifts` subcategory in Discretionary — the monthly Gifts allocation is calculated from configured events. Full feature fidelity from the existing Planner Gifts implementation is preserved.

**Layout and interaction design deferred** — needs a dedicated `/write-design gifts` session. This design covers the Gifts page's place in the navigation (top nav item, route `/gifts`) and its relationship to Discretionary (locked subcategory), but not the page's internal structure.

## Key Decisions

| Decision                | Choice                                                        | Rationale                                                                                                           |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Overview layout         | Two-panel (left=waterfall, right=analytics placeholder)       | Preserves Anchor 17; right panel reserved for future analytics                                                      |
| Tier navigation         | Tiers in top nav (8 items)                                    | Every tier is 1 click away; avoids 2-click navigation through Overview hub                                          |
| Wealth page             | Removed/descoped                                              | Savings allocations remain under Surplus; net worth tracking is a distinct product area, deferred                   |
| Subcategory taxonomy    | Predefined defaults + user-configurable in Settings           | Reduces ambiguity ("is takeaway Food or Fun?") while preserving flexibility                                         |
| Gifts subcategory       | Locked in Discretionary                                       | Gifts are driven by configured people/events — removing the subcategory would orphan that data                      |
| Goals page              | Standalone top-nav page, full spec deferred                   | Financial targets are a distinct job-to-be-done; need dedicated design before implementation                        |
| Spend types             | Monthly / Yearly (÷12) / One-off per item                     | Generalises the existing yearly bill pattern to all tiers                                                           |
| Tier colours in nav     | Tier names use their tier colour; Overview uses `page-accent` | Extends the "tier context" rule to navigation — each tier name IS its tier context                                  |
| Nav separators          | Vertical 1px bars after Overview and after Surplus            | Groups: [Overview] · [4 tiers] · [Goals, Gifts, Settings]                                                           |
| Stale dot position      | Fixed-width column LEFT of text label                         | Ensures all text labels remain aligned regardless of stale state                                                    |
| Item detail pattern     | Accordion expand inline (one at a time)                       | Keeps context — user sees the list while viewing detail; no modal overlay                                           |
| "Still correct" button  | Stale items: view + edit. Fresh items: edit mode only         | Reduces visual noise on healthy items; always available when you're already editing                                 |
| Add item button         | Ghost button in right panel header, right-aligned             | Discoverable without competing with data rows; lives in the "chrome" zone                                           |
| New item insertion      | Top of list                                                   | Most recently added is most visible; consistent with the add button being above the list                            |
| Item notes field        | Free-format text, optional, on every item                     | Context like "Fixed rate until 2027" — shown italic in detail view, textarea in edit form                           |
| Implementation approach | Full rebuild (drains-up)                                      | Current implementation is non-functional scaffolding; migration of partial state would cost more than a clean build |

## Out of Scope

- Goals page full design — needs a dedicated `/write-design goals` session
- Gifts page internal layout — needs a dedicated `/write-design gifts` session
- Right panel analytics on Overview — future feature
- Wealth / net worth tracker — descoped entirely from this redesign
- Subcategory rename/management UI in Settings — Phase 2 of implementation
- Spend type validation rules (e.g. can a committed item be "one-off"?) — deferred to spec
- Mobile experience — desktop-first per Anchor 6

## Visual Reference

- `mockups/nav-and-layouts-v3.html` — Final nav bar, Overview + Committed tier page layouts, interactive item accordion demo with notes
- `mockups/add-item-options.html` — Four add-item button variants explored; Option C (header-aligned ghost button) selected
- `mockups/overview-click-through.html` — Interactive walkthrough: clicking tier rows and subcategories in Overview navigates to tier pages with correct subcategory pre-selected
- `mockups/empty-card-final.html` — Empty state copy pattern, all subcategory cards rendered, full copy reference table
