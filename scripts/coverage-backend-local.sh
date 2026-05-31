#!/usr/bin/env bash
#
# Measure backend true coverage locally.
#
# A few backend service/journey tests use a real Postgres (not the prisma mock),
# so the coverage slice needs a `finplan_test` database. This script reuses the
# Postgres from the docker dev stack (`bun run start`), ensures the test DB and
# schema exist, then runs the true-coverage emitter.
#
# Usage:  bun run coverage:backend   (see package.json)
#
set -euo pipefail

HOST="${PGHOST:-127.0.0.1}"
PORT="${PGPORT:-5432}"
USER="${PGUSER:-finplan}"
PASS="${PGPASSWORD:-finplan_dev_password}"
DB="${PGTESTDB:-finplan_test}"

export DATABASE_URL="postgresql://${USER}:${PASS}@${HOST}:${PORT}/${DB}"

echo "→ Using ${DATABASE_URL}"

# Ensure the test database exists (idempotent — ignore "already exists").
PGPASSWORD="$PASS" createdb -h "$HOST" -p "$PORT" -U "$USER" "$DB" 2>/dev/null \
  && echo "→ created database ${DB}" \
  || echo "→ database ${DB} already present"

# Sync schema, then measure.
echo "→ syncing schema (prisma db push)"
( cd apps/backend && bunx prisma db push >/dev/null 2>&1 ) || {
  echo "✗ prisma db push failed — is the dev Postgres running? (bun run start)" >&2
  exit 1
}

echo "→ measuring true coverage"
bun scripts/emit-coverage-slice.ts apps/backend apps/backend coverage-current.json
