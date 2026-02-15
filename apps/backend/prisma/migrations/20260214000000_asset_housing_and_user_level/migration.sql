-- Rename asset enum value from real_estate to housing
ALTER TYPE "AssetType" RENAME VALUE 'real_estate' TO 'housing';

-- Assets are now user-level only and no longer linked to accounts
ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_account_id_fkey";
DROP INDEX IF EXISTS "assets_account_id_key";
ALTER TABLE "assets" DROP COLUMN IF EXISTS "account_id";
