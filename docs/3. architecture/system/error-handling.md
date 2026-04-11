# Error Handling

## Core Rule: Always Throw, Never Inline

Use `throw new AppError(...)` subclasses for all error responses. Never use `reply.status(400).send(...)` inline in route handlers.

This ensures every error passes through the global `errorHandler` for consistent formatting, logging, and production safety.

## Error Class Hierarchy

All classes extend `AppError` and live in `apps/backend/src/utils/errors.ts`:

| Class                 | Status | Code               | When to use                                   |
| --------------------- | ------ | ------------------ | --------------------------------------------- |
| `AuthenticationError` | 401    | `AUTH_ERROR`       | Invalid/missing/expired token, login failures |
| `AuthorizationError`  | 403    | `FORBIDDEN`        | Permission denied (role-based, not ownership) |
| `NotFoundError`       | 404    | `NOT_FOUND`        | Resource not found **or** not owned by caller |
| `ValidationError`     | 400    | `VALIDATION_ERROR` | Invalid input data                            |
| `ConflictError`       | 409    | `CONFLICT`         | Duplicate resource (e.g. duplicate email)     |
| `RateLimitError`      | 429    | `RATE_LIMIT`       | Too many requests                             |

## Global Error Handler

`apps/backend/src/middleware/errorHandler.ts` catches all thrown errors and formats responses.

Handles in order:

1. `AppError` subclasses — returns the error's own status, message, and code.
2. `ZodError` — formats validation issues into readable messages.
3. Fastify validation errors — returns 400 with validation details.
4. Prisma validation errors — parses into user-friendly field messages.
5. Prisma known request errors — handles unique constraint (P2002), not found (P2025), foreign key (P2003).
6. Any error with a sub-500 `statusCode` — passes through.
7. Everything else — returns 500.

## Production Safety

For unhandled 500 errors, the handler returns `"Internal server error"` in production. Detailed error messages are only exposed in development:

```typescript
message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message;
```

Prisma error details (`prismaCode`) are also hidden in production. Never change this behaviour.

## Auth Error Messages

All login and registration failures must use generic messages. Never reveal whether an account exists:

- "Invalid credentials" — not "User not found" or "Wrong password"
- "Registration failed" — not "Email already taken" (use `ConflictError` only for non-auth contexts)

## Ownership Errors

Use `NotFoundError` for both "not found" and "not owned" — see [authorisation-model.md](authorisation-model.md) for details.
