# FinPlan Renew — Implementation Plan

> This is the 15-phase build plan for the FinPlan rebuild. Work through it phase by phase. Each phase references the relevant feature specs in `docs/renew-finplan/backlog/` — consult those for schema, API, component, and UX details.
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild FinPlan as a waterfall-based personal financial planning tool, reusing only auth and household management, deleting everything else, and building fresh.

**Architecture:** Four pages (Overview, Wealth, Planner, Settings), all using a two-panel layout. Backend: Fastify + Prisma. Frontend: React 18 + TanStack Query + shadcn/ui.

**Tech stack:** Bun + Turborepo monorepo · PostgreSQL · Fastify · React 18 + Vite · TanStack Query · Zustand · shadcn/ui · Recharts · Zod · react-hook-form · @hookform/resolvers · date-fns · sonner

---

## What to Keep (zero changes)

```
apps/backend/src/routes/auth.routes.ts + auth.service.ts
apps/backend/src/routes/households.routes.ts + household.service.ts
apps/backend/src/routes/invites.routes.ts
apps/frontend/src/pages/auth/          (LoginPage, RegisterPage, AcceptInvitePage)
apps/frontend/src/stores/authStore.ts
apps/frontend/src/services/auth.service.ts
apps/frontend/src/services/household.service.ts
apps/frontend/src/components/layout/HouseholdSwitcher.tsx  (currently embedded in Layout.tsx — extract in Phase 7.0a)
packages/shared/                       (auth + household Zod schemas only)
All infra: Docker, docker-compose, CI, Prisma client config, Bun workspace
```

## What to Delete

**Backend:**

```
apps/backend/src/routes/   accounts, transactions, categories, assets,
                            liabilities, budgets, goals, recurring,
                            dashboard, forecasts
apps/backend/src/services/ account, transaction, category, asset,
                            liability, budget, goal, recurring,
                            dashboard, forecast
```

**Frontend:**

```
apps/frontend/src/pages/   DashboardPage, AccountsPage, TransactionsPage,
                            AssetsPage, LiabilitiesPage, BudgetsPage,
                            BudgetDetailPage, GoalsPage, ProfilePage
apps/frontend/src/components/  accounts/, transactions/, assets/,
                                liabilities/, budgets/, goals/,
                                recurring/, filters/, charts/,
                                layout/Layout.tsx
apps/frontend/src/services/    account, transaction, category, asset,
                                liability, budget, goal, recurring, dashboard
```

---

## Phase 1: Database — New Schema

**Goal:** Replace all Prisma models (except auth/household) with the new domain model.

Each feature spec's `## Implementation → Schema` section contains the relevant Prisma models. The complete schema assembles all of them. Specs to consult:

- Waterfall models → [overview-waterfall](backlog/overview-waterfall/overview-waterfall-spec.md)
- Wealth models → [wealth-accounts](backlog/wealth-accounts/wealth-accounts-spec.md)
- Planner models → [planner-purchases](backlog/planner-purchases/planner-purchases-spec.md), [planner-gifts](backlog/planner-gifts/planner-gifts-spec.md)
- Settings model → [settings](backlog/settings/settings-spec.md)
- Snapshot model → [snapshot-system](backlog/snapshot-system/snapshot-system-spec.md)
- Session models → [review-wizard](backlog/review-wizard/review-wizard-spec.md), [waterfall-creation-wizard](backlog/waterfall-creation-wizard/waterfall-creation-wizard-spec.md)

**Tasks:**

1. Rewrite `apps/backend/prisma/schema.prisma` — keep generator, datasource, auth/household models; add all new models from the specs above
2. Run migration: `cd apps/backend && bunx prisma migrate dev --name renew_schema`
3. Regenerate client: `bunx prisma generate`
4. Verify: `bun run build` — fix any TypeScript errors before proceeding

**Commit:** `chore: replace schema with renew domain model`

---

## Phase 2: Backend Cleanup

**Goal:** Delete obsolete backend files and scaffold new route stubs.

**Tasks:**

1. Delete all backend files listed in "What to Delete" above
2. In `apps/backend/src/server.ts` (or `index.ts`), remove deleted route registrations. Add stubs:
   ```typescript
   fastify.register(waterfallRoutes, { prefix: "/api/waterfall" });
   fastify.register(wealthRoutes, { prefix: "/api/wealth" });
   fastify.register(plannerRoutes, { prefix: "/api/planner" });
   fastify.register(settingsRoutes, { prefix: "/api/settings" });
   fastify.register(snapshotRoutes, { prefix: "/api/snapshots" });
   fastify.register(reviewRoutes, { prefix: "/api/review-session" });
   fastify.register(setupRoutes, { prefix: "/api/setup-session" });
   ```
   Create empty stub files for each (e.g. `export async function waterfallRoutes(fastify: FastifyInstance) {}`)
3. In `household.service.ts`, after creating a new household, also create `HouseholdSettings` with defaults:
   ```typescript
   await prisma.householdSettings.create({ data: { householdId: household.id } });
   ```
4. Verify: `bun run dev` — server starts, auth + household endpoints respond

**Commit:** `chore: remove obsolete routes/services, scaffold new route stubs`

---

## Phase 3: Backend — Waterfall APIs

**Specs:** [overview-waterfall](backlog/overview-waterfall/overview-waterfall-spec.md) · [overview-item-detail](backlog/overview-item-detail/overview-item-detail-spec.md) · [yearly-bills-calendar](backlog/yearly-bills-calendar/yearly-bills-calendar-spec.md)

Create `apps/backend/src/services/waterfall.service.ts` and `apps/backend/src/routes/waterfall.routes.ts`. All routes, types, and business logic (WaterfallSummary shape, CashflowMonth algorithm, history recording, confirm) are specified in the spec Implementation sections above.

Also implement `POST /api/waterfall/confirm-batch` — accepts `{ items: [{ type: WaterfallItemType, id: string }] }`, updates `lastReviewedAt` on all specified items in a single transaction.

Also update `packages/shared/src/schemas/` — add Zod schemas for waterfall types.

**Testing:** Test that `POST /api/waterfall/:type/:id/confirm` updates `lastReviewedAt` to current timestamp. Test that `POST /api/waterfall/confirm-batch` updates all specified items. Test that editing an item value also updates `lastReviewedAt`. These tests form the contract that Phase 12 (staleness indicators) relies on.

**Commit:** `feat: waterfall APIs — income, bills, discretionary, savings, history`

---

## Phase 4: Backend — Wealth APIs

**Specs:** [wealth-accounts](backlog/wealth-accounts/wealth-accounts-spec.md) · [wealth-isa-tracking](backlog/wealth-isa-tracking/wealth-isa-tracking-spec.md) · [wealth-trust-savings](backlog/wealth-trust-savings/wealth-trust-savings-spec.md)

Create `apps/backend/src/services/wealth.service.ts` and `apps/backend/src/routes/wealth.routes.ts`. WealthSummary shape, projection formula, ISA allowance calculation, and ytdChange logic are all in the spec Implementation sections.

Also update `packages/shared/src/schemas/` — add Zod schemas for wealth types (WealthAccount, WealthSummary, AssetClass enum, WealthAccountHistory).

Also implement `POST /api/wealth/accounts/confirm-batch` — accepts `{ ids: string[] }`, updates `lastReviewedAt` on all specified accounts.

**Testing:** Test that `POST /api/wealth/accounts/:id/confirm` and `POST /api/wealth/accounts/confirm-batch` update `lastReviewedAt`. Test that `POST /api/wealth/accounts/:id/valuation` updates both `valuationDate` and `lastReviewedAt`. These tests form the contract that Phase 12 (staleness indicators) relies on.

**Commit:** `feat: wealth APIs — accounts, valuation history, ISA allowance, projections`

---

## Phase 5: Backend — Planner APIs

**Specs:** [planner-purchases](backlog/planner-purchases/planner-purchases-spec.md) · [planner-gifts](backlog/planner-gifts/planner-gifts-spec.md)

Create `apps/backend/src/utils/gift-dates.ts` (ukMothersDay, ukFathersDay, nextEventDate), `apps/backend/src/services/planner.service.ts`, and `apps/backend/src/routes/planner.routes.ts`. Gift date algorithm signatures and all API routes are in the spec Implementation sections.

Also update `packages/shared/src/schemas/` — add Zod schemas for planner types (PurchaseItem, PurchasePriority, PurchaseStatus, GiftPerson, GiftEvent, GiftEventType, GiftRecurrence, GiftYearRecord, PlannerYearBudget).

**Commit:** `feat: planner APIs — purchases, gift persons/events, UK date utilities`

---

## Phase 6: Backend — Settings, Snapshots, Sessions

**Specs:** [settings](backlog/settings/settings-spec.md) · [snapshot-system](backlog/snapshot-system/snapshot-system-spec.md) · [review-wizard](backlog/review-wizard/review-wizard-spec.md) · [waterfall-creation-wizard](backlog/waterfall-creation-wizard/waterfall-creation-wizard-spec.md)

Create four route files: `settings.routes.ts`, `snapshots.routes.ts`, `review-session.routes.ts`, `setup-session.routes.ts`. Note: snapshot creation auto-populates `data` by calling `waterfallService.getWaterfallSummary()`. Auto Jan 1 snapshot logic lives in the waterfall summary endpoint.

Also update `packages/shared/src/schemas/` — add Zod schemas for settings, snapshot, review session, and setup session types.

**Commit:** `feat: settings, snapshot, and wizard session APIs`

---

## Phase 7: Frontend Foundation

**Goal:** New routing, two-panel layout, top nav, frontend services, utilities, and foundation UI primitives.

**Specs:** [foundation-ui-primitives](backlog/foundation-ui-primitives/foundation-ui-primitives-spec.md) · [nudge-card](backlog/nudge-card/nudge-card-spec.md) · [definition-tooltip](backlog/definition-tooltip/definition-tooltip-spec.md)

**Tasks:**

**7.0a** Extract `HouseholdSwitcher` from `apps/frontend/src/components/layout/Layout.tsx` into its own file at `apps/frontend/src/components/layout/HouseholdSwitcher.tsx`. Change navigation target from `/dashboard` to `/overview`.

**7.0b** Install dependencies needed across frontend phases: `bun add date-fns recharts`

**7.1** Delete all frontend files and directories listed in "What to Delete" above. Run `bun run build`; fix import errors.

**7.2** Update `apps/frontend/src/App.tsx` — replace protected routes:

```tsx
<Route path="/"         element={<Navigate to="/overview" replace />} />
<Route path="/overview" element={<OverviewPage />} />
<Route path="/wealth"   element={<WealthPage />} />
<Route path="/planner"  element={<PlannerPage />} />
<Route path="/settings" element={<SettingsPage />} />
```

Create stub page files (each renders `<div>Coming soon</div>`).

**7.3** Create `apps/frontend/src/components/layout/TwoPanelLayout.tsx`:

```tsx
interface TwoPanelLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode | null;
  rightPlaceholder?: string; // default: "Select any item to see its detail"
}
// <div className="flex h-full overflow-hidden">
//   <aside className="w-[360px] min-w-[360px] border-r overflow-y-auto shrink-0 p-4">{left}</aside>
//   <main className="flex-1 overflow-y-auto p-6">{right ?? <PlaceholderMessage />}</main>
// </div>
// PlaceholderMessage: centred, text-muted-foreground, italic
```

**7.4** Create `apps/frontend/src/components/layout/Layout.tsx`:

```tsx
const navItems = [
  { label: "Overview", path: "/overview" },
  { label: "Wealth", path: "/wealth" },
  { label: "Planner", path: "/planner" },
  { label: "Settings", path: "/settings" },
];
// Top bar layout:
//   Left: "finplan" wordmark + <HouseholdSwitcher>
//   Centre: nav items with active state via useLocation
//   Right: user display name + "Sign out" button
// Include <Toaster position="bottom-right" richColors /> (sonner)
```

**7.5** Create frontend services following the HTTP client pattern from `auth.service.ts`:

- `apps/frontend/src/services/waterfall.service.ts`
- `apps/frontend/src/services/wealth.service.ts`
- `apps/frontend/src/services/planner.service.ts`
- `apps/frontend/src/services/settings.service.ts`
- `apps/frontend/src/services/snapshot.service.ts`

**7.6** Create `apps/frontend/src/utils/format.ts`:

```typescript
export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatPct = (n: number): string => `${n.toFixed(2)}%`;
```

Use `formatCurrency` everywhere a £ value is displayed.

**7.7** In `apps/frontend/src/main.tsx`, configure QueryClient with a global 401 handler that calls `useAuthStore.getState().clearAuth()` and redirects to `/login` (not `/dashboard`). Verify `clearAuth()` triggers navigation correctly. Add `<Toaster />` in Layout.tsx. Install: `bun add sonner`

**7.8** Confirm form stack: `react-hook-form` + `@hookform/resolvers/zod` + shadcn `<Form>`. Install if needed: `bun add react-hook-form @hookform/resolvers`. This is the standard pattern for every form in the app.

**7.9** Create `DefinitionTooltip` component → see [definition-tooltip](backlog/definition-tooltip/definition-tooltip-spec.md) for the full DEFINITIONS dictionary and all prescribed placements.

**7.10** Create `apps/frontend/src/utils/motion.ts` — export `usePrefersReducedMotion()` hook (reads `prefers-reduced-motion: reduce` media query). All animated components must check this.

**7.11** Build foundation UI primitives → see [foundation-ui-primitives](backlog/foundation-ui-primitives/foundation-ui-primitives-spec.md):

- `SkeletonLoader.tsx` — left panel + right panel variants, shimmer animation, `prefers-reduced-motion` support
- `StaleDataBanner.tsx` — amber sync-failure banner, auto-retry, auto-dismiss
- `ButtonPair.tsx` — rightmost button always affirmative, all five button states
- `EntityAvatar.tsx` — curated logo → uploaded image → initials fallback
- `PanelTransition.tsx` — directional slide animations (deeper/shallower/empty), `prefers-reduced-motion` support

**7.12** Build `NudgeCard` component shell → see [nudge-card](backlog/nudge-card/nudge-card-spec.md). Build the presentational component only; contextual nudge logic is wired in Phases 8 and 9.

**7.13** Verify: navigate to `/overview`, `/wealth`, `/planner`, `/settings` — all render without errors.

**Commit:** `feat: frontend foundation — routing, two-panel layout, new nav, service stubs`

---

## Phase 8: Frontend — Overview Page

**Specs:** [overview-waterfall](backlog/overview-waterfall/overview-waterfall-spec.md) · [overview-item-detail](backlog/overview-item-detail/overview-item-detail-spec.md) · [yearly-bills-calendar](backlog/yearly-bills-calendar/yearly-bills-calendar-spec.md) · [overview-snapshot-timeline](backlog/overview-snapshot-timeline/overview-snapshot-timeline-spec.md)

Build: TanStack Query hooks (`useWaterfall.ts`), `WaterfallLeftPanel`, `ItemDetailPanel`, `HistoryChart`, `CashflowCalendar`. Stub the `[Review ▸]` button (`console.log('open review')`) and the waterfall setup wizard CTA (`console.log('open wizard')`). Stub the snapshot timeline area with a placeholder (full snapshot UI is built in Phase 13).

Build "End income source" flow in `ItemDetailPanel`: inline prompt "When did this income end?" with date input (default today), calls `POST /api/waterfall/income/:id/end`. Source removed from live waterfall; history preserved. Reactivation available from Settings → Income sources (ended list).

HistoryChart: set `isAnimationActive={!prefersReducedMotion}` on all Recharts components via the `usePrefersReducedMotion()` hook.

**Commit:** `feat: overview page — waterfall, item detail, history charts, cashflow`

---

## Phase 9: Frontend — Wealth Page

**Specs:** [wealth-accounts](backlog/wealth-accounts/wealth-accounts-spec.md) · [wealth-isa-tracking](backlog/wealth-isa-tracking/wealth-isa-tracking-spec.md) · [wealth-trust-savings](backlog/wealth-trust-savings/wealth-trust-savings-spec.md)

Build: TanStack Query hooks (`useWealth.ts`), `WealthLeftPanel`, `AccountListPanel`, ISA allowance bar, `AccountDetailPanel`.

**Commit:** `feat: wealth page — accounts, valuations, ISA bar, projections, nudges`

---

## Phase 10: Frontend — Planner Page

**Specs:** [planner-purchases](backlog/planner-purchases/planner-purchases-spec.md) · [planner-gifts](backlog/planner-gifts/planner-gifts-spec.md)

Build: TanStack Query hooks (`usePlanner.ts`), `PlannerLeftPanel`, `PurchaseListPanel`, gift panels (upcoming view, by-person view, `GiftPersonDetailPanel`). Year selector in page header.

**Commit:** `feat: planner page — purchases, gifts, upcoming/by-person views`

---

## Phase 11: Frontend — Settings Page

**Specs:** [settings](backlog/settings/settings-spec.md) · [household-management](backlog/household-management/household-management-spec.md)

**Tasks:**

**11.1** Create `SettingsPage.tsx` with left nav listing all sections. Wire routing so each section scrolls-to or tab-selects.

**11.2** Profile section — name edit form, calls `PATCH /api/auth/me { name }`.

**11.3** Staleness thresholds section — per-type threshold inputs (income_source, committed_bill, yearly_bill, discretionary_category, savings_allocation, wealth_account). Calls `PATCH /api/settings`.

**11.4** Surplus benchmark section — percentage input. Calls `PATCH /api/settings`.

**11.5** ISA tax year section — month + day inputs, label "UK default: 6 April. Only change if you are in a different jurisdiction." Calls `PATCH /api/settings`.

**11.6** Household management section — member list with roles, invite flow (create invite link + QR), remove member (owner only), rename household. Uses existing household API endpoints.

**11.7** Snapshot manager section — list snapshots, rename (inline edit, 409 on duplicate), delete with confirmation. Uses snapshot API endpoints.

**11.8** Income sources (ended) section — list ended income sources with reactivation option. Calls `POST /api/waterfall/income/:id/reactivate`.

**11.9** Waterfall rebuild section — "Rebuild from scratch" button with destructive confirmation. Calls `DELETE /api/waterfall/all` then opens WaterfallSetupWizard.

**11.10** Verify: all sections render and save correctly.

**Commit:** `feat: settings page — all sections, household management, snapshot manager`

---

## Phase 12: Staleness System

**Spec:** [staleness-indicators](backlog/staleness-indicators/staleness-indicators-spec.md)

Build `apps/frontend/src/utils/staleness.ts` and `StalenessIndicator.tsx`. Wire tier-level attention badges (amber dot + stale count) into `WaterfallLeftPanel` tier rows. Wire per-item `StalenessIndicator` (5px amber dot + detail text) into right panel item lists, `ItemDetailPanel`, `AccountListPanel`, and `AccountDetailPanel`. (`date-fns` already installed in Phase 7.)

**Commit:** `feat: staleness indicators — overview and wealth pages`

---

## Phase 13: Snapshot System

**Specs:** [snapshot-system](backlog/snapshot-system/snapshot-system-spec.md) · [overview-snapshot-timeline](backlog/overview-snapshot-timeline/overview-snapshot-timeline-spec.md)

Build `SnapshotTimeline.tsx` (proportional dot positioning, `[+ Save snapshot]` button, ◂/▸ gap navigation arrows, hover names/dates on dots). Build `CreateSnapshotModal.tsx` (name input pre-populated "Month Year", editable; 409 duplicate name → inline error).

Wire snapshot mode into `OverviewPage`: `viewingSnapshot` state; pass `snapshot.data` to left panel; pass `snapshotDate` to all `HistoryChart` instances (renders amber dashed ReferenceLine); disable all edit actions; show "Return to current ▸" exit.

Wire all three creation triggers:

1. **Auto Jan 1** — server-side, already in Phase 6 waterfall summary endpoint
2. **Review wizard completion** — wired in Phase 14
3. **Income source amount change** — detect amount change in income edit form → prompt "Save a snapshot before updating?" → Yes opens `CreateSnapshotModal` → on save, proceed with update; No proceeds directly

**Commit:** `feat: snapshot system — timeline, read-only view, creation triggers, modal`

---

## Phase 14: Review Wizard

**Spec:** [review-wizard](backlog/review-wizard/review-wizard-spec.md)

Build `ReviewWizard.tsx` as a full-screen overlay. Session lifecycle, step data sources, item card interactions, and "Save & finish" flow are all in the spec.

**Commit:** `feat: review wizard — 6 steps, staleness sorting, inline edit, snapshot on finish`

---

## Phase 15: Waterfall Creation Wizard

**Spec:** [waterfall-creation-wizard](backlog/waterfall-creation-wizard/waterfall-creation-wizard-spec.md)

Build `WaterfallSetupWizard.tsx`. Wire entry points: Overview empty state CTA (was stubbed in Phase 8) and Settings → Waterfall → Rebuild. Step content, session lifecycle, and finish flow are all in the spec.

**Commit:** `feat: waterfall creation wizard — 7 steps, exit/resume, opening snapshot`

---

## Verification

After all phases, run these end-to-end journeys:

1. **New user setup** — register → empty Overview → wizard CTA → complete 7 steps → Overview shows waterfall with surplus
2. **Review Wizard** — open → items sorted stale-first → update one → confirm all remaining → summary → save snapshot → timeline dot appears → click dot → read-only view
3. **Cashflow calendar** — add yearly bills including two in same month → Committed → Yearly → cashflow calendar → shortfall nudge visible
4. **Wealth page** — add savings account → update valuation → history chart shows point; add ISA account → ISA bar appears → enter `isaYearContribution`
5. **Planner** — add purchase → schedule it → budget amber indicator; add gift person → add birthday → appears in Upcoming view
6. **Staleness** — set threshold to 0 in Settings → all items show amber dot (●)
7. **Snapshot uniqueness** — save two snapshots with same name → inline error
8. **Multi-household** — create second household → switch → waterfall is independent
9. **Trust savings** — create WealthAccount with `isTrust: true` → appears in "Held on behalf of" → excluded from net worth
10. **Build check** — `bun run build && bun run lint` from repo root — must pass clean
