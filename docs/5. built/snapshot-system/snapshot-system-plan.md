---
feature: snapshot-system
spec: docs/4. planning/snapshot-system/snapshot-system-spec.md
phase: 10
status: pending
---

# Snapshot System — Implementation Plan

> **For Claude:** Use `/execute-plan snapshot-system` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Verify and finalise the snapshot system — all core files are already implemented; this plan confirms correctness via test runs and type-checks.
**Spec:** `docs/4. planning/snapshot-system/snapshot-system-spec.md`
**Architecture:** All layers are complete. Prisma `Snapshot` model with `@@unique([householdId, name])` constraint. Fastify routes at `/api/snapshots` (GET list, GET :id, POST, PATCH :id, DELETE :id). Jan 1 auto-snapshot triggered server-side in the waterfall GET handler. Frontend: `SnapshotTimeline` + `SnapshotDot` + `CreateSnapshotModal` on OverviewPage; `SnapshotsSection` in Settings; income-source amount-change prompt in `ItemDetailPanel`; ReviewWizard saves snapshot on completion.
**Tech Stack:** Fastify · Prisma · Zod · React 18 · TanStack Query · Tailwind

## Pre-conditions

> What must already exist before this work starts — prior phases, existing models, shared components.

- [x] `Snapshot` model present in `apps/backend/prisma/schema.prisma` with `@@unique([householdId, name])`
- [x] `packages/shared/src/schemas/snapshot.schemas.ts` — `createSnapshotSchema`, `renameSnapshotSchema`
- [x] `apps/backend/src/services/snapshot.service.ts` — all CRUD + `ensureJan1Snapshot`
- [x] `apps/backend/src/routes/snapshots.routes.ts` — registered at `/api/snapshots` in `server.ts`
- [x] `apps/frontend/src/services/snapshot.service.ts` — all five API calls
- [x] `apps/frontend/src/hooks/useSettings.ts` — `useSnapshots`, `useSnapshot`, `useCreateSnapshot`, `useRenameSnapshot`, `useDeleteSnapshot`
- [x] `apps/frontend/src/components/overview/SnapshotTimeline.tsx` — proportional dot layout, scroll, drag, year markers
- [x] `apps/frontend/src/components/overview/SnapshotDot.tsx` — tooltip dot with auto/manual visual distinction
- [x] `apps/frontend/src/components/overview/CreateSnapshotModal.tsx` — 409 inline error
- [x] `apps/frontend/src/components/settings/SnapshotsSection.tsx` — inline rename + confirm-delete
- [x] `apps/frontend/src/pages/OverviewPage.tsx` — `selectedSnapshotId` state, snapshot view wired to `WaterfallLeftPanel`, `snapshotDate` passed to `ItemDetailPanel`
- [x] Income-source amount-change prompt in `ItemDetailPanel` (`item.type === "income_source" && parsed !== item.amount`)
- [x] ReviewWizard `handleFinish` saves snapshot via `useCreateSnapshot`
- [x] `waterfall.routes.ts` calls `snapshotService.ensureJan1Snapshot` on every GET /api/waterfall

## Tasks

> The feature is fully implemented. Tasks below verify correctness of the existing code via existing tests.

### Task 1: Run backend snapshot service tests

**Files:**

- Test: `apps/backend/src/services/snapshot.service.test.ts`

- [ ] **Step 1: Run the tests**

Run: `cd apps/backend && bun scripts/run-tests.ts snapshot`
Expected: PASS — 5 test cases across `listSnapshots`, `getSnapshot`, `createSnapshot`, `renameSnapshot`, `deleteSnapshot`

- [ ] **Step 2: Commit**

No code changes required. Proceed if all tests pass.

---

### Task 2: Run frontend snapshot component tests

**Files:**

- Test: `apps/frontend/src/components/overview/SnapshotTimeline.test.tsx`
- Test: `apps/frontend/src/components/overview/SnapshotDot.test.tsx`

- [ ] **Step 1: Run the tests**

Run: `cd apps/frontend && bun run test Snapshot`
Expected: PASS — error state, empty state, snapshot render, save button hidden when viewing

- [ ] **Step 2: Commit**

No code changes required. Proceed if all tests pass.

---

### Task 3: Type-check and lint

- [ ] **Step 1: Type-check**

Run: `bun run type-check`
Expected: zero errors

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: zero warnings

- [ ] **Step 3: Commit**

Fix any issues found, then commit with:

```bash
git add <files>
git commit -m "fix(snapshot-system): address type/lint issues"
```

---

## Testing

### Backend Tests

- [x] `listSnapshots` returns only `id, name, isAuto, createdAt` (no `data` field)
- [x] `getSnapshot` throws `NotFoundError` for missing or cross-household access
- [x] `createSnapshot` populates `data` from `getWaterfallSummary` and throws `ConflictError` on `P2002`
- [x] `renameSnapshot` throws `ConflictError` on `P2002`
- [x] `deleteSnapshot` verifies ownership before deleting

### Frontend Tests

- [x] `SnapshotTimeline` shows inline error with Retry on query failure
- [x] `SnapshotTimeline` shows "No snapshots yet" and "+ Save snapshot" when empty
- [x] `SnapshotTimeline` hides "+ Save snapshot" when `isViewingSnapshot=true`
- [x] `SnapshotTimeline` does not show left arrow at initial render

### Key Scenarios

- [ ] Happy path: Manual snapshot saved via `[+ Save snapshot]` → appears in timeline → clicking it loads snapshot data into waterfall left panel
- [ ] Snapshot view mode: all edit actions disabled in `ItemDetailPanel` (derived from `snapshotDate != null`)
- [ ] Duplicate name: saving a snapshot with an existing name shows inline 409 error in `CreateSnapshotModal`
- [ ] Income source prompt: editing an income source amount shows "Save a snapshot before updating?" prompt; Yes → opens modal; No → proceeds directly
- [ ] ReviewWizard: finishing review saves a snapshot and shows success toast
- [ ] Settings: rename and delete snapshots work with confirmation

## Verification

> Commands to run after all tasks are complete. All must pass before marking done.

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/backend && bun scripts/run-tests.ts snapshot` passes
- [ ] Manual: load Overview → no snapshots → click "+ Save snapshot" → enter name → saved → dot appears on timeline → click dot → waterfall left panel shows snapshot data → "Now" button returns to live view
- [ ] Manual: Settings → Snapshots section → rename a snapshot → confirm new name appears → delete a snapshot → confirm it's removed from timeline

## Post-conditions

- [ ] Snapshot timeline visible on OverviewPage for all households
- [ ] Settings Snapshots section available for snapshot management
- [ ] Jan 1 auto-snapshot fires silently on first waterfall load of the new year
- [ ] ReviewWizard completion creates a named snapshot
- [ ] Income source update flow prompts snapshot before any amount change
