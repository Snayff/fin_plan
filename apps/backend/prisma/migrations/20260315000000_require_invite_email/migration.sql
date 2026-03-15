-- Delete any existing anonymous invites (null email) before enforcing NOT NULL
DELETE FROM "household_invites" WHERE "email" IS NULL;

-- Make email required
ALTER TABLE "household_invites" ALTER COLUMN "email" SET NOT NULL;
