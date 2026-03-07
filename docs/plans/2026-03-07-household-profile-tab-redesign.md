# Household Profile Tab Redesign

**Date:** 2026-03-07
**Status:** Approved
**File:** `apps/frontend/src/pages/ProfilePage.tsx`

## Goals

Improve the UX of the Household tab on the Profile page:
1. Make the household name an always-editable field (consistent with the Account tab)
2. Group invite and pending invite sections into one card
3. Move "Create New Household" to the top of the tab

## Layout (top → bottom)

1. **Create New Household** — moved from bottom to top; always visible to all users
2. **Household** — always-editable name input
3. **Members** — unchanged
4. **Invite to Household** *(owner only)* — single combined card

## Section Details

### 1. Create New Household

No logic changes. Physically moved above the Household card so it appears first under the tabs.

### 2. Household Name (editable field)

**Current behaviour:** "Rename" button toggles `isRenaming` state, revealing an input.

**New behaviour:** Always-visible input, mirroring the Account tab's display name pattern.

**State changes:**
- Remove `isRenaming` boolean state
- Keep `renameValue` string state
- Add `useEffect` to sync `renameValue` from `household?.name` whenever it loads or changes:
  ```ts
  useEffect(() => {
    if (household?.name) setRenameValue(household.name);
  }, [household?.name]);
  ```

**Render:**
- Loading: show `<Skeleton>` (unchanged)
- Loaded: always show `<Input>` pre-populated with current name
  - Same `flex items-end gap-3` layout as Account tab, with a `<Label>`
  - Save button disabled when value is empty or unchanged (`renameValue.trim() === household?.name`)
  - Shows `'Saving...'` while mutation is pending
- Non-owners: `readOnly` input, Save button hidden

### 3. Members

No changes.

### 4. Invite to Household (combined card, owner only)

**Replaces:** Separate "Invite Member" and "Pending Invites" cards.

**Card title:** "Invite to Household"

**Structure:**
```
[Card: "Invite to Household"]
  [email input] [Send Invite button]
  ── Pending ──────────────────────
  invite@email.com   Expires 01/04/2026   [Cancel]
  invite2@email.com  Expires 01/04/2026   [Cancel]
  (or: "No pending invites.")
```

- Invite form logic unchanged
- Pending list logic unchanged (same cancel mutation)
- Divider: `border-t border-border` with a small `"Pending"` label or just the rule
- Owner-only gate applies to the whole card (both sections were already owner-only)

## State Summary

| State variable   | Change                          |
|------------------|---------------------------------|
| `isRenaming`     | Removed                         |
| `renameValue`    | Kept; synced via `useEffect`    |
| `inviteEmail`    | Unchanged                       |
| `newHouseholdName` | Unchanged                     |

## No backend changes required

All mutations and queries remain the same. This is a pure UI restructure.
