-- Migration: add_households
-- Introduces the Household model. All financial data moves from userId → householdId.
-- Existing users automatically get a personal household with their data migrated.

-- ─── 1. New enum ──────────────────────────────────────────────────────────────

CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'member');

-- ─── 2. New tables ───────────────────────────────────────────────────────────

CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "household_members" (
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("household_id","user_id")
);

CREATE TABLE "household_invites" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_invites_pkey" PRIMARY KEY ("id")
);

-- ─── 3. Add nullable household_id to financial tables (before data migration) ─

ALTER TABLE "users" ADD COLUMN "active_household_id" TEXT;

ALTER TABLE "accounts"       ADD COLUMN "household_id" TEXT;
ALTER TABLE "assets"         ADD COLUMN "household_id" TEXT;
ALTER TABLE "budgets"        ADD COLUMN "household_id" TEXT;
ALTER TABLE "categories"     ADD COLUMN "household_id" TEXT;
ALTER TABLE "forecasts"      ADD COLUMN "household_id" TEXT;
ALTER TABLE "goals"          ADD COLUMN "household_id" TEXT;
ALTER TABLE "liabilities"    ADD COLUMN "household_id" TEXT;
ALTER TABLE "recurring_rules" ADD COLUMN "household_id" TEXT;
ALTER TABLE "transactions"   ADD COLUMN "household_id" TEXT;

-- ─── 4. Data migration ───────────────────────────────────────────────────────
-- For every existing user: create a personal household, register them as owner,
-- re-parent all their financial data, set active_household_id.

DO $$
DECLARE
    u RECORD;
    new_household_id TEXT;
BEGIN
    FOR u IN SELECT id, name FROM users LOOP
        -- Generate a new UUID for the household
        new_household_id := gen_random_uuid()::TEXT;

        -- Create the household
        INSERT INTO households (id, name, created_at, updated_at)
        VALUES (new_household_id, u.name || '''s Household', NOW(), NOW());

        -- Register user as owner
        INSERT INTO household_members (household_id, user_id, role, joined_at)
        VALUES (new_household_id, u.id, 'owner', NOW());

        -- Set active household on user
        UPDATE users SET active_household_id = new_household_id WHERE id = u.id;

        -- Re-parent all financial data
        UPDATE accounts       SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE assets         SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE budgets        SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE categories     SET household_id = new_household_id WHERE user_id = u.id AND is_system_category = false;
        UPDATE forecasts      SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE goals          SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE liabilities    SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE recurring_rules SET household_id = new_household_id WHERE user_id = u.id;
        UPDATE transactions   SET household_id = new_household_id WHERE user_id = u.id;
    END LOOP;
END $$;

-- ─── 5. Drop old foreign keys ─────────────────────────────────────────────────

ALTER TABLE "accounts"        DROP CONSTRAINT "accounts_user_id_fkey";
ALTER TABLE "assets"          DROP CONSTRAINT "assets_user_id_fkey";
ALTER TABLE "budgets"         DROP CONSTRAINT "budgets_user_id_fkey";
ALTER TABLE "categories"      DROP CONSTRAINT "categories_user_id_fkey";
ALTER TABLE "forecasts"       DROP CONSTRAINT "forecasts_user_id_fkey";
ALTER TABLE "goals"           DROP CONSTRAINT "goals_user_id_fkey";
ALTER TABLE "liabilities"     DROP CONSTRAINT "liabilities_user_id_fkey";
ALTER TABLE "recurring_rules" DROP CONSTRAINT "recurring_rules_user_id_fkey";
ALTER TABLE "transactions"    DROP CONSTRAINT "transactions_user_id_fkey";

-- ─── 6. Drop old indices ──────────────────────────────────────────────────────

DROP INDEX "accounts_user_id_is_active_idx";
DROP INDEX "categories_user_id_type_idx";
DROP INDEX "goals_user_id_status_idx";
DROP INDEX "recurring_rules_user_id_is_active_idx";
DROP INDEX IF EXISTS "refresh_tokens_session_expires_at_idx";
DROP INDEX "transactions_user_id_category_id_date_idx";
DROP INDEX "transactions_user_id_date_idx";

-- ─── 7. Add NOT NULL constraints (safe now that data is migrated) ─────────────

ALTER TABLE "accounts"        ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "assets"          ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "budgets"         ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "forecasts"       ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "goals"           ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "liabilities"     ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "recurring_rules" ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "transactions"    ALTER COLUMN "household_id" SET NOT NULL;
-- categories.household_id remains nullable (system categories have null)

-- ─── 8. Drop old user_id columns ─────────────────────────────────────────────

ALTER TABLE "accounts"        DROP COLUMN "user_id";
ALTER TABLE "assets"          DROP COLUMN "user_id";
ALTER TABLE "budgets"         DROP COLUMN "user_id";
ALTER TABLE "categories"      DROP COLUMN "user_id";
ALTER TABLE "forecasts"       DROP COLUMN "user_id";
ALTER TABLE "goals"           DROP COLUMN "user_id";
ALTER TABLE "liabilities"     DROP COLUMN "user_id";
ALTER TABLE "recurring_rules" DROP COLUMN "user_id";
ALTER TABLE "transactions"    DROP COLUMN "user_id";

-- ─── 9. New indices ───────────────────────────────────────────────────────────

CREATE INDEX "household_members_user_id_idx"              ON "household_members"("user_id");
CREATE UNIQUE INDEX "household_invites_token_hash_key"    ON "household_invites"("token_hash");
CREATE INDEX "household_invites_household_id_idx"         ON "household_invites"("household_id");
CREATE INDEX "household_invites_email_idx"                ON "household_invites"("email");
CREATE INDEX "accounts_household_id_is_active_idx"        ON "accounts"("household_id", "is_active");
CREATE INDEX "categories_household_id_type_idx"           ON "categories"("household_id", "type");
CREATE INDEX "goals_household_id_status_idx"              ON "goals"("household_id", "status");
CREATE INDEX "recurring_rules_household_id_is_active_idx" ON "recurring_rules"("household_id", "is_active");
CREATE INDEX "transactions_household_id_date_idx"         ON "transactions"("household_id", "date");
CREATE INDEX "transactions_household_id_category_id_date_idx" ON "transactions"("household_id", "category_id", "date");

-- ─── 10. New foreign keys ─────────────────────────────────────────────────────

ALTER TABLE "users" ADD CONSTRAINT "users_active_household_id_fkey"
    FOREIGN KEY ("active_household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budgets" ADD CONSTRAINT "budgets_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "goals" ADD CONSTRAINT "goals_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
