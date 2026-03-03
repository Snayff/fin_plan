# User Profile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/profile` page accessible via a header dropdown, combining name editing and full household management, while removing the now-redundant `HouseholdSettingsPage`.

**Architecture:** Backend adds `PATCH /api/auth/me` for name updates. Frontend adds a `ProfilePage` with Account + Household tabs using the existing Shadcn `Tabs` component. The header user-name span becomes a custom dropdown (same pattern as the existing inline `HouseholdSwitcher` in `Layout.tsx`). The old `HouseholdSettingsPage` is deleted entirely.

**Tech Stack:** React 18 + React Router v7, Zustand, TanStack React Query, Tailwind + Shadcn UI, Fastify backend, Bun test runner.

---

## Reference: Key existing utilities to reuse

- `useAuthStore()` — `apps/frontend/src/stores/authStore.ts` — `user`, `accessToken`, `setUser`, `logout`
- `householdService` — `apps/frontend/src/services/household.service.ts` — `getHouseholds`, `getHouseholdDetails`, `renameHousehold`, `inviteMember`, `removeMember`, `cancelInvite`, `createHousehold`, `switchHousehold`
- `authService` — `apps/frontend/src/services/auth.service.ts` — `getCurrentUser`
- `showSuccess`, `showError` — `apps/frontend/src/lib/toast.ts`
- Shadcn UI components: `Tabs/TabsList/TabsTrigger/TabsContent`, `Card/CardHeader/CardTitle/CardContent`, `Button`, `Input`, `Label`, `Badge`, `Skeleton`
- Custom dropdown pattern — see `HouseholdSwitcher` in `apps/frontend/src/components/layout/Layout.tsx:42-98`
- Auth routes test pattern — `apps/backend/src/routes/auth.routes.test.ts`

---

## Task 1: Backend — PATCH /api/auth/me endpoint

**Files:**
- Modify: `apps/backend/src/services/auth.service.ts`
- Modify: `apps/backend/src/routes/auth.routes.ts`
- Modify: `apps/backend/src/routes/auth.routes.test.ts`

### Step 1: Add the failing test

Open `apps/backend/src/routes/auth.routes.test.ts`.

Add `updateUserName: mock(() => {})` to the `fns` object in the `mock.module("../services/auth.service", ...)` call at the top of the file:

```ts
const fns = {
  register: mock(() => {}),
  login: mock(() => {}),
  findUserById: mock(() => {}),
  refreshAccessToken: mock(() => {}),
  revokeAllUserTokens: mock(() => Promise.resolve()),
  getUserSessions: mock(() => Promise.resolve([])),
  revokeSession: mock(() => Promise.resolve(true)),
  updateUserName: mock(() => {}),   // ADD THIS LINE
};
```

Then add this describe block at the end of the file:

```ts
describe("PATCH /api/auth/me", () => {
  it("returns 200 with updated user when authenticated", async () => {
    const updatedUser = { id: "user-1", email: "test@test.com", name: "New Name" };
    (authService.updateUserName as any).mockResolvedValue(updatedUser);

    const response = await app.inject({
      method: "PATCH",
      url: "/api/auth/me",
      headers: { Authorization: "Bearer valid-token" },
      payload: { name: "New Name" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.name).toBe("New Name");
    expect(authService.updateUserName).toHaveBeenCalledWith("user-1", "New Name");
  });

  it("returns 400 when name is empty", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/auth/me",
      headers: { Authorization: "Bearer valid-token" },
      payload: { name: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    (authMiddleware as any).mockImplementationOnce(() => {
      throw new AuthenticationError("No authorization token provided");
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/api/auth/me",
      payload: { name: "New Name" },
    });

    expect(response.statusCode).toBe(401);
  });
});
```

### Step 2: Run tests to confirm they fail

Run from the repo root:
```bash
cd apps/backend && bun test src/routes/auth.routes.test.ts
```

Expected: The three new tests FAIL with something like "route not found" or "updateUserName is not a function".

### Step 3: Add updateUserName to auth service

Open `apps/backend/src/services/auth.service.ts`.

Add this method after `findUserByEmail` (around line 208):

```ts
/**
 * Update user display name
 */
async updateUserName(userId: string, name: string): Promise<Omit<User, 'passwordHash'>> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
},
```

### Step 4: Add PATCH /me route to auth routes

Open `apps/backend/src/routes/auth.routes.ts`.

Add this schema at the top with the other schemas (around line 38):

```ts
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});
```

Add this route handler inside `authRoutes`, after the `GET /me` handler (after line 185):

```ts
/**
 * PATCH /api/auth/me
 * Update current user profile (name)
 */
fastify.patch('/me', { preHandler: authMiddleware }, async (request, reply) => {
  const userId = request.user!.userId;
  const body = updateProfileSchema.parse(request.body);
  const user = await authService.updateUserName(userId, body.name);
  return reply.status(200).send({ user });
});
```

### Step 5: Run tests to confirm they pass

```bash
cd apps/backend && bun test src/routes/auth.routes.test.ts
```

Expected: All tests PASS.

### Step 6: Commit

```bash
git add apps/backend/src/services/auth.service.ts apps/backend/src/routes/auth.routes.ts apps/backend/src/routes/auth.routes.test.ts
git commit -m "feat: add PATCH /api/auth/me endpoint for profile name update"
```

---

## Task 2: Frontend auth service — updateProfile method

**Files:**
- Modify: `apps/frontend/src/services/auth.service.ts`

### Step 1: Add updateProfile method

Open `apps/frontend/src/services/auth.service.ts`.

Add this method to the `authService` object, after `getCurrentUser`:

```ts
async updateProfile(token: string, data: { name: string }): Promise<{ user: User }> {
  return apiClient.patch<{ user: User }>('/api/auth/me', data, token);
},
```

### Step 2: Commit

```bash
git add apps/frontend/src/services/auth.service.ts
git commit -m "feat: add updateProfile method to frontend auth service"
```

---

## Task 3: Layout.tsx — header dropdown + HouseholdSwitcher cleanup

**Files:**
- Modify: `apps/frontend/src/components/layout/Layout.tsx`

There are two changes in this file:
1. In `HouseholdSwitcher` (lines 11-98): remove "Household settings" button, change "Create household" to navigate to `/profile`
2. In `Layout` (lines 104-193): add user menu dropdown, remove standalone Sign Out button

### Step 1: Update HouseholdSwitcher footer

Find the footer section inside `HouseholdSwitcher` (lines 76-91):

```tsx
<div className="border-t border-border mt-1 pt-1">
  <button
    onClick={() => { setOpen(false); navigate("/settings/household"); }}
    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <PlusIcon className="h-4 w-4" />
    Create household
  </button>
  <button
    onClick={() => { setOpen(false); navigate("/settings/household"); }}
    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <SettingsIcon className="h-4 w-4" />
    Household settings
  </button>
</div>
```

Replace with (only the Create household button, pointing to `/profile`):

```tsx
<div className="border-t border-border mt-1 pt-1">
  <button
    onClick={() => { setOpen(false); navigate("/profile"); }}
    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <PlusIcon className="h-4 w-4" />
    Create household
  </button>
</div>
```

### Step 2: Remove unused SettingsIcon import

Update the import on line 9:

```tsx
import { MenuIcon, ChevronDownIcon, HomeIcon, PlusIcon, SettingsIcon } from "lucide-react";
```

Change to:

```tsx
import { MenuIcon, ChevronDownIcon, HomeIcon, PlusIcon } from "lucide-react";
```

### Step 3: Add user menu state and navigate to Layout component

In the `Layout` function body (after line 106), add:

```tsx
const navigate = useNavigate();
const [userMenuOpen, setUserMenuOpen] = useState(false);
```

### Step 4: Replace header user name + Sign Out with dropdown

Find the right-side header section (lines 175-184):

```tsx
<div className="flex items-center gap-3">
  <HouseholdSwitcher />
  <span className="hidden sm:block text-sm text-muted-foreground">{user?.name}</span>
  <button
    onClick={logout}
    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
  >
    Sign Out
  </button>
</div>
```

Replace with:

```tsx
<div className="flex items-center gap-3">
  <HouseholdSwitcher />
  <div className="relative hidden sm:block">
    <button
      onClick={() => setUserMenuOpen((v) => !v)}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
    >
      {user?.name}
      <ChevronDownIcon className="h-3 w-3 shrink-0" />
    </button>
    {userMenuOpen && (
      <>
        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
        <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-md border border-border bg-card shadow-lg">
          <div className="py-1">
            <button
              onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              View Profile
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => { setUserMenuOpen(false); logout(); }}
              className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </>
    )}
  </div>
</div>
```

Note: `ChevronDownIcon` is already imported (used in HouseholdSwitcher). `useState` is already imported. `useNavigate` is already imported.

### Step 5: Verify the file compiles (no TS errors)

```bash
cd apps/frontend && bun run typecheck 2>&1 | head -30
```

Expected: No errors related to Layout.tsx.

### Step 6: Commit

```bash
git add apps/frontend/src/components/layout/Layout.tsx
git commit -m "feat: add user profile dropdown to header, clean up HouseholdSwitcher"
```

---

## Task 4: Router — add /profile route, remove /settings/household

**Files:**
- Modify: `apps/frontend/src/App.tsx`
- Delete: `apps/frontend/src/pages/HouseholdSettingsPage.tsx`

### Step 1: Update App.tsx

Open `apps/frontend/src/App.tsx`.

Remove the HouseholdSettingsPage import (line 12):
```tsx
import HouseholdSettingsPage from "./pages/HouseholdSettingsPage";
```

Add ProfilePage import after DashboardPage (line 11):
```tsx
import ProfilePage from "./pages/ProfilePage";
```

Inside the protected routes (around line 88), remove:
```tsx
<Route path="/settings/household" element={<HouseholdSettingsPage />} />
```

And add:
```tsx
<Route path="/profile" element={<ProfilePage />} />
```

### Step 2: Delete HouseholdSettingsPage.tsx

```bash
rm apps/frontend/src/pages/HouseholdSettingsPage.tsx
```

### Step 3: Verify the router compiles

```bash
cd apps/frontend && bun run typecheck 2>&1 | head -30
```

Expected: No errors (ProfilePage will exist after Task 5 — create a stub first if needed).

### Step 4: Commit

```bash
git add apps/frontend/src/App.tsx
git rm apps/frontend/src/pages/HouseholdSettingsPage.tsx
git commit -m "feat: replace /settings/household route with /profile, remove HouseholdSettingsPage"
```

---

## Task 5: Create ProfilePage.tsx

**Files:**
- Create: `apps/frontend/src/pages/ProfilePage.tsx`

### Step 1: Create the file

Create `apps/frontend/src/pages/ProfilePage.tsx` with this content:

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth.service';
import { householdService } from '../services/household.service';
import { showSuccess, showError } from '../lib/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, accessToken, setUser } = useAuthStore();
  const activeHouseholdId = user?.activeHouseholdId ?? null;

  // Account tab state
  const [nameValue, setNameValue] = useState(user?.name ?? '');

  // Household tab — rename state
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Household tab — invite state
  const [inviteEmail, setInviteEmail] = useState('');

  // Household tab — create new household state
  const [newHouseholdName, setNewHouseholdName] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: householdsData } = useQuery({
    queryKey: ['households'],
    queryFn: () => householdService.getHouseholds(),
    enabled: !!activeHouseholdId,
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['household-details', activeHouseholdId],
    queryFn: () => householdService.getHouseholdDetails(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  });

  const currentMembership = householdsData?.households.find(
    (m) => m.householdId === activeHouseholdId
  );
  const isOwner = currentMembership?.role === 'owner';
  const household = detailsData?.household;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => authService.updateProfile(accessToken!, { name }),
    onSuccess: ({ user: updatedUser }) => {
      setUser(updatedUser, accessToken!);
      showSuccess('Name updated');
    },
    onError: (err: Error) => showError(err.message || 'Failed to update name'),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => householdService.renameHousehold(activeHouseholdId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      showSuccess('Household renamed');
      setIsRenaming(false);
      setRenameValue('');
    },
    onError: (err: Error) => showError(err.message || 'Failed to rename household'),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => householdService.inviteMember(activeHouseholdId!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Invite sent');
      setInviteEmail('');
    },
    onError: (err: Error) => showError(err.message || 'Failed to send invite'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => householdService.removeMember(activeHouseholdId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Member removed');
    },
    onError: (err: Error) => showError(err.message || 'Failed to remove member'),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => householdService.cancelInvite(activeHouseholdId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details', activeHouseholdId] });
      showSuccess('Invite cancelled');
    },
    onError: (err: Error) => showError(err.message || 'Failed to cancel invite'),
  });

  const createHouseholdMutation = useMutation({
    mutationFn: async (name: string) => {
      const { household } = await householdService.createHousehold(name);
      await householdService.switchHousehold(household.id);
      return household;
    },
    onSuccess: async (newHousehold) => {
      const { user: updatedUser } = await authService.getCurrentUser(accessToken!);
      setUser(updatedUser, accessToken!);
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['household-details'] });
      showSuccess(`'${newHousehold.name}' created and set as active`);
      setNewHouseholdName('');
    },
    onError: (err: Error) => showError(err.message || 'Failed to create household'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) return;
    updateNameMutation.mutate(trimmed);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    renameMutation.mutate(trimmed);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;
    inviteMutation.mutate(trimmed);
  };

  const handleCreateHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHouseholdName.trim();
    if (!trimmed) return;
    createHouseholdMutation.mutate(trimmed);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
        </TabsList>

        {/* ── Account Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Name</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleNameSubmit} className="flex items-end gap-3">
                <div className="space-y-1 flex-1 max-w-sm">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    updateNameMutation.isPending ||
                    !nameValue.trim() ||
                    nameValue.trim() === user?.name
                  }
                >
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Household Tab ────────────────────────────────────────────────── */}
        <TabsContent value="household" className="mt-6 space-y-6">

          {/* Household Name */}
          <Card>
            <CardHeader>
              <CardTitle>Household</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingDetails ? (
                <Skeleton className="h-8 w-48" />
              ) : isRenaming ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-3">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="max-w-sm"
                    autoFocus
                    placeholder="Household name"
                  />
                  <Button
                    type="submit"
                    disabled={renameMutation.isPending || !renameValue.trim()}
                  >
                    {renameMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsRenaming(false); setRenameValue(''); }}
                    disabled={renameMutation.isPending}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-foreground">{household?.name}</span>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setRenameValue(household?.name ?? ''); setIsRenaming(true); }}
                    >
                      Rename
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {isLoadingDetails ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : household?.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found.</p>
              ) : (
                household?.members.map((member) => {
                  const isSelf = member.user.id === user?.id;
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                        {isOwner && !isSelf && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                            onClick={() => removeMemberMutation.mutate(member.user.id)}
                            disabled={removeMemberMutation.isPending}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Pending Invites (owner only) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {isLoadingDetails ? (
                  <Skeleton className="h-10 w-full" />
                ) : household?.invites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  household?.invites.map((invite) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Invite Member (owner only) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
              </CardContent>
            </Card>
          )}

          {/* Create New Household */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Household</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleCreateHousehold} className="flex items-center gap-3">
                <Input
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  placeholder="Household name"
                  className="max-w-sm"
                />
                <Button
                  type="submit"
                  disabled={createHouseholdMutation.isPending || !newHouseholdName.trim()}
                >
                  {createHouseholdMutation.isPending ? 'Creating...' : 'Create Household'}
                </Button>
              </form>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 2: Run typecheck

```bash
cd apps/frontend && bun run typecheck 2>&1 | head -40
```

Expected: No errors.

### Step 3: Commit

```bash
git add apps/frontend/src/pages/ProfilePage.tsx
git commit -m "feat: add ProfilePage with Account and Household tabs"
```

---

## Verification (end-to-end smoke test)

Start the app:
```bash
bun dev
```

Then verify each of these manually:

1. **Header dropdown**: Log in → user name in header is clickable → dropdown shows "View Profile" and "Sign Out"
2. **Navigate to profile**: Click "View Profile" → lands on `/profile` with Account + Household tabs
3. **Name update**: Account tab → change name → click Save → header updates to new name
4. **Household rename (owner)**: Household tab → click Rename → save → name updates
5. **Invite (owner)**: Enter an email → Send Invite → invite appears in Pending Invites
6. **Cancel invite (owner)**: Click Cancel on a pending invite → invite disappears
7. **Remove member (owner)**: Click Remove on a member → member removed from list
8. **Member view**: Log in as a non-owner member → confirm Rename, Remove, Send Invite controls are hidden
9. **Create household**: Household tab → fill in "Create New Household" → creates and switches to new household
10. **Old route gone**: Navigate to `/settings/household` → redirects (catches the `/*` protected route) or 404s gracefully
11. **HouseholdSwitcher**: "Create household" link → navigates to `/profile`; "Household settings" link is gone

---

## Run all backend tests

```bash
cd apps/backend && bun test
```

Expected: All tests pass.
