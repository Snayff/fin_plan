# Household Sharing & Invitations — Design Document

**Date:** 2026-03-02
**Status:** Approved

---

## 1. Overview

FinPlan is currently a single-user personal finance app. This design introduces a **household model**: multiple users can share a single financial dataset. A household is the primary unit of data ownership — all accounts, transactions, budgets, goals, assets, and liabilities belong to a household, not an individual user.

Users can belong to multiple independent households and switch between them. The creator of a household is its **owner** — only owners can invite new members.

---

## 2. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data ownership | Household-scoped (all FK → `householdId`) | Clean, scalable, truly shared |
| Active household | Persisted in DB (`activeHouseholdId` on User) | Remembered across sessions |
| Invite token expiry | 24 hours, single-use | Standard; email delivery can take several minutes |
| New user invite flow | Name + password (full signup) | Permanent credentials needed for future logins |
| Existing user invite flow | Log in → join confirmation | Reuse existing account |
| Token security | SHA-256 hash stored; raw token in email URL | Consistent with existing refresh token pattern |
| Email service | nodemailer | Simple, supports real SMTP + Ethereal test transport |
| Invite permission | Owner only | Prevent uncontrolled growth |
| Member roles | `owner` or `member` (no elevated permissions for member) | Simple; owners have full admin control |

---

## 3. Data Model

### New Models

#### `Household`
```
id          UUID (primary)
name        String
createdAt   DateTime
updatedAt   DateTime
```

#### `HouseholdMember` (junction)
```
householdId UUID → Household.id
userId      UUID → User.id
role        Enum: owner | member
joinedAt    DateTime

PK: (householdId, userId)
```

#### `HouseholdInvite`
```
id               UUID (primary)
householdId      UUID → Household.id
email            String (the invited address)
tokenHash        String (SHA-256 of the raw token, unique index)
expiresAt        DateTime (createdAt + 24h)
usedAt           DateTime? (null until accepted)
createdByUserId  UUID → User.id
createdAt        DateTime
```

### Modified Models

**`User`** gains:
```
activeHouseholdId   UUID? → Household.id
```

**All financial tables** — `Account`, `Transaction`, `Category`, `Budget`, `BudgetItem`, `Goal`, `GoalContribution`, `Asset`, `AssetValueHistory`, `Liability`, `Forecast`, `ForecastScenario`, `MonteCarloSimulation`, `RecurringRule` — replace `userId` FK with `householdId` FK.

**Auth tables** (`RefreshToken`, `Device`, `AuditLog`) retain `userId` — they are per-user, not per-household.

### Migration

The Prisma migration includes a **data migration script** that runs inline:
1. For every existing `User`, create a `Household` named `"<user.name>'s Household"`
2. Insert a `HouseholdMember` row (role: `owner`)
3. Update all financial records owned by that user to point to the new household
4. Set `activeHouseholdId` on the User

---

## 4. Invite Flow

### Sending an Invite (owner only)

1. Owner navigates to Household Settings and enters an email address
2. Frontend calls `POST /api/households/:id/invite` with `{ email }`
3. Backend validates:
   - Caller is a member with role `owner`
   - No active (unexpired, unused) invite already exists for that email + household
4. Generates a 32-byte cryptographically random token; stores `sha256(token)` in DB
5. Sends email to the invited address with link: `<APP_URL>/accept-invite?token=<rawToken>`
6. Returns success

Rate limited: 5 invites per hour per household.

### Accepting an Invite — New User

1. User clicks email link → lands on `/accept-invite?token=<token>`
2. Frontend calls `GET /api/auth/invite/:token`; backend returns `{ householdName, email }` (validates token is valid, unexpired, unused)
3. Page shows: "You've been invited to join **[Household Name]**. Create your account."
4. User enters: name, password, confirm password (email pre-filled, read-only)
5. Frontend calls `POST /api/auth/invite/:token/accept` with `{ name, password }`
6. Backend:
   - Validates token again
   - Creates `User` with the invited email + hashed password
   - Marks invite `usedAt`
   - Adds `HouseholdMember` (role: `member`)
   - Sets `activeHouseholdId` to the household
   - Returns JWT access token + sets refresh token cookie
7. Frontend stores auth state, redirects to dashboard

### Accepting an Invite — Existing User

1. User clicks email link → lands on `/accept-invite?token=<token>`
2. Frontend calls `GET /api/auth/invite/:token`
3. If already logged in: page shows "Join **[Household Name]**?" confirmation button
4. If not logged in: shows login form → on successful login, shows confirmation
5. On confirmation, frontend calls `POST /api/auth/invite/:token/join` (auth required)
6. Backend:
   - Validates token
   - Verifies the logged-in user's email matches the invite email
   - Marks invite `usedAt`
   - Adds `HouseholdMember` (role: `member`)
   - Sets `activeHouseholdId` to the new household
7. Frontend invalidates React Query cache, redirects to dashboard (now in new household)

---

## 5. Household Management API

All endpoints require authentication. Household-scoped data endpoints resolve `householdId` from `user.activeHouseholdId`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/households` | any member | List all households the user belongs to |
| POST | `/api/households` | authenticated | Create a new household (caller becomes owner) |
| PATCH | `/api/households/:id` | owner | Rename the household |
| POST | `/api/households/:id/switch` | member | Switch active household |
| GET | `/api/households/:id/members` | member | List members + pending invites |
| POST | `/api/households/:id/invite` | owner | Send invite email |
| DELETE | `/api/households/:id/members/:userId` | owner | Remove a member |
| DELETE | `/api/households/:id/invites/:inviteId` | owner | Cancel a pending invite |

**Public invite endpoints** (no auth required):
| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/invite/:token` | Validate token; return `{ householdName, email }` |
| POST | `/api/auth/invite/:token/accept` | Create new user + join household |
| POST | `/api/auth/invite/:token/join` | Existing user joins (auth required) |

---

## 6. Request Context

The auth middleware is updated to:
1. Verify JWT, load user
2. Set `request.user = user`
3. Set `request.householdId = user.activeHouseholdId`
4. Return 403 if `activeHouseholdId` is null (shouldn't happen after migration, but guards against edge cases)

All data queries use `request.householdId` instead of `request.user.id`.

---

## 7. Email Service

**Library:** `nodemailer`

**Development:** Auto-provision Ethereal test account on startup; log preview URL to console for each email sent.

**Production:** Configure via environment variables:
```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@finplan.app
APP_URL=https://app.finplan.app
```

**Invite email content:**
- Subject: `"[Name] has invited you to join [Household Name] on FinPlan"`
- Body: brief explanation + CTA button linking to the accept invite URL
- Plain-text fallback

---

## 8. Frontend Changes

### New Route: `/accept-invite`
Public route (not behind auth guard). Handles the full invite acceptance UX for both new and existing users.

### Household Switcher (Layout header)
- Dropdown showing current household name + all user's households
- "Create new household" option
- On switch: calls switch endpoint, invalidates all React Query caches

### Household Settings Page (`/settings/household`)
- Household name (editable for owner)
- Members list with role badge; owner can remove members
- Pending invites list with cancel button (owner only)
- Invite form: email input + Send button (owner only, with validation feedback)

### Auth Store Update
- Store `activeHousehold: { id: string, name: string, role: 'owner' | 'member' }` in Zustand
- Populate on login from user response
- Update on household switch

---

## 9. Registration Change

When a new user registers (via the normal sign-up flow), the backend automatically:
1. Creates a `Household` named `"<name>'s Household"`
2. Inserts a `HouseholdMember` row (role: `owner`)
3. Sets `activeHouseholdId` on the new user

No change to the registration UI.

---

## 10. Security

- **Token entropy:** `crypto.randomBytes(32)` — 256-bit entropy
- **Token hashing:** Only SHA-256 hash stored in DB; raw token only in the email URL
- **Single-use:** `usedAt` set immediately on acceptance; subsequent attempts rejected
- **Email binding:** On `join` (existing user), backend verifies logged-in user's email matches invite email
- **Ownership guards:** All invite/member-management endpoints verify `role === 'owner'` in `HouseholdMember`
- **Rate limiting:** 5 invites/hour/household using existing `@fastify/rate-limit`
- **Membership verification:** Auth middleware confirms user has an `activeHouseholdId` before any data request

---

## 11. Verification Plan

| Test | Expected Result |
|---|---|
| Register new user | Personal household auto-created; user is owner |
| Switch to personal household in switcher | Data refreshes to personal household |
| Owner sends invite to new email | Email received with working link |
| New user accepts invite | Account created, logged in, sees household data |
| Owner views Household Settings | Both members listed |
| Create second household + switch | Data scope changes; original household accessible via switcher |
| Expired token (manually set `expiresAt` to past) | `GET /invite/:token` returns 410 Gone |
| Already-used token | `POST /invite/:token/accept` returns 410 Gone |
| Wrong email on existing user join | `POST /invite/:token/join` returns 403 |
| Member attempts to invite | `POST /api/households/:id/invite` returns 403 |
| Rate limit test (6 invites) | 6th invite returns 429 Too Many Requests |
