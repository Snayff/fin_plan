-- Add absolute session cap + remember-me metadata for refresh token lifecycle.
ALTER TABLE "refresh_tokens"
ADD COLUMN "session_expires_at" TIMESTAMP(3),
ADD COLUMN "remember_me" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing sessions to preserve current long-lived behavior.
UPDATE "refresh_tokens"
SET
  "session_expires_at" = "created_at" + interval '30 days',
  "remember_me" = true
WHERE "session_expires_at" IS NULL;

ALTER TABLE "refresh_tokens"
ALTER COLUMN "session_expires_at" SET NOT NULL;

CREATE INDEX "refresh_tokens_session_expires_at_idx" ON "refresh_tokens"("session_expires_at");
