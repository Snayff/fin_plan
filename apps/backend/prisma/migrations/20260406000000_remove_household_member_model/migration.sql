-- DropForeignKey
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_household_id_fkey";

-- DropForeignKey
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_user_id_fkey";

-- DropTable
DROP TABLE "household_members";
