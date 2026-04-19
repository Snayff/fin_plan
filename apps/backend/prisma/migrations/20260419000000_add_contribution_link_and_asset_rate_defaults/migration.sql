-- Add linkedAccountId to DiscretionaryItem with FK to Account (ON DELETE SET NULL)
ALTER TABLE "DiscretionaryItem" ADD COLUMN "linkedAccountId" TEXT;

ALTER TABLE "DiscretionaryItem" ADD CONSTRAINT "DiscretionaryItem_linkedAccountId_fkey"
  FOREIGN KEY ("linkedAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "DiscretionaryItem_linkedAccountId_idx" ON "DiscretionaryItem"("linkedAccountId");

-- Remove monthlyContribution from Account
ALTER TABLE "Account" DROP COLUMN IF EXISTS "monthlyContribution";

-- Add asset rate default fields to HouseholdSettings
ALTER TABLE "HouseholdSettings" ADD COLUMN IF NOT EXISTS "propertyRatePct" DOUBLE PRECISION NOT NULL DEFAULT 3.5;
ALTER TABLE "HouseholdSettings" ADD COLUMN IF NOT EXISTS "vehicleRatePct" DOUBLE PRECISION NOT NULL DEFAULT -15;
ALTER TABLE "HouseholdSettings" ADD COLUMN IF NOT EXISTS "otherAssetRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill: lock the "Savings" discretionary subcategory for all existing households
UPDATE "Subcategory"
SET "isLocked" = true
WHERE "tier" = 'discretionary' AND "name" = 'Savings';
