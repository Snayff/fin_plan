-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('Property', 'Vehicle', 'Other');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Savings', 'Pension', 'StocksAndShares', 'Other');

-- AlterTable
ALTER TABLE "DiscretionaryItem" DROP COLUMN "wealthAccountId";

-- AlterTable
ALTER TABLE "HouseholdSettings" ADD COLUMN     "inflationRatePct" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "investmentRatePct" DOUBLE PRECISION,
ADD COLUMN     "pensionRatePct" DOUBLE PRECISION,
ADD COLUMN     "savingsRatePct" DOUBLE PRECISION,
ALTER COLUMN "stalenessThresholds" SET DEFAULT '{"income_source":12,"committed_item":6,"discretionary_item":12,"asset_item":12,"account_item":3}';

-- AlterTable
ALTER TABLE "household_members" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "retirementYear" INTEGER;

-- DropTable
DROP TABLE "WealthAccount";

-- DropTable
DROP TABLE "WealthAccountHistory";

-- DropEnum
DROP TYPE "AssetClass";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberUserId" TEXT,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetBalance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberUserId" TEXT,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "growthRatePct" DOUBLE PRECISION,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountBalance" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_householdId_idx" ON "Asset"("householdId");

-- CreateIndex
CREATE INDEX "AssetBalance_assetId_idx" ON "AssetBalance"("assetId");

-- CreateIndex
CREATE INDEX "Account_householdId_idx" ON "Account"("householdId");

-- CreateIndex
CREATE INDEX "AccountBalance_accountId_idx" ON "AccountBalance"("accountId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBalance" ADD CONSTRAINT "AssetBalance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountBalance" ADD CONSTRAINT "AccountBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill stalenessThresholds: replace wealth_account key with asset_item and account_item
UPDATE "HouseholdSettings"
SET "stalenessThresholds" = jsonb_set(
  jsonb_set(
    "stalenessThresholds" - 'wealth_account',
    '{asset_item}', '12'
  ),
  '{account_item}', '3'
)
WHERE "stalenessThresholds" IS NOT NULL;
