# Data Privacy

## PII Inventory

The following personally identifiable information is stored:

| Field         | Location         | Purpose                         |
| ------------- | ---------------- | ------------------------------- |
| `email`       | `User` table     | Login identifier                |
| `name`        | `User` table     | Display name in household       |
| `dateOfBirth` | `Member` table   | Age-based financial forecasting |
| IP address    | `AuditLog` table | Security audit trail            |
| User agent    | `AuditLog` table | Security audit trail            |

## Storage Rules

1. **Passwords:** Bcrypt-hashed with cost factor 10 (`SALT_ROUNDS` in `apps/backend/src/utils/password.ts`). Plaintext passwords are never stored or logged.
2. **Refresh tokens:** SHA-256 hashed before database storage (`apps/backend/src/utils/jwt.ts`). The raw token exists only in the httpOnly cookie.
3. **No plaintext secrets in the database.** If a new secret field is needed, hash it before storage.

## Logging Rules

1. **Never log** email, password, token values, or refresh tokens.
2. Use `userId` for log correlation — not email.
3. The audit service's `REDACTED_FIELDS` set prevents sensitive values from appearing in audit diff metadata.

## Token Storage

1. **Access tokens:** Memory only (Zustand store). Never written to localStorage, sessionStorage, or cookies.
2. **Refresh tokens:** httpOnly cookie with `sameSite=strict` and `secure=true` in production. Never exposed to JavaScript.
3. **CSRF tokens:** Issued via dedicated endpoint, validated on state-changing requests.

## Cookie Policy

| Attribute  | Value                             |
| ---------- | --------------------------------- |
| `httpOnly` | `true`                            |
| `secure`   | `true` in production              |
| `sameSite` | `strict`                          |
| `path`     | `/api/auth`                       |
| Storage    | No localStorage for tokens — ever |

## Retention

1. **Refresh tokens:** Cleaned up on token family invalidation (reuse detection revokes the full family).
2. **Audit logs + IP/user-agent:** Target 90-day retention. **Not yet implemented** — currently persists indefinitely.
3. When retention cleanup is built, it must cover both `AuditLog` rows and any IP/user-agent fields on related tables.
