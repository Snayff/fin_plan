/*
  Warnings:

  - The `entry_frequency` column on the `budget_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "budget_items" DROP COLUMN "entry_frequency",
ADD COLUMN     "entry_frequency" "RecurringFrequency";
