-- Member attribution on Waterfall items
--
-- Background: IncomeSource.ownerId and CommittedItem.ownerId previously
-- stored a User.id (validateMemberOwnership looked up by Member.user_id),
-- while member.service.ts deletion-blocking checks queried by Member.id.
-- This made the field inconsistent and prevented attributing items to
-- members without a linked user account.
--
-- This migration:
-- 1. Backfills the existing ownerId values: rewrites them from User.id to
--    Member.id where a matching Member exists in the same household, NULLs
--    out anything that doesn't resolve.
-- 2. Renames ownerId -> memberId on IncomeSource and CommittedItem.
-- 3. Adds memberId column to DiscretionaryItem (new column, no backfill).
-- 4. Adds foreign keys (onDelete SET NULL) and indexes for all three tiers.

-- ─── Backfill IncomeSource.ownerId (User.id -> Member.id) ────────────────
UPDATE "IncomeSource" i
SET "ownerId" = m."id"
FROM "members" m
WHERE i."ownerId" IS NOT NULL
  AND m."user_id" = i."ownerId"
  AND m."household_id" = i."householdId";

-- Null out any leftover ownerId values that don't resolve to a Member.id
UPDATE "IncomeSource"
SET "ownerId" = NULL
WHERE "ownerId" IS NOT NULL
  AND "ownerId" NOT IN (SELECT "id" FROM "members");

-- ─── Backfill CommittedItem.ownerId (User.id -> Member.id) ───────────────
UPDATE "CommittedItem" c
SET "ownerId" = m."id"
FROM "members" m
WHERE c."ownerId" IS NOT NULL
  AND m."user_id" = c."ownerId"
  AND m."household_id" = c."householdId";

UPDATE "CommittedItem"
SET "ownerId" = NULL
WHERE "ownerId" IS NOT NULL
  AND "ownerId" NOT IN (SELECT "id" FROM "members");

-- ─── Rename ownerId -> memberId ──────────────────────────────────────────
ALTER TABLE "IncomeSource" RENAME COLUMN "ownerId" TO "memberId";
ALTER TABLE "CommittedItem" RENAME COLUMN "ownerId" TO "memberId";

-- ─── Add memberId to DiscretionaryItem (new column) ──────────────────────
ALTER TABLE "DiscretionaryItem" ADD COLUMN "memberId" TEXT;

-- ─── Foreign keys (onDelete SET NULL) ────────────────────────────────────
ALTER TABLE "IncomeSource"
  ADD CONSTRAINT "IncomeSource_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommittedItem"
  ADD CONSTRAINT "CommittedItem_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DiscretionaryItem"
  ADD CONSTRAINT "DiscretionaryItem_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX "IncomeSource_memberId_idx" ON "IncomeSource"("memberId");
CREATE INDEX "CommittedItem_memberId_idx" ON "CommittedItem"("memberId");
CREATE INDEX "DiscretionaryItem_memberId_idx" ON "DiscretionaryItem"("memberId");
