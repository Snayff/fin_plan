# Type Safety Policy

## ESLint Target

The project targets `no-explicit-any: 'error'`. Currently `'off'` — the rule cannot be promoted to `'warn'` until ~200+ existing `any` usages in test mocks and service files are cleaned up (CI enforces `--max-warnings 0`). Critical security paths (auth middleware, actor-ctx, API client) have already been fixed. Every new code must be fully typed — do not introduce new `any` usage.

## Shared Schema Consumption

1. Zod schemas live in `packages/shared/src/schemas/` and are the single source of truth for request/response shapes.
2. API client methods use `unknown` for request bodies and derive response types from Zod-inferred types (`z.infer<typeof schema>`).
3. Never duplicate type definitions between frontend and backend — import from `@finplan/shared`.

## No `as any` Escapes

If a type doesn't fit, fix the type — don't cast. This applies everywhere, but is especially critical in:

- Auth middleware and token handling
- API client request/response flows
- Component data flows (props, state, context)

If a third-party library has incomplete types, create a proper type declaration file (`.d.ts`) rather than casting.

## Non-Null Assertions

Prefer early-return guards or nullish coalescing (`??`) over non-null assertions (`!`).

```typescript
// Prefer this:
if (!req.householdId) {
  throw new AuthenticationError("Missing household context");
}
const householdId = req.householdId;

// Over this:
const householdId = req.householdId!;
```

The one accepted exception: `req.householdId!` in route handlers where `authMiddleware` is guaranteed to have run in `preHandler`. This is a known-safe pattern documented in the authorisation model.

## TypeScript Compiler Settings

Strict mode is enabled with these additional flags:

- `noUnusedLocals` — no dead local variables
- `noUnusedParameters` — no dead parameters (prefix with `_` if intentionally unused)
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
