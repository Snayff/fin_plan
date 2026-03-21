-- Make email nullable on household_invites (QR code invites don't require an email)
ALTER TABLE "household_invites" ALTER COLUMN "email" DROP NOT NULL;

-- Remove the email index (no longer used for deduplication lookups)
DROP INDEX IF EXISTS "household_invites_email_idx";
