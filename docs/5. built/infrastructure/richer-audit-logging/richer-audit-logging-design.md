---
feature: richer-audit-logging
status: approved
creation_date: 2026-04-18
implemented_date:
---

# Richer Audit Logging — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

The audit system has three compounding issues:

1. **Display gap.** Auth events (login, logout, session revoke) are written to the DB but invisible — the only query endpoint filters on `householdId` and auth rows have none. Users cannot see their own security activity even though the data exists.

2. **Coverage gaps.** ~10 routes perform mutations with no audit coverage: snapshots, gift persons/events/allocations, member profile CRUD, planner year-budget upsert, household rename, invite cancellation, leave-household, data export/import, invite acceptance, and profile name change.

3. **Systemic flaws.** `actorCtx` is optional on service signatures and silently no-ops when absent (forgetting context disables auditing); the resource slug enum has drifted from the strings actually written in code (frontend filter breaks silently); JSON blob fields diff as opaque single-field swaps; no retention policy means the table grows unbounded.

## Approved Approach

**Two UI surfaces, one `AuditLog` table.** No schema change required.

| Surface | Scope | Visible to | Mount point |
|---|---|---|---|
| **Security activity** (new) | Per-user (`householdId IS NULL`, `userId = caller`) | The user themselves only | `/settings/profile` |
| **Audit log** (existing, extended) | Per-household | Household owner + admin | `/settings/household` |

`ipAddress` and `userAgent` are stored in the DB for internal forensics but **never returned to either view**.

### Coverage expansion

Every currently-unaudited mutation is wrapped. Bulk operations (imports, gift allocation bulk upsert, year-budget upsert) emit a **single summary audit row** with counts in `metadata` rather than one row per child — prevents imports flooding the log. Cascade deletes (household deletion) emit a single `DELETE_HOUSEHOLD` row with `metadata.cascaded = { members: N, assets: N, … }`.

### Systemic cleanup

- `actorCtx` becomes a **required** parameter on every service that mutates household data. Compiler rejects callers that forget it.
- Action names are centralised in an `AuditAction` const exported from `packages/shared` — no more bare strings in route/service code.
- Missing slugs (`snapshot`, `user`, `gift-person`, `gift-event`, `gift-allocation`, `member-profile`, `year-budget`, `household`) added to `ResourceSlugEnum`.
- `computeDiff` descends **one level** into a small allowlist of known flat JSON blobs (initially `HouseholdSettings.stalenessThresholds`). Unknown JSON fields stay opaque.
- `twoFactorEnabled` added to SYSTEM_FIELDS denylist (future-proofing for when 2FA endpoints arrive).

### Retention (180 days, in-process)

A `retentionService.purgeOldAuditLogs(db)` function issues a single indexed DELETE for rows older than 180 days. Registered in `app.ts` with `setInterval(…, 24h).unref()` plus a one-time run ~60 s after boot — matching the existing `tokenBlacklist` pattern. Zero deployment config. Silent deletion; both Settings sections note _"Entries older than 180 days are automatically removed."_

### Security activity UI

Columns: **When / Action / Details**

| Event | Details shown |
|---|---|
| `REGISTER` | "Account created" |
| `LOGIN_SUCCESS` | "Signed in" |
| `LOGIN_FAILED` | "Sign-in attempt failed" (no email) |
| `LOGOUT` | "Signed out" |
| `SESSION_REVOKED` | "Session revoked" |
| `ALL_SESSIONS_REVOKED` | "All sessions revoked" |
| `UPDATE_PROFILE` | "Name changed from X to Y" (from metadata) |
| `TOKEN_REFRESH` | **Hidden from view** (kept in DB, excluded from query) |

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope split | Two surfaces, same table | Prevents login-event duplication across multi-household users; no schema change needed |
| IP/UA display | Never surfaced in UI | Matches existing household audit log stance; retained internally for forensics |
| Coverage scope | All ~10 unaudited routes | Avoids shipping "richer audit logs" half-done |
| `actorCtx` optionality | Required (compiler-enforced) | Optional context silently disabled auditing on any forgotten call |
| Action name format | Centralised `AuditAction` const, SCREAMING_SNAKE_CASE | Prevents drift; enables a taxonomy test; matches existing `ResourceSlugEnum` pattern |
| Bulk operations | Summary row with `metadata.counts` | Prevents imports producing hundreds of rows; still surfaces the operation |
| Cascade deletes | Single `DELETE_HOUSEHOLD` row with child-count metadata | Meaningful snapshot at delete time; proportional to user's expectation |
| JSON blob diff | One-level descent for allowlisted flat blobs only | Solves the one real case (`stalenessThresholds`) without over-engineering |
| Retention period | 180 days, all rows | Matches the user-stated requirement; longer than the previously-documented 90-day target |
| Retention mechanism | In-process `setInterval` + startup run | Zero deployment config; matches existing `tokenBlacklist` pattern |
| TOKEN_REFRESH visibility | Hidden from Security activity view | 15-minute heartbeat has no user-actionable value; drowns meaningful events |
| LOGIN_FAILED detail | "Sign-in attempt failed" (no email shown) | Preserves security awareness; avoids surfacing form-field PII |

## Out of Scope

- **Alerting / anomaly detection** (burst LOGIN_FAILED, mass deletes, admin promotions) — separate observability feature
- **Password / 2FA / email-change auditing** — no endpoints exist yet; wire up when they do
- **Surfacing IP/UA** in any UI — separate support/forensics tool if needed
- **Bulk export of audit data** for compliance — separate feature
- **Role-promotion / demotion audit events** — already covered by the existing `audited()` wrapper in `household.service.ts`; no new work needed
