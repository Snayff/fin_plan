# Form Validation Pattern

## Rule

Every form submission in the app must follow this pattern. The only exception is `LoginPage`, which uses inline-only errors (auth form UX exception).

## Pattern

1. **Validate against the shared Zod schema** before calling the mutation
2. **On validation failure:** set inline field errors + call `showError('Please fix the errors below.')`
3. **On API error:** call `showError(error.message || 'fallback')` in `onError`

Never rely solely on HTML5 `required` attributes — users can bypass them.

## Standard `handleSubmit` Implementation

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  // Build typed submitData (convert '' to numbers, etc.)
  const submitData: CreateXInput = { ... };

  // Validate against shared Zod schema
  const result = schema.safeParse(submitData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!errors[key]) errors[key] = issue.message;
    }
    setFormErrors(errors);
    showError('Please fix the errors below.');
    return;
  }

  // Use submitData (not result.data) — shared schemas include transforms for the API layer
  mutation.mutate(submitData);
};
```

## Inline Error Display

Beneath each field:

```tsx
{
  formErrors.fieldName && <p className="text-sm text-destructive mt-1">{formErrors.fieldName}</p>;
}
```

## Key Constraint: Use `submitData`, Not `result.data`

Always call `mutation.mutate(submitData)` with the **pre-parse** typed object. The shared Zod schemas include `.transform()` calls designed for the API layer — using `result.data` on the frontend can produce unexpected type changes.

## Toast Messages

| Trigger            | Message                                           |
| ------------------ | ------------------------------------------------- |
| Validation failure | `'Please fix the errors below.'` (always generic) |
| API error          | `error.message` or a specific fallback string     |
