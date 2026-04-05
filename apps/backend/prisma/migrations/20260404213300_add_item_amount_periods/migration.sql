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

-- Migrate existing amounts to periods before dropping columns
INSERT INTO "item_amount_periods" ("id", "itemType", "itemId", "startDate", "endDate", "amount")
SELECT
    gen_random_uuid()::text,
    'income_source'::"WaterfallItemType",
    "id",
    COALESCE("createdAt"::date, CURRENT_DATE),
    "endedAt"::date,
    "amount"
FROM "IncomeSource"
WHERE "amount" IS NOT NULL;

INSERT INTO "item_amount_periods" ("id", "itemType", "itemId", "startDate", "amount")
SELECT
    gen_random_uuid()::text,
    'committed_item'::"WaterfallItemType",
    "id",
    COALESCE("createdAt"::date, CURRENT_DATE),
    "amount"
FROM "CommittedItem"
WHERE "amount" IS NOT NULL;

INSERT INTO "item_amount_periods" ("id", "itemType", "itemId", "startDate", "amount")
SELECT
    gen_random_uuid()::text,
    'discretionary_item'::"WaterfallItemType",
    "id",
    COALESCE("createdAt"::date, CURRENT_DATE),
    "amount"
FROM "DiscretionaryItem"
WHERE "amount" IS NOT NULL;

-- AlterTable: drop amount from IncomeSource and endedAt
ALTER TABLE "IncomeSource" DROP COLUMN "amount";
ALTER TABLE "IncomeSource" DROP COLUMN "endedAt";

-- AlterTable: drop amount from CommittedItem
ALTER TABLE "CommittedItem" DROP COLUMN "amount";

-- AlterTable: drop amount from DiscretionaryItem
ALTER TABLE "DiscretionaryItem" DROP COLUMN "amount";

-- CreateIndex
CREATE UNIQUE INDEX "item_amount_periods_itemType_itemId_startDate_key" ON "item_amount_periods"("itemType", "itemId", "startDate");

-- CreateIndex
CREATE INDEX "item_amount_periods_itemType_itemId_idx" ON "item_amount_periods"("itemType", "itemId");
