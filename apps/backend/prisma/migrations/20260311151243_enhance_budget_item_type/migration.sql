-- CreateEnum
CREATE TYPE "BudgetItemType" AS ENUM ('committed', 'discretionary');

-- AlterTable
ALTER TABLE "budget_items" ADD COLUMN     "entry_amount" DECIMAL(15,2),
ADD COLUMN     "entry_frequency" TEXT,
ADD COLUMN     "item_type" "BudgetItemType" NOT NULL DEFAULT 'committed',
ADD COLUMN     "recurring_rule_id" TEXT;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_recurring_rule_id_fkey" FOREIGN KEY ("recurring_rule_id") REFERENCES "recurring_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
