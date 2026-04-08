-- Rename Asset.memberUserId -> Asset.memberId and add FK to members(id).
-- The column already holds Member.id values (set by migrate-to-members.ts),
-- so this migration only brings the schema into alignment with the data.

-- AlterTable
ALTER TABLE "Asset" RENAME COLUMN "memberUserId" TO "memberId";

-- AlterTable
ALTER TABLE "Account" RENAME COLUMN "memberUserId" TO "memberId";

-- CreateIndex
CREATE INDEX "Asset_memberId_idx" ON "Asset"("memberId");

-- CreateIndex
CREATE INDEX "Account_memberId_idx" ON "Account"("memberId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
