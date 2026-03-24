# Form Validation + Toast Error Pattern

**Date:** 2026-03-15
**Branch:** feature/replace_email_w_qr (to be merged, then new branch for this work)

## Problem

Form submissions across the app are inconsistent:
- Some forms validate client-side (GoalForm, BudgetForm), others rely solely on HTML5 `required` attributes
- Some forms show `showError` toasts on API errors, others only show an inline error div
- No form shows a toast on *validation* failure — the user gets no feedback if they bypass HTML5 validation

## Goal

Every form submission (except LoginPage) must:
1. Validate the typed submit data against the shared Zod schema **before** sending to the backend
2. On validation failure: set inline field errors + call `showError('Please fix the errors below.')`
3. On API error: call `showError(error.message || 'fallback')` in `onError`

## Decisions

- **LoginPage**: keep inline-only error (no toast). Auth form UX exception.
- **RegisterPage**: add toast + inline errors.
- **ProfilePage**: already compliant — buttons are disabled when invalid; invite uses Zod + showError already.
- **Inline errors**: field-specific messages (e.g. "Amount must be greater than 0")
- **Toast message on validation failure**: always generic — `'Please fix the errors below.'`

## Standard Pattern

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  // Build typed submitData (convert '' to numbers, etc.) — as forms already do
  const submitData: CreateXInput = { ... };

  // Validate pre-typed data against shared Zod schema
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

  // Use original submitData for mutation (not result.data — avoids transform side-effects)
  mutation.mutate(submitData);
};
```

Inline error display beneath each field:
```tsx
{formErrors.fieldName && (
  <p className="text-sm text-destructive mt-1">{formErrors.fieldName}</p>
)}
```

## Shared Schema Changes

### `packages/shared/src/schemas/goal.schemas.ts`
Add `createGoalContributionSchema`:
```typescript
export const createGoalContributionSchema = z.object({
  amount: z.number().positive('Contribution amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
```

### `packages/shared/src/schemas/budget.schemas.ts`
Add end > start refinement to `createBudgetSchema`:
```typescript
.refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
)
```

## Forms to Update

| Form | Schema to use | Missing onError toast | Notes |
|---|---|---|---|
| `AccountForm` | `createAccountSchema` / `updateAccountSchema` | No (already has it) | Add formErrors + Zod validation |
| `AssetForm` | `createAssetSchema` | Yes | Add formErrors + Zod validation + showError in onError |
| `AssetEditForm` | `updateAssetSchema` | Yes | Same |
| `LiabilityForm` | `createLiabilitySchema` | Yes | Validate nested asset fields when linkMode=new using `createAssetSchema` |
| `LiabilityEditForm` | `updateLiabilitySchema` | Yes | Same nested validation |
| `GoalForm` | `createGoalSchema` / `updateGoalSchema` | Yes | Already has Zod + formErrors — add toast call + onError showError |
| `GoalContributionModal` | `createGoalContributionSchema` (new) | Yes | Add formErrors + Zod + showError |
| `TransactionForm` | `createTransactionSchema` / `updateTransactionSchema` | No (already has it) | Add formErrors + Zod validation |
| `RecurringRuleForm` | `createRecurringRuleSchema` / `updateRecurringRuleSchema` | No (already has it) | Add formErrors + Zod validation |
| `BudgetForm` | `createBudgetSchema` / `updateBudgetSchema` | No (already has it) | Replace `validateForm()` with Zod; add showError on validation fail |
| `RegisterPage` | Inline schema (password rules) | No | Add Zod validation + showError |

## Key Constraint

Always call `mutation.mutate(submitData)` with the **pre-parse** typed object, not `result.data`. The shared schemas include `.transform()` calls designed for the API layer — using transformed output on the frontend can cause unexpected type changes.
