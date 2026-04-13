# Data Export & Import — Production Deployment

## Overview

This feature introduces a `Member` entity that replaces the old `HouseholdMember` join table, plus household data export/import. The database migration is handled by a single squashed Prisma migration that runs automatically via `prisma migrate deploy`.

## What the migration does

Migration `20260407000000_member_model_migration` performs these steps atomically in SQL:

1. **Creates** the `members` table (standalone entity with own ID, optional user link)
2. **Copies** all existing `household_members` rows into `members`, pulling each user's name from the `users` table
3. **Rewrites** four foreign key columns from `User.id` to `Member.id`:
   - `IncomeSource.ownerId`
   - `CommittedItem.ownerId`
   - `Asset.memberUserId` (renamed to `memberId` in step 5)
   - `Account.memberUserId` (renamed to `memberId` in step 5)
4. **Drops** the old `household_members` table
5. **Renames** `Asset.memberUserId` → `Asset.memberId` and `Account.memberUserId` → `Account.memberId`
6. **Adds** foreign key constraints and indexes on the new `memberId` columns

## Deployment steps

### 1. Deploy the code

Push the branch to `stage` (or merge into `main`, per your workflow). The CI pipeline will build and deploy.

### 2. Run the migration

The Docker dev container runs `prisma migrate deploy` on startup (see `docker-compose.dev.yml` line 43). For production on Coolify:

```bash
# SSH into the prod server or exec into the backend container
cd /app  # or wherever the backend lives
bunx prisma migrate deploy
```

This applies the single pending migration. It is:

- **Atomic** — if any step fails, the entire transaction rolls back, leaving the DB unchanged
- **Idempotent** — Prisma tracks applied migrations; running it again is a no-op
- **Non-destructive to user data** — existing household members are preserved; their data is copied (not moved) before the old table is dropped

### 3. No manual scripts needed

The old `apps/backend/prisma/migrate-to-members.ts` TypeScript script is **superseded**. All data migration is handled by the SQL migration itself. Do not run the TS script.

### 4. Verify

After deployment, verify the migration succeeded:

```bash
# Check the migration was applied
bunx prisma migrate status

# Quick sanity check — members table should have rows
# (run against the prod DB, e.g. via psql or Prisma Studio)
SELECT COUNT(*) FROM members;
SELECT COUNT(*) FROM "Asset" WHERE "memberId" IS NOT NULL;
```

The `household_members` table should no longer exist.

## Rollback

If something goes wrong and you need to roll back:

1. **Revert the code** to the previous commit (before the `feature/data_export_import` branch was merged)
2. **Revert the database** — there is no automatic down-migration. You would need to manually:
   - Recreate the `household_members` table from the old schema
   - Copy data back from `members` → `household_members`
   - Rename `Asset.memberId` → `Asset.memberUserId` and `Account.memberId` → `Account.memberUserId`
   - Rewrite the four FK columns back from `Member.id` → `User.id`
   - Drop the `members` table

This is complex. The recommended approach is to **take a database backup before deploying** so you can restore from the snapshot if needed.

```bash
# Before deploying — take a backup
pg_dump -U finplan finplan_prod > backup-pre-member-migration-$(date +%Y%m%d).sql
```

## Seed script

The seed script (`apps/backend/src/db/seed.ts`) has been updated to work with the new schema. It:

- Creates items without the `amount` field (which was moved to `ItemAmountPeriod` in an earlier migration)
- Creates `ItemAmountPeriod` records for each seeded item
- Uses `Member.id` (not `User.id`) for `ownerId` references

The seed only runs in development (`NODE_ENV !== "production"` guard at the top).

## New environment variables

None. No new env vars are needed for this feature.

## New API endpoints

| Method | Path                                                    | Auth        | Description                       |
| ------ | ------------------------------------------------------- | ----------- | --------------------------------- |
| GET    | `/api/households/:id/member-profiles`                   | JWT         | List members                      |
| POST   | `/api/households/:id/member-profiles`                   | JWT + owner | Create member                     |
| PATCH  | `/api/households/:id/member-profiles/:memberId`         | JWT + owner | Update member                     |
| DELETE | `/api/households/:id/member-profiles/:memberId`         | JWT + owner | Delete member (with reassignment) |
| GET    | `/api/households/:id/export`                            | JWT + owner | Export household data             |
| POST   | `/api/households/:id/import?mode=overwrite\|create_new` | JWT + owner | Import household data             |
| POST   | `/api/households/validate-import`                       | JWT         | Validate import file              |

Rate limits: export/import at 10/hour per user, validate at 30/hour per user. Import body limit: 5MB.
