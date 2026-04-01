-- AlterEnum
ALTER TYPE "HouseholdRole" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "HouseholdSettings" ALTER COLUMN "stalenessThresholds" SET DEFAULT '{"income_source":12,"committed_item":6,"discretionary_item":12,"wealth_account":3}';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_id" TEXT,
ADD COLUMN     "actor_name" TEXT,
ADD COLUMN     "changes" JSONB,
ADD COLUMN     "household_id" TEXT;

-- AlterTable
ALTER TABLE "household_invites" ADD COLUMN     "intended_role" "HouseholdRole";

-- CreateIndex
CREATE INDEX "audit_logs_household_id_idx" ON "audit_logs"("household_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_household_id_created_at_idx" ON "audit_logs"("household_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;
