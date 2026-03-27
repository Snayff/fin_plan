---
feature: household-management
spec: docs/4. planning/household-management/household-management-spec.md
phase: 2
status: pending
---

# Household Management — Implementation Plan

> **For Claude:** Use `/execute-plan household-management` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Complete the household management feature by adding the missing `leaveHousehold` capability — the only acceptance criterion not yet satisfied.
**Spec:** `docs/4. planning/household-management/household-management-spec.md`
**Architecture:** All household CRUD, invite flow (QR + URL), role enforcement, HouseholdSwitcher, and AcceptInvitePage are already implemented. The remaining work is: (1) a `leaveHousehold` service method with sole-owner guard and active-household handoff, (2) its route, (3) a frontend API method + hook, and (4) a leave button in HouseholdSection with confirmation dialog. Also fixes an existing bug where AcceptInvitePage redirects to `/dashboard` (a non-existent route) instead of `/overview`.
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind

## Pre-conditions

- [ ] Phase 1 complete: auth, household creation, invite flow, member management all exist
- [ ] `HouseholdSection.tsx`, `HouseholdSwitcher.tsx`, `AcceptInvitePage.tsx` are all present
- [ ] `ConfirmDialog` component exists at `apps/frontend/src/components/ui/ConfirmDialog.tsx`

## Context

The spec's acceptance criteria are almost entirely satisfied by the existing codebase (roles, invite flow with QR code, rename, remove member, rate limiting, accept invite flows). The only unmet criterion is **"A member can leave at any time"** (and the related guard: "An owner cannot leave if they are the sole owner"). This plan implements `leaveHousehold` end-to-end plus fixes a redirect bug.

---

## Tasks

### Task 1: Backend — leaveHousehold Service Method

**Files:**

- Modify: `apps/backend/src/services/household.service.ts`
- Modify: `apps/backend/src/services/household.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/backend/src/services/household.service.test.ts` (after the existing test blocks):

```typescript
describe("householdService.leaveHousehold", () => {
  it("removes a regular member from the household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.householdMember.delete).toHaveBeenCalledWith({
      where: {
        householdId_userId: { householdId: "household-1", userId: "user-1" },
      },
    });
  });

  it("throws NotFoundError if the user is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);

    await expect(householdService.leaveHousehold("household-1", "user-1")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws ValidationError if the user is the sole owner", async () => {
    const member = buildHouseholdMember({ role: "owner" });
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.count.mockResolvedValue(1);

    await expect(householdService.leaveHousehold("household-1", "user-1")).rejects.toThrow(
      ValidationError
    );
  });

  it("allows an owner to leave when another owner exists", async () => {
    const member = buildHouseholdMember({ role: "owner" });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.count.mockResolvedValue(2);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.householdMember.delete).toHaveBeenCalled();
  });

  it("switches activeHouseholdId when leaving the currently active household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-1" });
    const otherMembership = buildHouseholdMember({
      householdId: "household-2",
      userId: "user-1",
    });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.householdMember.findFirst.mockResolvedValue(otherMembership);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      activeHouseholdId: "household-2",
    });

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeHouseholdId: "household-2" },
    });
  });

  it("does not update activeHouseholdId when leaving a non-active household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts household.service`
Expected: FAIL — "householdService.leaveHousehold is not a function" (or similar)

- [ ] **Step 3: Write minimal implementation**

Add to `apps/backend/src/services/household.service.ts` (inside the `householdService` object, after `removeMember`):

```typescript
  async leaveHousehold(householdId: string, userId: string) {
    const member = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!member) throw new NotFoundError("You are not a member of this household");

    if (member.role === "owner") {
      const ownerCount = await prisma.householdMember.count({
        where: { householdId, role: "owner" },
      });
      if (ownerCount <= 1) {
        throw new ValidationError(
          "You are the sole owner of this household and cannot leave"
        );
      }
    }

    await prisma.householdMember.delete({
      where: { householdId_userId: { householdId, userId } },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeHouseholdId: true },
    });

    if (user?.activeHouseholdId === householdId) {
      const otherMembership = await prisma.householdMember.findFirst({
        where: { userId },
        orderBy: { joinedAt: "asc" },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { activeHouseholdId: otherMembership?.householdId ?? null },
      });
    }
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts household.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/household.service.ts apps/backend/src/services/household.service.test.ts
git commit -m "feat(household): add leaveHousehold service method with sole-owner guard"
```

---

### Task 2: Backend — Leave Route

**Files:**

- Modify: `apps/backend/src/routes/households.ts`
- Modify: `apps/backend/src/routes/households.test.ts`

- [ ] **Step 1: Write the failing test**

In `apps/backend/src/routes/households.test.ts`:

1. Add `leaveHousehold: mock(() => {})` to the `mock.module('../services/household.service', ...)` block (alongside the other methods).

2. Add `(householdService.leaveHousehold as any).mockResolvedValue(undefined);` in the `beforeEach` block (alongside the other defaults).

3. Add these test blocks after the existing ones:

```typescript
describe("DELETE /api/households/:id/leave", () => {
  it("returns 200 with success", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/households/household-1/leave",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
  });

  it("calls service with householdId and userId", async () => {
    await app.inject({
      method: "DELETE",
      url: "/api/households/household-xyz/leave",
      headers: authHeaders,
    });

    expect(householdService.leaveHousehold).toHaveBeenCalledWith("household-xyz", "user-1");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/households/household-1/leave",
    });

    expect(response.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts households.test`
Expected: FAIL — "DELETE /api/households/household-1/leave returns 200" fails with 404

- [ ] **Step 3: Write minimal implementation**

Add to `apps/backend/src/routes/households.ts` (after the `DELETE /households/:id/invites/:inviteId` handler):

```typescript
// Leave household (self-removal)
fastify.delete(
  "/households/:id/leave",
  { preHandler: [authMiddleware] },
  async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    await householdService.leaveHousehold(id, userId);
    return reply.send({ success: true });
  }
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts households.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/households.ts apps/backend/src/routes/households.test.ts
git commit -m "feat(household): add DELETE /households/:id/leave route"
```

---

### Task 3: Frontend — API Service Method + Hook

**Files:**

- Modify: `apps/frontend/src/services/household.service.ts`
- Modify: `apps/frontend/src/hooks/useSettings.ts`

- [ ] **Step 1: Write the failing test**

No automated frontend test file for this. Implement both files then verify with type-check.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run type-check`
Expected: PASS (nothing references `useLeaveHousehold` yet — proceed to Step 3)

- [ ] **Step 3: Write minimal implementation**

Add to `apps/frontend/src/services/household.service.ts` (after `cancelInvite`, before the closing `}`):

```typescript
  async leaveHousehold(householdId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/households/${householdId}/leave`);
  },
```

In `apps/frontend/src/hooks/useSettings.ts`, add two import lines after the existing imports (after line 6):

```typescript
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
```

Then add this hook at the end of the file:

```typescript
export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (householdId: string) => householdService.leaveHousehold(householdId),
    onSuccess: async () => {
      const { user } = await authService.getCurrentUser(accessToken!);
      setUser(user, accessToken!);
      void queryClient.invalidateQueries();
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run type-check`
Expected: PASS (no type errors on the new code)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/services/household.service.ts apps/frontend/src/hooks/useSettings.ts
git commit -m "feat(household): add leaveHousehold API method and useLeaveHousehold hook"
```

---

### Task 4: Frontend — Leave Button UI + AcceptInvitePage Redirect Fix

**Files:**

- Modify: `apps/frontend/src/components/settings/HouseholdSection.tsx`
- Modify: `apps/frontend/src/pages/auth/AcceptInvitePage.tsx`

- [ ] **Step 1: Implement**

**`apps/frontend/src/components/settings/HouseholdSection.tsx`** — full replacement:

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthStore } from "@/stores/authStore";
import {
  useHouseholdDetails,
  useRenameHousehold,
  useInviteMember,
  useCancelInvite,
  useRemoveMember,
  useLeaveHousehold,
} from "@/hooks/useSettings";
import { Section } from "./Section";

export function HouseholdSection() {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const navigate = useNavigate();

  const { data } = useHouseholdDetails(householdId);
  const household = data?.household;

  const renameHousehold = useRenameHousehold();
  const inviteMember = useInviteMember();
  const cancelInvite = useCancelInvite();
  const removeMember = useRemoveMember();
  const leaveHousehold = useLeaveHousehold();

  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    invitedEmail: string;
  } | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentUserId = user?.id;
  const currentMember = household?.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const ownerCount = household?.members.filter((m) => m.role === "owner").length ?? 0;
  const isSoleOwner = isOwner && ownerCount <= 1;

  function startRename() {
    setEditName(household?.name ?? "");
    setEditingName(true);
  }

  function handleRename() {
    renameHousehold.mutate(
      { id: householdId, name: editName },
      {
        onSuccess: () => {
          setEditingName(false);
          toast.success("Household renamed");
        },
      }
    );
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMember.mutate(
      { householdId, email: inviteEmail },
      {
        onSuccess: (result) => {
          setInviteResult(result);
          setInviteEmail("");
          toast.success("Invite created");
        },
      }
    );
  }

  function handleLeave() {
    leaveHousehold.mutate(householdId, {
      onSuccess: () => {
        toast.success("You have left the household");
        navigate("/overview");
      },
    });
  }

  const inviteUrl = inviteResult ? `${window.location.origin}/invite/${inviteResult.token}` : null;

  return (
    <Section id="household" title="Household">
      {/* Name / rename */}
      <div className="space-y-2">
        {editingName ? (
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              className="flex-1"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              aria-label="Household name"
            />
            <Button size="sm" onClick={handleRename} disabled={renameHousehold.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="font-medium">{household?.name}</p>
            {isOwner && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={startRename}
              >
                Rename
              </button>
            )}
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Members</p>
        {(household?.members ?? []).map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between py-1.5 border-b last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium">{member.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.user.email} · {member.role}
              </p>
            </div>
            {isOwner && member.userId !== currentUserId && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={() =>
                  removeMember.mutate(
                    { householdId, userId: member.userId },
                    { onSuccess: () => toast.success("Member removed") }
                  )
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Leave household */}
      {!isSoleOwner && currentMember && (
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => setShowLeaveConfirm(true)}
          >
            Leave household
          </button>
          <ConfirmDialog
            open={showLeaveConfirm}
            onOpenChange={setShowLeaveConfirm}
            title="Leave household?"
            description="You will lose access to this household's data. This cannot be undone."
            confirmLabel="Leave"
            onConfirm={handleLeave}
          />
        </div>
      )}

      {/* Invite form */}
      {isOwner && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Invite member</p>
          <form onSubmit={handleInvite} className="flex items-center gap-2 max-w-sm">
            <Input
              type="email"
              placeholder="Email address"
              className="flex-1"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              aria-label="Invite email address"
            />
            <Button type="submit" size="sm" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Creating…" : "Create link"}
            </Button>
          </form>

          {inviteResult && inviteUrl && (
            <div className="rounded-lg border p-4 space-y-3 max-w-xs">
              <QRCodeSVG value={inviteUrl} size={120} />
              <p className="text-xs text-muted-foreground break-all">{inviteUrl}</p>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteUrl);
                    toast.success("Link copied");
                  }}
                >
                  Copy link
                </button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setInviteResult(null)}
                >
                  Done
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                For {inviteResult.invitedEmail} · Expires in 24 hours
              </p>
            </div>
          )}

          {/* Pending invites */}
          {(household?.invites ?? []).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Pending invites
              </p>
              {(household?.invites ?? []).map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {format(new Date(invite.expiresAt), "dd MMM yyyy")}
                    </p>
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() =>
                      cancelInvite.mutate(
                        { householdId, inviteId: invite.id },
                        { onSuccess: () => toast.success("Invite cancelled") }
                      )
                    }
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
```

**`apps/frontend/src/pages/auth/AcceptInvitePage.tsx`** — fix 2 occurrences of `/dashboard`:

Change both instances of:

```typescript
setTimeout(() => navigate("/dashboard"), 1500);
```

To:

```typescript
setTimeout(() => navigate("/overview"), 1500);
```

- [ ] **Step 2: Verify**

Run: `bun run type-check`
Expected: PASS

Run: `bun run lint`
Expected: Zero warnings

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/settings/HouseholdSection.tsx apps/frontend/src/pages/auth/AcceptInvitePage.tsx
git commit -m "feat(household): add leave household UI and fix AcceptInvitePage redirect"
```

---

## Testing

### Backend Tests

- [ ] Service: `leaveHousehold` removes member record for regular member
- [ ] Service: `leaveHousehold` throws `NotFoundError` if user is not a member
- [ ] Service: `leaveHousehold` throws `ValidationError` if sole owner tries to leave
- [ ] Service: `leaveHousehold` allows owner to leave when another owner exists
- [ ] Service: `leaveHousehold` switches `activeHouseholdId` when leaving the currently active household
- [ ] Service: `leaveHousehold` does NOT update `activeHouseholdId` when leaving a non-active household
- [ ] Endpoint: `DELETE /api/households/:id/leave` returns 200 with `{ success: true }`
- [ ] Endpoint: `DELETE /api/households/:id/leave` calls service with correct householdId and userId
- [ ] Endpoint: `DELETE /api/households/:id/leave` returns 401 without auth

### Frontend Tests

- [ ] Component: Leave button is visible for non-sole-owner members
- [ ] Component: Leave button is hidden for the sole owner
- [ ] Component: ConfirmDialog opens on Leave button click
- [ ] Hook: `useLeaveHousehold` calls `householdService.leaveHousehold` with correct householdId

### Key Scenarios

- [ ] Happy path (member leaves): member clicks Leave → confirms → removed from household → redirected to /overview → sees their personal household
- [ ] Happy path (owner with co-owner leaves): owner with another owner clicks Leave → confirms → leaves successfully
- [ ] Error case (sole owner): sole owner should not see Leave button; if somehow triggered, backend returns 422
- [ ] Edge case (AcceptInvitePage): new user accepts invite → redirected to /overview (not /dashboard)

---

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/backend && bun scripts/run-tests.ts household.service` passes
- [ ] `cd apps/backend && bun scripts/run-tests.ts households.test` passes
- [ ] Manual: Settings page > Household section — "Leave household" link appears for non-sole-owners; clicking opens confirm dialog; confirming redirects to /overview
- [ ] Manual: As sole owner, Leave link is not visible

---

## Post-conditions

- [ ] All acceptance criteria from `household-management-spec.md` are satisfied
