-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('salary', 'dividends', 'freelance', 'rental', 'benefits', 'other');

-- AlterTable
ALTER TABLE "IncomeSource" ADD COLUMN     "incomeType" "IncomeType" NOT NULL DEFAULT 'other';
