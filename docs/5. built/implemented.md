# Implemented Features

## Navigation and Page Structure — Phase 2 (Frontend Nav & Routing)

- **Implemented:** 2026-03-26
- **Plan:** `docs/5. built/navigation-and-page-structure/navigation-and-page-structure-plan-phase2-frontend-nav.md`
- **Summary:** Replaces the 4-item nav with an 8-item TopNav (tier colours, separators, right-aligned Settings), adds 8 routes with legacy redirects, implements Goals/Gifts placeholder pages, builds the Surplus page with waterfall breakdown and benchmark warning, makes Overview tier headings navigable, and adds an analytics placeholder and extracted empty state component.

## Navigation and Page Structure — Phase 1 (Backend)

- **Implemented:** 2026-03-26
- **Plan:** `docs/5. built/navigation-and-page-structure/navigation-and-page-structure-plan-phase1-backend.md`
- **Summary:** Consolidates 5 waterfall data models (CommittedBill, YearlyBill, DiscretionaryCategory, SavingsAllocation, IncomeSource) into 3 tier-aligned Prisma models (CommittedItem, DiscretionaryItem, updated IncomeSource) plus a new Subcategory model with household-scoped defaults, updating all backend services, routes, and test infrastructure accordingly.

## Testability Improvements

- **Implemented:** 2026-03-26
- **Spec:** `docs/5. built/testability-improvements/testability-improvements-spec.md`
- **Summary:** Systematically improves backend testability by introducing DI clock parameters for date-sensitive functions, complete route test coverage across all 10 route files, a `toGBP` rounding utility, fixture snapshots for reusable test data, ReviewSession JSON validation on read, and realistic seed data for browser automation testing.
