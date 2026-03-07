# Household Profile Tab Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Household tab on ProfilePage to improve layout, consistency, and grouping.

**Architecture:** Pure UI refactor in a single component (`ProfilePage.tsx`). Three changes: move Create New Household to top, make household name always-editable (Account tab pattern), and merge Invite + Pending Invites into one card. No backend changes.

**Tech Stack:** React, TanStack Query, Tailwind CSS, shadcn/ui components, MSW + bun:test for testing.

---

## Context

### Key files
- **Component:** `apps/frontend/src/pages/ProfilePage.tsx`
- **Tests:** `apps/frontend/src/pages/ProfilePage.test.tsx`
- **MSW handlers:** `apps/frontend/src/test/msw/handlers.ts` — `householdHandlers` returns `mockHousehold` (name: `'My Household'`, role: `'owner'`)
- **Auth helper:** `apps/frontend/src/test/helpers/auth.ts` — `setAuthenticated()` sets auth store state

### How to run tests
```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx --watch
```
Or single run:
```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

### Test setup notes
- `setAuthenticated()` uses the `mockUser` from `auth.ts` which does **not** include `activeHouseholdId`
- To trigger household queries (gated on `!!activeHouseholdId`), tests must set a user with `activeHouseholdId: 'household-1'`
- Do this by passing a custom user to `setAuthenticated`:
  ```ts
  setAuthenticated({ ...mockUser, activeHouseholdId: 'household-1' } as any);
  ```
- After calling `userEvent.click(householdTab)`, use `waitFor` to let MSW data resolve

### Current Household tab render order (top → bottom)
1. Household name card (with "Rename" button toggle)
2. Members card
3. Pending Invites card *(owner only)*
4. Invite Member card *(owner only)*
5. Create New Household card

### Target render order
1. Create New Household card
2. Household name card (always-editable input)
3. Members card
4. Invite to Household card *(owner only)* — invite form + divider + pending list

---

## Task 1: Move "Create New Household" to top

**Files:**
- Modify: `apps/frontend/src/pages/ProfilePage.tsx`
- Test: `apps/frontend/src/pages/ProfilePage.test.tsx`

**Step 1: Write the failing test**

Add a new `describe` block in `ProfilePage.test.tsx`:

```ts
import userEvent from '@testing-library/user-event';
import { mockUser } from '../test/helpers/auth';

describe('ProfilePage — Household tab layout', () => {
  beforeEach(() => {
    setAuthenticated({ ...mockUser, activeHouseholdId: 'household-1' } as any);
  });

  it('shows "Create New Household" as the first card on the Household tab', async () => {
    renderWithProviders(<ProfilePage />);
    const householdTab = screen.getByRole('tab', { name: /household/i });
    await userEvent.click(householdTab);

    await waitFor(() => {
      expect(screen.getByText('Create New Household')).toBeTruthy();
    });

    // Create New Household heading must appear before Household heading in DOM
    const headings = screen.getAllByRole('heading', { level: 3 });
    const createIdx = headings.findIndex((h) => h.textContent === 'Create New Household');
    const householdIdx = headings.findIndex((h) => h.textContent === 'Household');
    expect(createIdx).toBeLessThan(householdIdx);
  });
});
```

> Note: CardTitle renders as `<h3>` — verify with your browser devtools if this assertion fails and adjust heading level accordingly.

**Step 2: Run test to verify it fails**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: FAIL — `createIdx` is greater than `householdIdx` (currently Create is at the bottom).

**Step 3: Move the Create New Household card in `ProfilePage.tsx`**

In `apps/frontend/src/pages/ProfilePage.tsx`, inside `<TabsContent value="household">`, cut the entire `{/* Create New Household */}` card block (lines 371–393) and paste it as the **first child**, before the `{/* Household Name */}` card.

The result should be:
```tsx
<TabsContent value="household" className="mt-6 space-y-6">

  {/* Create New Household */}
  <Card>
    <CardHeader>
      <CardTitle>Create New Household</CardTitle>
    ...
  </Card>

  {/* Household Name */}
  <Card>
  ...
```

**Step 4: Run test to verify it passes**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/ProfilePage.tsx apps/frontend/src/pages/ProfilePage.test.tsx
git commit -m "feat(profile): move Create New Household to top of Household tab"
```

---

## Task 2: Household name — always-editable input

**Files:**
- Modify: `apps/frontend/src/pages/ProfilePage.tsx`
- Test: `apps/frontend/src/pages/ProfilePage.test.tsx`

**Step 1: Write the failing tests**

Add to the `'ProfilePage — Household tab layout'` describe block:

```ts
it('shows the household name in an always-visible input field', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    const input = screen.getByLabelText(/household name/i) as HTMLInputElement;
    expect(input.value).toBe('My Household');
  });
});

it('has no "Rename" button on the Household tab', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /rename/i })).toBeNull();
  });
});

it('disables the Save button on the Household card when name is unchanged', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    const input = screen.getByLabelText(/household name/i) as HTMLInputElement;
    expect(input.value).toBe('My Household');
  });

  // Find the Save button closest to the household name input
  const saveButtons = screen.getAllByRole('button', { name: /^save$/i });
  // The first Save button in DOM order belongs to the Household card (Create New Household is above it but has no Save button)
  expect(saveButtons[0].hasAttribute('disabled')).toBe(true);
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: The three new tests FAIL — "Rename" button exists, no label "Household name", Save is not initially disabled.

**Step 3: Refactor state in `ProfilePage.tsx`**

**3a. Remove `isRenaming` state** (line 25):
```ts
// DELETE this line:
const [isRenaming, setIsRenaming] = useState(false);
```

**3b. Add `useEffect` to sync `renameValue` from loaded household data.**

Add the import if not already present:
```ts
import { useState, useEffect } from 'react';
```

Add after the query declarations (after line 51, where `household` is derived):
```ts
useEffect(() => {
  if (household?.name) setRenameValue(household.name);
}, [household?.name]);
```

**3c. Update `handleRenameSubmit`** — remove the `setIsRenaming(false)` and `setRenameValue('')` calls from `renameMutation.onSuccess` (they no longer make sense — the `useEffect` will re-sync the value from fresh query data):

In `renameMutation`, change `onSuccess`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
  queryClient.invalidateQueries({ queryKey: ['households'] });
  showSuccess('Household renamed');
  // isRenaming and renameValue reset removed — useEffect re-syncs from query data
},
```

**3d. Replace the Household Name card content.**

Find the `{/* Household Name */}` card's `<CardContent>` section. Replace the entire conditional (`isLoadingDetails ? ... : isRenaming ? ... : ...`) with:

```tsx
<CardContent className="pt-0">
  {isLoadingDetails ? (
    <Skeleton className="h-8 w-48" />
  ) : (
    <form onSubmit={handleRenameSubmit} className="flex items-end gap-3">
      <div className="space-y-1 flex-1 max-w-sm">
        <Label htmlFor="household-name">Household name</Label>
        <Input
          id="household-name"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Household name"
          readOnly={!isOwner}
        />
      </div>
      {isOwner && (
        <Button
          type="submit"
          disabled={
            renameMutation.isPending ||
            !renameValue.trim() ||
            renameValue.trim() === household?.name
          }
        >
          {renameMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      )}
    </form>
  )}
</CardContent>
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/ProfilePage.tsx apps/frontend/src/pages/ProfilePage.test.tsx
git commit -m "feat(profile): make household name always-editable, consistent with Account tab"
```

---

## Task 3: Merge Invite + Pending Invites into one card

**Files:**
- Modify: `apps/frontend/src/pages/ProfilePage.tsx`
- Test: `apps/frontend/src/pages/ProfilePage.test.tsx`

**Step 1: Write the failing tests**

Add to the `'ProfilePage — Household tab layout'` describe block:

```ts
it('shows "Invite to Household" card title instead of "Invite Member"', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    expect(screen.getByText('Invite to Household')).toBeTruthy();
    expect(screen.queryByText('Invite Member')).toBeNull();
  });
});

it('does not render a separate "Pending Invites" card', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    // "Pending Invites" as a card title should not exist — it's now inside the combined card
    expect(screen.queryByText('Pending Invites')).toBeNull();
  });
});

it('shows pending invites section inside the Invite to Household card', async () => {
  renderWithProviders(<ProfilePage />);
  await userEvent.click(screen.getByRole('tab', { name: /household/i }));

  await waitFor(() => {
    expect(screen.getByText('Invite to Household')).toBeTruthy();
    // The "No pending invites." message should appear inside the same card area
    expect(screen.getByText('No pending invites.')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: FAIL — "Invite Member" still exists, "Pending Invites" card title still exists.

**Step 3: Merge the two cards in `ProfilePage.tsx`**

Replace both the `{/* Pending Invites (owner only) */}` card and the `{/* Invite Member (owner only) */}` card with a single combined card. Place it after the Members card (same position the Invite card was in, but now contains both sections):

```tsx
{/* Invite to Household (owner only) */}
{isOwner && (
  <Card>
    <CardHeader>
      <CardTitle>Invite to Household</CardTitle>
    </CardHeader>
    <CardContent className="pt-0 space-y-4">
      <form onSubmit={handleInviteSubmit} className="flex items-center gap-3">
        <Input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Email address"
          className="max-w-sm"
        />
        <Button
          type="submit"
          disabled={inviteMutation.isPending || !inviteEmail.trim()}
        >
          {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Pending
        </p>
        {isLoadingDetails ? (
          <Skeleton className="h-10 w-full" />
        ) : household?.invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <div className="space-y-3">
            {household?.invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(invite.expiresAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                  onClick={() => cancelInviteMutation.mutate(invite.id)}
                  disabled={cancelInviteMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/frontend && bun test src/pages/ProfilePage.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/ProfilePage.tsx apps/frontend/src/pages/ProfilePage.test.tsx
git commit -m "feat(profile): merge Invite and Pending Invites into single Invite to Household card"
```

---

## Final verification

Run all frontend tests to confirm nothing is broken:

```bash
cd apps/frontend && bun test
```

Expected: All tests pass, no regressions.
