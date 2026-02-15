-- Add direct liability link to transactions
ALTER TABLE "transactions"
ADD COLUMN "liability_id" TEXT;

-- Add new liability lifecycle fields with safe defaults for existing rows
ALTER TABLE "liabilities"
ADD COLUMN "open_date" TIMESTAMP(3),
ADD COLUMN "term_end_date" TIMESTAMP(3);

UPDATE "liabilities"
SET
  "open_date" = COALESCE("created_at", NOW()),
  "term_end_date" = COALESCE("payoff_date", "created_at", NOW());

ALTER TABLE "liabilities"
ALTER COLUMN "open_date" SET NOT NULL,
ALTER COLUMN "term_end_date" SET NOT NULL;

-- Remove over-detailed repayment model and linked-account coupling
DROP INDEX IF EXISTS "liabilities_account_id_key";

ALTER TABLE "liabilities"
DROP CONSTRAINT IF EXISTS "liabilities_account_id_fkey";

DROP TABLE IF EXISTS "liability_payments";

ALTER TABLE "liabilities"
DROP COLUMN IF EXISTS "original_amount",
DROP COLUMN IF EXISTS "minimum_payment",
DROP COLUMN IF EXISTS "payment_frequency",
DROP COLUMN IF EXISTS "payoff_date",
DROP COLUMN IF EXISTS "account_id";

-- Add transaction -> liability relation
CREATE INDEX IF NOT EXISTS "transactions_liability_id_idx" ON "transactions"("liability_id");

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_liability_id_fkey"
FOREIGN KEY ("liability_id") REFERENCES "liabilities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Enum cleanup
DROP TYPE IF EXISTS "PaymentFrequency";
