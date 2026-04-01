/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `asset_value_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `budget_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forecast_scenarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forecasts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goal_contributions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `liabilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monte_carlo_simulations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_overrides` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('monthly', 'annual', 'one_off');

-- CreateEnum
CREATE TYPE "WaterfallItemType" AS ENUM ('income_source', 'committed_bill', 'yearly_bill', 'discretionary_category', 'savings_allocation');

-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('savings', 'pensions', 'investments', 'property', 'vehicles', 'other');

-- CreateEnum
CREATE TYPE "PurchasePriority" AS ENUM ('lowest', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('not_started', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "GiftEventType" AS ENUM ('birthday', 'christmas', 'mothers_day', 'fathers_day', 'valentines_day', 'anniversary', 'custom');

-- CreateEnum
CREATE TYPE "GiftRecurrence" AS ENUM ('annual', 'one_off');

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_household_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_value_history" DROP CONSTRAINT "asset_value_history_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_household_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_items" DROP CONSTRAINT "budget_items_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "budget_items" DROP CONSTRAINT "budget_items_category_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_household_id_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_household_id_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_category_id_fkey";

-- DropForeignKey
ALTER TABLE "forecast_scenarios" DROP CONSTRAINT "forecast_scenarios_forecast_id_fkey";

-- DropForeignKey
ALTER TABLE "forecasts" DROP CONSTRAINT "forecasts_household_id_fkey";

-- DropForeignKey
ALTER TABLE "goal_contributions" DROP CONSTRAINT "goal_contributions_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "goal_contributions" DROP CONSTRAINT "goal_contributions_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT "goals_household_id_fkey";

-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT "goals_linked_account_id_fkey";

-- DropForeignKey
ALTER TABLE "liabilities" DROP CONSTRAINT "liabilities_household_id_fkey";

-- DropForeignKey
ALTER TABLE "liabilities" DROP CONSTRAINT "liabilities_linked_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "monte_carlo_simulations" DROP CONSTRAINT "monte_carlo_simulations_forecast_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_rules" DROP CONSTRAINT "recurring_rules_household_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction_overrides" DROP CONSTRAINT "transaction_overrides_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_household_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_liability_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_recurring_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_subcategory_id_fkey";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "asset_value_history";

-- DropTable
DROP TABLE "assets";

-- DropTable
DROP TABLE "budget_items";

-- DropTable
DROP TABLE "budgets";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "forecast_scenarios";

-- DropTable
DROP TABLE "forecasts";

-- DropTable
DROP TABLE "goal_contributions";

-- DropTable
DROP TABLE "goals";

-- DropTable
DROP TABLE "liabilities";

-- DropTable
DROP TABLE "monte_carlo_simulations";

-- DropTable
DROP TABLE "recurring_rules";

-- DropTable
DROP TABLE "transaction_overrides";

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "AssetType";

-- DropEnum
DROP TYPE "BudgetPeriod";

-- DropEnum
DROP TYPE "CategoryType";

-- DropEnum
DROP TYPE "GoalStatus";

-- DropEnum
DROP TYPE "GoalType";

-- DropEnum
DROP TYPE "IncomePeriod";

-- DropEnum
DROP TYPE "InterestType";

-- DropEnum
DROP TYPE "LiabilityType";

-- DropEnum
DROP TYPE "LiquidityType";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "RecurrenceType";

-- DropEnum
DROP TYPE "RecurringFrequency";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "ValueSource";

-- CreateTable
CREATE TABLE "HouseholdSettings" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "surplusBenchmarkPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isaAnnualLimit" DOUBLE PRECISION NOT NULL DEFAULT 20000,
    "isaYearStartMonth" INTEGER NOT NULL DEFAULT 4,
    "isaYearStartDay" INTEGER NOT NULL DEFAULT 6,
    "stalenessThresholds" JSONB NOT NULL DEFAULT '{"income_source":12,"committed_bill":6,"yearly_bill":12,"discretionary_category":12,"savings_allocation":12,"wealth_account":3}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "IncomeFrequency" NOT NULL,
    "expectedMonth" INTEGER,
    "ownerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "endedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommittedBill" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ownerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommittedBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearlyBill" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueMonth" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearlyBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscretionaryCategory" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyBudget" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscretionaryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsAllocation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "wealthAccountId" TEXT,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsAllocation_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "WealthAccount" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "assetClass" "AssetClass" NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "notes" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION,
    "isISA" BOOLEAN NOT NULL DEFAULT false,
    "isaYearContribution" DOUBLE PRECISION,
    "ownerId" TEXT,
    "isTrust" BOOLEAN NOT NULL DEFAULT false,
    "trustBeneficiaryName" TEXT,
    "valuationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WealthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WealthAccountHistory" (
    "id" TEXT NOT NULL,
    "wealthAccountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WealthAccountHistory_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "GiftPerson" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftEvent" (
    "id" TEXT NOT NULL,
    "giftPersonId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "eventType" "GiftEventType" NOT NULL,
    "customName" TEXT,
    "dateMonth" INTEGER,
    "dateDay" INTEGER,
    "specificDate" TIMESTAMP(3),
    "recurrence" "GiftRecurrence" NOT NULL DEFAULT 'annual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftYearRecord" (
    "id" TEXT NOT NULL,
    "giftEventId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftYearRecord_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "HouseholdSettings_householdId_key" ON "HouseholdSettings"("householdId");

-- CreateIndex
CREATE INDEX "WaterfallHistory_itemType_itemId_recordedAt_idx" ON "WaterfallHistory"("itemType", "itemId", "recordedAt");

-- CreateIndex
CREATE INDEX "WealthAccountHistory_wealthAccountId_valuationDate_idx" ON "WealthAccountHistory"("wealthAccountId", "valuationDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerYearBudget_householdId_year_key" ON "PlannerYearBudget"("householdId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "GiftYearRecord_giftEventId_year_key" ON "GiftYearRecord"("giftEventId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_householdId_name_key" ON "Snapshot"("householdId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSession_householdId_key" ON "ReviewSession"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterfallSetupSession_householdId_key" ON "WaterfallSetupSession"("householdId");
