-- Add optional monthly contribution limit to Account
ALTER TABLE "Account" ADD COLUMN "monthlyContributionLimit" DOUBLE PRECISION;
