ALTER TABLE "liabilities" ADD COLUMN "linked_asset_id" TEXT;

CREATE UNIQUE INDEX "liabilities_linked_asset_id_key" ON "liabilities"("linked_asset_id");
CREATE INDEX "liabilities_household_id_linked_asset_id_idx" ON "liabilities"("household_id", "linked_asset_id");

ALTER TABLE "liabilities"
ADD CONSTRAINT "liabilities_linked_asset_id_fkey"
FOREIGN KEY ("linked_asset_id") REFERENCES "assets"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
