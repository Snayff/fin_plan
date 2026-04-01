# User Journey Testing (Layer F)

Layer F tests complete user flows through a real running app — real browser, real backend, real database. This is not component testing. Use it for end-to-end verification of critical paths and as the basis for `verify-implementation` checks.

## When to Use

- Verifying a complete feature works after implementation (invoked by `/verify-implementation`)
- Testing flows that span multiple pages (e.g. register → add income source → view waterfall summary)
- Catching integration issues that unit and component tests cannot (routing, auth state, DB writes)

Do **not** use Layer F for individual component behaviour — that belongs in Layer E.

## Prerequisites

The app must be running before any user journey test:

```bash
bun run start   # starts postgres, redis, backend:3001, frontend:3000 via Docker Compose
```

## Tool

Use the `/agent-browser` skill. It launches a browser automation agent that can navigate pages, fill forms, click buttons, take screenshots, and extract data.

Example invocation prompt:

```
Navigate to http://localhost:3000, log in as owner@finplan.test / BrowserTest123!,
add an income source named "Salary" with amount 5000 and frequency monthly,
then verify it appears in the waterfall summary with correct totals.
Screenshot each key state.
```

## Test User

| Field     | Value                |
| --------- | -------------------- |
| Email     | `owner@finplan.test` |
| Password  | `BrowserTest123!`    |
| Household | Test Household       |
| Role      | owner                |

## Seeding the Test User

The test user is created automatically on every `bun run dev` startup (the dev script runs `bun src/db/seed.ts`). It is **idempotent** — if the user already exists, the seed skips silently.

**Manual seed:**

```bash
bun run db:seed
```

**Reset / recreate (if the user or household was corrupted):**

```bash
cd apps/backend && bun src/setup-test-user.ts
```

This script deletes and recreates the test user and household from scratch.

## Integration with `/verify-implementation`

The `/verify-implementation` skill automatically invokes `/agent-browser` as part of its functional check step. It reads the feature spec to extract key user flows, then navigates through them using the seeded test user. Ensure the app is running (`bun run start`) before invoking.

## Current Gaps

- No formal test harness — Layer F is currently invoked ad-hoc via `/verify-implementation` and `/agent-browser`
- No CI pipeline step for user journey tests (they require a running app and are too slow for every PR)
