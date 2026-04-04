# Universal Search — WIP Design

> **Status: Design in progress**
> Captures design thinking and open questions for a global search/command palette that lets users find data items, help entries, and navigation actions from anywhere in the app.

---

## Context

finplan currently has no cross-app search. The only search that exists is a local, client-side filter inside the Help sidebar. As the app grows — more income sources, committed bills, savings allocations, assets — users need a fast way to locate and jump to a specific item without knowing which page it lives on.

The feature has two roles:

| Role         | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **Finder**   | Locate a named data item (e.g. "mortgage", "Netflix", "LISA") and jump to it    |
| **Launcher** | Quickly navigate to a page or trigger a common action without using the nav bar |

---

## Interaction model

Command palette triggered by `Ctrl+K` (`⌘K` on Mac), dismissible with `Escape`. A small trigger button in the nav bar provides discoverability.

Three result categories, always rendered in this order:

| Category    | Source                                                                                                    | Resolved where                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Data**    | DB — income sources, committed bills, yearly bills, discretionary categories, savings allocations, assets | Backend endpoint                                                             |
| **Help**    | Static — glossary entries and concept entries                                                             | Client-side (already available in `data/glossary.ts` and `data/concepts.ts`) |
| **Actions** | Static — nav links and common operations                                                                  | Client-side constant list                                                    |

---

## Design direction (early thinking)

The palette should feel like Raycast — clean, fast, keyboard-first. Deep navy background matching the app base (`#080a14`). Single text input at the top. Results scroll in a list below, grouped by category with a subtle label separating each group.

When the query is empty, show a short list of **recent pages** (from browser history or a lightweight local store) and the full **Actions** list. This makes it useful as a pure launcher even without typing.

Data results show: item name as the title, and the waterfall tier + item type as subtitle (e.g. "Committed · Monthly bill"). Selecting a data result navigates to that item's parent page.

Help results show: term or concept title as the title, first ~60 chars of the definition as subtitle. Selecting navigates to `/help?entry=<id>`.

Actions results show: label + destination page. No subtitle needed.

---

## Open questions

1. **Deep-linking for data results** — should selecting a data item navigate to the page only, or also scroll/highlight that specific item? Highlighting would require a URL hash or query param convention that doesn't exist yet.
2. **Scope of "actions"** — navigation-only (go to Income, go to Settings) or also CRUD shortcuts ("Add income source", "Create snapshot")? CRUD shortcuts would need the palette to hand off to a modal, which is more complex.
3. **Empty-state behaviour** — show recent pages + all actions (as described above), or show nothing and prompt the user to type? Showing recent pages requires persisting a recents list somewhere (localStorage? Zustand?).
4. **Data search algorithm** — case-insensitive contains match on item `name` field, or also match on `subcategory`, `notes`, amount? Fuzzy matching is probably overkill for a stub.
5. **Mobile** — `Ctrl+K` has no meaning on touch. Is the nav trigger button sufficient, or does the palette need a dedicated mobile entry point?
6. **No results per category** — hide the category header entirely when a category returns zero results, or show "No results" inside it?
7. **Result limit** — cap data results at N per category (e.g. 5 data, 3 help, all actions) or one global limit across all categories?

---

## What needs to be decided at design time

- Navigation behaviour for data results (page only vs. deep-link with highlight)
- Scope of actions (navigate-only vs. create shortcuts)
- Empty-state strategy (recent pages vs. blank prompt)
- Which data model fields are searched (name only vs. name + notes + subcategory)
- Per-category limits vs. single global limit
- Mobile entry point beyond the nav trigger button
