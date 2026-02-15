-- DropForeignKey
ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_linked_account_id_fkey";

-- DropColumn
ALTER TABLE "goals" DROP COLUMN IF EXISTS "linked_account_id";
