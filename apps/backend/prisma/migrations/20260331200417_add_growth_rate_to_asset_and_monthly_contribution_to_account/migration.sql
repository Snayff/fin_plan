-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "monthlyContribution" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "growthRatePct" DOUBLE PRECISION;
