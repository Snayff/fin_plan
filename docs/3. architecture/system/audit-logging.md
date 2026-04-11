# Audit Logging

## Rule: Every Mutation Must Be Audited

Wrap every create, update, and delete operation in `audited()` with `actorCtx(req)`.

```typescript
import { audited } from "../services/audit.service";
import { actorCtx } from "../lib/actor-ctx";

// In a route handler:
const result = await audited({
  db: prisma,
  ctx: actorCtx(req),
  action: "income.update",
  resource: "IncomeSource",
  resourceId: id,
  beforeFetch: (tx) => tx.incomeSource.findUnique({ where: { id } }),
  mutation: (tx) => tx.incomeSource.update({ where: { id }, data }),
});
```

## How `audited()` Works

1. Runs inside a Prisma transaction.
2. Fetches the "before" state via `beforeFetch`.
3. Executes the mutation.
4. Computes a diff between before and after states.
5. Writes an audit log entry with action, resource, actor, IP, user agent, and diff metadata.

**Source:** `apps/backend/src/services/audit.service.ts`

## Actor Context

`actorCtx(req)` extracts audit context from the authenticated request:

- `householdId` — from `req.householdId`
- `actorId` — from `req.user.userId`
- `actorName` — from `req.user.name`
- `ipAddress` — from `req.ip`
- `userAgent` — from `req.headers["user-agent"]`

Throws `AuthenticationError` if auth context is missing (middleware must run first).

**Source:** `apps/backend/src/lib/actor-ctx.ts`

## Field Denylist

The following fields are **never** included in audit diff metadata:

- `password`
- `passwordHash`
- `email`
- `token`
- `refreshToken`
- `notes`

This is enforced by `REDACTED_FIELDS` in the audit service. If you add a new sensitive field to the schema, add it to this set.

## Retention

Target: 90-day retention for audit log entries and associated IP/user-agent data. **Not yet implemented** — currently logs persist indefinitely.
