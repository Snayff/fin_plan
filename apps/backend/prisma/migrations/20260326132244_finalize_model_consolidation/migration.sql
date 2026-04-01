-- Drop old tables no longer in use (data was migrated in previous task)
DROP TABLE IF EXISTS "CommittedBill";
DROP TABLE IF EXISTS "YearlyBill";
DROP TABLE IF EXISTS "DiscretionaryCategory";
DROP TABLE IF EXISTS "SavingsAllocation";

-- Make subcategoryId required on IncomeSource
-- First drop the old nullable FK constraint
ALTER TABLE "IncomeSource" DROP CONSTRAINT "IncomeSource_subcategoryId_fkey";

-- Make the column NOT NULL
ALTER TABLE "IncomeSource" ALTER COLUMN "subcategoryId" SET NOT NULL;

-- Re-add FK with RESTRICT (matching CommittedItem / DiscretionaryItem pattern)
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum: remove legacy values from WaterfallItemType
-- PostgreSQL does not support DROP VALUE, so we recreate the enum.
-- Step 1: rename the old enum
ALTER TYPE "WaterfallItemType" RENAME TO "WaterfallItemType_old";

-- Step 2: create the new enum with only the canonical values
CREATE TYPE "WaterfallItemType" AS ENUM ('income_source', 'committed_item', 'discretionary_item');

-- Step 3: migrate the column (only canonical values remain after Task 4 data migration)
ALTER TABLE "WaterfallHistory" ALTER COLUMN "itemType" TYPE "WaterfallItemType" USING "itemType"::text::"WaterfallItemType";

-- Step 4: drop the old enum
DROP TYPE "WaterfallItemType_old";
