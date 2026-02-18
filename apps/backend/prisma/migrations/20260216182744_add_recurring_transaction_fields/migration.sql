-- DropIndex
DROP INDEX "transactions_liability_id_idx";

-- AlterTable
ALTER TABLE "recurring_rules" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "generated_at" TIMESTAMP(3),
ADD COLUMN     "is_generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overridden_fields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "transaction_overrides" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "original_value" JSONB NOT NULL,
    "overridden_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_overrides_transaction_id_idx" ON "transaction_overrides"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_overrides_transaction_id_field_name_key" ON "transaction_overrides"("transaction_id", "field_name");

-- CreateIndex
CREATE INDEX "recurring_rules_user_id_is_active_idx" ON "recurring_rules"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "recurring_rules_start_date_end_date_idx" ON "recurring_rules"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "transactions_recurring_rule_id_date_idx" ON "transactions"("recurring_rule_id", "date");

-- AddForeignKey
ALTER TABLE "transaction_overrides" ADD CONSTRAINT "transaction_overrides_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
