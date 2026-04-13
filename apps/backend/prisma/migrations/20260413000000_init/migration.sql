-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('web', 'mobile', 'desktop');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('monthly', 'annual', 'one_off');

-- CreateEnum
CREATE TYPE "WaterfallTier" AS ENUM ('income', 'committed', 'discretionary');

-- CreateEnum
CREATE TYPE "SpendType" AS ENUM ('monthly', 'yearly', 'one_off');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('salary', 'dividends', 'freelance', 'rental', 'benefits', 'other');

-- CreateEnum
CREATE TYPE "WaterfallItemType" AS ENUM ('income_source', 'committed_item', 'discretionary_item');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('Property', 'Vehicle', 'Other');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Current', 'Savings', 'Pension', 'StocksAndShares', 'Other');

-- CreateEnum
CREATE TYPE "PurchasePriority" AS ENUM ('lowest', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('not_started', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "GiftDateType" AS ENUM ('shared', 'personal');

-- CreateEnum
CREATE TYPE "GiftAllocationStatus" AS ENUM ('planned', 'bought', 'skipped');

-- CreateEnum
CREATE TYPE "GiftPlannerMode" AS ENUM ('synced', 'independent');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "preferences" JSONB DEFAULT '{}',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "active_household_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'member',
    "date_of_birth" TIMESTAMP(3),
    "retirement_year" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_invites" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intended_role" "HouseholdRole",

    CONSTRAINT "household_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "household_id" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "changes" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "session_expires_at" TIMESTAMP(3) NOT NULL,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "sync_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdSettings" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "surplusBenchmarkPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isaAnnualLimit" DOUBLE PRECISION NOT NULL DEFAULT 20000,
    "isaYearStartMonth" INTEGER NOT NULL DEFAULT 4,
    "isaYearStartDay" INTEGER NOT NULL DEFAULT 6,
    "stalenessThresholds" JSONB NOT NULL DEFAULT '{"income_source":12,"committed_item":6,"discretionary_item":12,"asset_item":12,"account_item":3}',
    "currentRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "savingsRatePct" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "investmentRatePct" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "pensionRatePct" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "inflationRatePct" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "showPence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "tier" "WaterfallTier" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "lockedByPlanner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL,
    "incomeType" "IncomeType" NOT NULL DEFAULT 'other',
    "dueDate" DATE NOT NULL,
    "ownerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommittedItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spendType" "SpendType" NOT NULL DEFAULT 'monthly',
    "notes" TEXT,
    "ownerId" TEXT,
    "dueDate" DATE NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommittedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscretionaryItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spendType" "SpendType" NOT NULL DEFAULT 'monthly',
    "notes" TEXT,
    "dueDate" DATE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPlannerOwned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscretionaryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterfallHistory" (
    "id" TEXT NOT NULL,
    "itemType" "WaterfallItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterfallHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_amount_periods" (
    "id" TEXT NOT NULL,
    "itemType" "WaterfallItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_amount_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "growthRatePct" DOUBLE PRECISION,
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
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "growthRatePct" DOUBLE PRECISION,
    "monthlyContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCashflowLinked" BOOLEAN NOT NULL DEFAULT false,
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

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "yearAdded" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "priority" "PurchasePriority" NOT NULL DEFAULT 'low',
    "scheduledThisYear" BOOLEAN NOT NULL DEFAULT false,
    "fundingSources" TEXT[],
    "fundingAccountId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'not_started',
    "reason" TEXT,
    "comment" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerYearBudget" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "purchaseBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giftBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerYearBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftPlannerSettings" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "mode" "GiftPlannerMode" NOT NULL DEFAULT 'synced',
    "syncedDiscretionaryItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftPlannerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftPerson" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftEvent" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateType" "GiftDateType" NOT NULL,
    "dateMonth" INTEGER,
    "dateDay" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftAllocation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "giftPersonId" TEXT NOT NULL,
    "giftEventId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "planned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION,
    "status" "GiftAllocationStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "dateMonth" INTEGER,
    "dateDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftRolloverDismissal" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftRolloverDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_backups" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSession" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "confirmedItems" JSONB NOT NULL DEFAULT '{}',
    "updatedItems" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterfallSetupSession" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterfallSetupSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "members_household_id_idx" ON "members"("household_id");

-- CreateIndex
CREATE INDEX "members_user_id_idx" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_household_id_user_id_key" ON "members"("household_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_household_id_name_key" ON "members"("household_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "household_invites_token_hash_key" ON "household_invites"("token_hash");

-- CreateIndex
CREATE INDEX "household_invites_household_id_idx" ON "household_invites"("household_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_household_id_idx" ON "audit_logs"("household_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_household_id_created_at_idx" ON "audit_logs"("household_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdSettings_householdId_key" ON "HouseholdSettings"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_householdId_tier_name_key" ON "Subcategory"("householdId", "tier", "name");

-- CreateIndex
CREATE INDEX "IncomeSource_householdId_idx" ON "IncomeSource"("householdId");

-- CreateIndex
CREATE INDEX "CommittedItem_householdId_idx" ON "CommittedItem"("householdId");

-- CreateIndex
CREATE INDEX "DiscretionaryItem_householdId_idx" ON "DiscretionaryItem"("householdId");

-- CreateIndex
CREATE INDEX "WaterfallHistory_itemType_itemId_recordedAt_idx" ON "WaterfallHistory"("itemType", "itemId", "recordedAt");

-- CreateIndex
CREATE INDEX "item_amount_periods_itemType_itemId_idx" ON "item_amount_periods"("itemType", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "item_amount_periods_itemType_itemId_startDate_key" ON "item_amount_periods"("itemType", "itemId", "startDate");

-- CreateIndex
CREATE INDEX "Asset_householdId_idx" ON "Asset"("householdId");

-- CreateIndex
CREATE INDEX "Asset_memberId_idx" ON "Asset"("memberId");

-- CreateIndex
CREATE INDEX "AssetBalance_assetId_idx" ON "AssetBalance"("assetId");

-- CreateIndex
CREATE INDEX "Account_householdId_idx" ON "Account"("householdId");

-- CreateIndex
CREATE INDEX "Account_memberId_idx" ON "Account"("memberId");

-- CreateIndex
CREATE INDEX "AccountBalance_accountId_idx" ON "AccountBalance"("accountId");

-- CreateIndex
CREATE INDEX "PurchaseItem_householdId_idx" ON "PurchaseItem"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerYearBudget_householdId_year_key" ON "PlannerYearBudget"("householdId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "GiftPlannerSettings_householdId_key" ON "GiftPlannerSettings"("householdId");

-- CreateIndex
CREATE INDEX "GiftPerson_householdId_idx" ON "GiftPerson"("householdId");

-- CreateIndex
CREATE INDEX "GiftPerson_memberId_idx" ON "GiftPerson"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftPerson_householdId_name_key" ON "GiftPerson"("householdId", "name");

-- CreateIndex
CREATE INDEX "GiftEvent_householdId_idx" ON "GiftEvent"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftEvent_householdId_name_key" ON "GiftEvent"("householdId", "name");

-- CreateIndex
CREATE INDEX "GiftAllocation_householdId_year_idx" ON "GiftAllocation"("householdId", "year");

-- CreateIndex
CREATE INDEX "GiftAllocation_giftEventId_year_idx" ON "GiftAllocation"("giftEventId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "GiftAllocation_giftPersonId_giftEventId_year_key" ON "GiftAllocation"("giftPersonId", "giftEventId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "GiftRolloverDismissal_householdId_userId_year_key" ON "GiftRolloverDismissal"("householdId", "userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_householdId_name_key" ON "Snapshot"("householdId", "name");

-- CreateIndex
CREATE INDEX "import_backups_householdId_idx" ON "import_backups"("householdId");

-- CreateIndex
CREATE INDEX "import_backups_expiresAt_idx" ON "import_backups"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSession_householdId_key" ON "ReviewSession"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterfallSetupSession_householdId_key" ON "WaterfallSetupSession"("householdId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_household_id_fkey" FOREIGN KEY ("active_household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommittedItem" ADD CONSTRAINT "CommittedItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscretionaryItem" ADD CONSTRAINT "DiscretionaryItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBalance" ADD CONSTRAINT "AssetBalance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountBalance" ADD CONSTRAINT "AccountBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftAllocation" ADD CONSTRAINT "GiftAllocation_giftPersonId_fkey" FOREIGN KEY ("giftPersonId") REFERENCES "GiftPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftAllocation" ADD CONSTRAINT "GiftAllocation_giftEventId_fkey" FOREIGN KEY ("giftEventId") REFERENCES "GiftEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_backups" ADD CONSTRAINT "import_backups_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

