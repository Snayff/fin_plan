-- CreateEnum
CREATE TYPE "IncomePeriod" AS ENUM ('month', 'year');

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "income_period" "IncomePeriod",
ADD COLUMN     "linked_account_id" TEXT;

-- AlterTable
ALTER TABLE "households" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_linked_account_id_fkey" FOREIGN KEY ("linked_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
