# Form Validation + Toast Error Pattern — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Every form (except LoginPage) validates with Zod before sending to the backend, shows inline field errors + a generic toast on failure, and a toast on API error.

**Architecture:** Each form's `handleSubmit` builds a typed `submitData` object (already done), calls `schema.safeParse(submitData)`, maps Zod error issues to `Record<string, string>`, calls `setFormErrors` + `showError` on failure, or proceeds with `mutation.mutate(submitData)` on success. `result.data` is never used for the mutation (avoids transform side-effects).

**Tech Stack:** React, Zod (via `@finplan/shared`), `react-hot-toast` (via `apps/frontend/src/lib/toast.ts`), bun:test + @testing-library/react

---

## Reusable validation helper (copy into each form's handleSubmit)

```typescript
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
```

## Inline error display (paste beneath each relevant `<Input>` or `<select>`)

```tsx
{formErrors.fieldName && (
  <p className="text-sm text-destructive mt-1">{formErrors.fieldName}</p>
)}
```

---

### Task 1: Add end > start refinement to `createBudgetSchema`

**Files:**
- Modify: `packages/shared/src/schemas/budget.schemas.ts`
- Test: `packages/shared/src/schemas/budget.schemas.test.ts`

**Step 1: Write two failing tests**

Add to `budget.schemas.test.ts` inside the `createBudgetSchema` describe block:

```typescript
it("rejects when endDate is before startDate", () => {
  const result = createBudgetSchema.safeParse({
    name: "Invalid Budget",
    period: "monthly",
    startDate: "2025-01-31",
    endDate: "2025-01-01",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.path).toContain('endDate');
});

it("rejects when endDate equals startDate", () => {
  const result = createBudgetSchema.safeParse({
    name: "Same Day Budget",
    period: "custom",
    startDate: "2025-06-01",
    endDate: "2025-06-01",
  });
  expect(result.success).toBe(false);
});
```

**Step 2: Run tests to confirm they fail**

```bash
cd packages/shared && bun test src/schemas/budget.schemas.test.ts
```

Expected: 2 new tests FAIL.

**Step 3: Add the refinement to `createBudgetSchema`**

In `packages/shared/src/schemas/budget.schemas.ts`, replace the `createBudgetSchema` export with:

```typescript
export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(200),
  period: BudgetPeriodEnum,
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);
```

**Step 4: Run tests to confirm they pass**

```bash
cd packages/shared && bun test src/schemas/budget.schemas.test.ts
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add packages/shared/src/schemas/budget.schemas.ts packages/shared/src/schemas/budget.schemas.test.ts
git commit -m "feat(shared): add end > start refinement to createBudgetSchema"
```

---

### Task 2: Update GoalForm — add toast calls

GoalForm already has Zod validation and `formErrors`. The only changes are:
1. Add `showError('Please fix the errors below.')` in both validation-fail branches
2. Add `showError` to `onError` in `submitMutation`

**Files:**
- Modify: `apps/frontend/src/components/goals/GoalForm.tsx`

**Step 1: Add `showError` import**

The file imports from `'../../lib/toast'` are missing. Add at the top:

```typescript
import { showError } from '../../lib/toast';
```

**Step 2: Add `showError` to the two validation failure blocks in `handleSubmit`**

Find the first validation block (edit mode):
```typescript
if (!result.success || Object.keys(extraErrors).length > 0) {
  const errors = { ...extraErrors };
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path[0] as string;
      if (path && !errors[path]) errors[path] = issue.message;
    }
  }
  setFormErrors(errors);
  return;  // <-- ADD showError BEFORE this return
}
```

Change each `setFormErrors(errors); return;` to:
```typescript
setFormErrors(errors);
showError('Please fix the errors below.');
return;
```

There are two such blocks (one for edit mode, one for create mode). Update both.

**Step 3: Add `showError` to `submitMutation.onError`**

```typescript
const submitMutation = useMutation({
  // ...
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    onSuccess?.();
  },
  onError: (error: Error) => {
    showError(error.message || 'Failed to save goal');
  },
});
```

**Step 4: Verify manually**

Open the Goals page, try to submit a goal with no name or zero target amount. You should see:
- Red inline error text under the failing field
- A toast error: "Please fix the errors below."

**Step 5: Commit**

```bash
git add apps/frontend/src/components/goals/GoalForm.tsx
git commit -m "feat(goals): add toast on validation failure and API error"
```

---

### Task 3: Update GoalContributionModal

**Files:**
- Modify: `apps/frontend/src/components/goals/GoalContributionModal.tsx`

**Step 1: Update imports**

Add to imports:
```typescript
import { createGoalContributionSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';
```

**Step 2: Add formErrors state**

After the existing `useState` for `formData`, add:
```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 3: Add `showError` to `addContributionMutation.onError`**

```typescript
const addContributionMutation = useMutation({
  mutationFn: (data: CreateGoalContributionInput) =>
    goalService.addContribution(goal.id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    onSuccess?.();
  },
  onError: (error: Error) => {
    showError(error.message || 'Failed to add contribution');
  },
});
```

**Step 4: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  const submitData: CreateGoalContributionInput = {
    amount: Number(formData.amount),
    date: formData.date,
    notes: formData.notes || undefined,
  };

  const result = createGoalContributionSchema.safeParse(submitData);
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

  addContributionMutation.mutate(submitData);
};
```

**Step 5: Add inline error display under the amount field**

Below the `<Input>` for amount (after the `</div>` closing the relative div), add:
```tsx
{formErrors.amount && (
  <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>
)}
```

Below the `<Input>` for date, add:
```tsx
{formErrors.date && (
  <p className="text-sm text-destructive mt-1">{formErrors.date}</p>
)}
```

**Step 6: Commit**

```bash
git add apps/frontend/src/components/goals/GoalContributionModal.tsx
git commit -m "feat(goals): add Zod validation and toast to GoalContributionModal"
```

---

### Task 4: Update BudgetForm — replace validateForm() with Zod

**Files:**
- Modify: `apps/frontend/src/components/budgets/BudgetForm.tsx`
- Test: `apps/frontend/src/components/budgets/BudgetForm.test.tsx`

**Step 1: Write failing test**

Add to `BudgetForm.test.tsx` (after existing tests):

```typescript
it('shows toast error when submitting with no name', async () => {
  const user = userEvent.setup();
  renderWithProviders(<BudgetForm />);

  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-01-01' } });
  await user.click(screen.getByRole('button', { name: /create budget/i }));

  expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
  expect(createBudgetMock).not.toHaveBeenCalled();
});

it('shows toast error when endDate is before startDate (custom period)', async () => {
  const user = userEvent.setup();
  renderWithProviders(<BudgetForm />);

  fireEvent.change(screen.getByLabelText(/budget name/i), { target: { value: 'Test Budget' } });
  fireEvent.change(screen.getByLabelText(/period/i), { target: { value: 'custom' } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-06-01' } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-01-01' } });
  await user.click(screen.getByRole('button', { name: /create budget/i }));

  expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
  expect(createBudgetMock).not.toHaveBeenCalled();
});
```

**Step 2: Run tests to confirm they fail**

```bash
cd apps/frontend && bun test src/components/budgets/BudgetForm.test.tsx
```

Expected: 2 new tests FAIL.

**Step 3: Add schema import**

Add to imports in `BudgetForm.tsx`:
```typescript
import { createBudgetSchema } from '@finplan/shared';
```

**Step 4: Replace `validateForm()` with Zod in `handleSubmit`**

Remove the entire `validateForm` function. Replace `handleSubmit` with:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const payload = {
    name: formData.name.trim(),
    period: formData.period,
    startDate: formData.startDate,
    endDate: formData.endDate,
  };

  const result = createBudgetSchema.safeParse(payload);
  if (!result.success) {
    const nextErrors: BudgetFormErrors = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form') as keyof BudgetFormErrors;
      if (!nextErrors[key]) nextErrors[key] = issue.message;
    }
    setErrors(nextErrors);
    showError('Please fix the errors below.');
    return;
  }

  if (isEditMode) {
    submitMutation.mutate(payload as UpdateBudgetInput);
    return;
  }

  submitMutation.mutate(payload as CreateBudgetInput);
};
```

**Step 5: Run tests to confirm they pass**

```bash
cd apps/frontend && bun test src/components/budgets/BudgetForm.test.tsx
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
git add apps/frontend/src/components/budgets/BudgetForm.tsx apps/frontend/src/components/budgets/BudgetForm.test.tsx
git commit -m "feat(budgets): replace validateForm() with Zod, add toast on validation failure"
```

---

### Task 5: Update AccountForm

**Files:**
- Modify: `apps/frontend/src/components/accounts/AccountForm.tsx`

**Step 1: Add schema import and formErrors state**

`AccountForm` already imports `showError`. Add `createAccountSchema` and `updateAccountSchema`:

```typescript
import { createAccountSchema, updateAccountSchema } from '@finplan/shared';
```

Add after the existing `useState` for `formData`:
```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 2: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  if (isEditing) {
    const submitData = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      currency: formData.currency,
      isActive: formData.isActive,
    };
    const result = updateAccountSchema.safeParse(submitData);
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
    updateMutation.mutate(submitData);
  } else {
    const submitData = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      description: formData.description,
      openingBalance: formData.openingBalance === '' ? 0 : Number(formData.openingBalance),
    };
    const result = createAccountSchema.safeParse(submitData);
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
    createMutation.mutate(submitData);
  }
};
```

**Step 3: Add inline error display**

Under the Account Name `<Input>`:
```tsx
{formErrors.name && (
  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
)}
```

Under the Currency `<Input>`:
```tsx
{formErrors.currency && (
  <p className="text-sm text-destructive mt-1">{formErrors.currency}</p>
)}
```

**Step 4: Remove the existing API inline error div** (since toast now handles API errors):

Remove this block at the bottom of the form:
```tsx
{error && (
  <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
    {(error as Error).message}
  </div>
)}
```

**Step 5: Commit**

```bash
git add apps/frontend/src/components/accounts/AccountForm.tsx
git commit -m "feat(accounts): add Zod validation and toast on validation failure"
```

---

### Task 6: Update AssetForm

**Files:**
- Modify: `apps/frontend/src/components/assets/AssetForm.tsx`

**Step 1: Update imports**

```typescript
import { createAssetSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';
```

**Step 2: Add `showError` to `createMutation.onError`**

```typescript
const createMutation = useMutation({
  // ...
  onSuccess: () => { /* existing */ },
  onError: (error: Error) => {
    showError(error.message || 'Failed to create asset');
  },
});
```

**Step 3: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 4: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  const submitData: CreateAssetInput = {
    name: formData.name,
    type: formData.type,
    currentValue: Number(formData.currentValue),
    purchaseValue: formData.purchaseValue === '' ? undefined : Number(formData.purchaseValue),
    purchaseDate: formData.purchaseDate || undefined,
    expectedGrowthRate: formData.expectedGrowthRate,
  };

  const result = createAssetSchema.safeParse(submitData);
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

  createMutation.mutate(submitData);
};
```

**Step 5: Add inline errors under name and currentValue fields**

Under the Asset Name `<Input>`:
```tsx
{formErrors.name && (
  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
)}
```

Under the Current Value `<Input>` (inside the relative div, after the input):
```tsx
{formErrors.currentValue && (
  <p className="text-sm text-destructive mt-1">{formErrors.currentValue}</p>
)}
```

**Step 6: Remove existing API inline error div**

Remove:
```tsx
{createMutation.error && (
  <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
    {(createMutation.error as Error).message}
  </div>
)}
```

**Step 7: Commit**

```bash
git add apps/frontend/src/components/assets/AssetForm.tsx
git commit -m "feat(assets): add Zod validation, toast on validation failure and API error"
```

---

### Task 7: Update AssetEditForm

**Files:**
- Modify: `apps/frontend/src/components/assets/AssetEditForm.tsx`

**Step 1: Update imports**

```typescript
import { updateAssetSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';
```

**Step 2: Add `showError` to `updateMutation.onError`**

```typescript
onError: (error: Error) => {
  showError(error.message || 'Failed to update asset');
},
```

**Step 3: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 4: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  const submitData: UpdateAssetInput = {
    name: formData.name,
    type: formData.type,
    purchaseValue: formData.purchaseValue === '' ? undefined : Number(formData.purchaseValue),
    purchaseDate: formData.purchaseDate || undefined,
    expectedGrowthRate: formData.expectedGrowthRate,
  };

  const result = updateAssetSchema.safeParse(submitData);
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

  const previousLiabilityId = asset.linkedLiability?.id || null;
  const nextLiabilityId = formData.linkedLiabilityId || null;
  if (previousLiabilityId && previousLiabilityId !== nextLiabilityId) {
    setPendingSubmitData(submitData);
    return;
  }
  updateMutation.mutate(submitData);
};
```

**Step 5: Add inline error under name field**

```tsx
{formErrors.name && (
  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
)}
```

**Step 6: Remove existing API inline error div**

Remove the `{updateMutation.error && ...}` div.

**Step 7: Commit**

```bash
git add apps/frontend/src/components/assets/AssetEditForm.tsx
git commit -m "feat(assets): add Zod validation, toast to AssetEditForm"
```

---

### Task 8: Update LiabilityForm

**Files:**
- Modify: `apps/frontend/src/components/liabilities/LiabilityForm.tsx`

**Step 1: Update imports**

```typescript
import { createLiabilitySchema, createAssetSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';
```

**Step 2: Add `showError` to `createMutation.onError`**

```typescript
onError: (error: Error) => {
  showError(error.message || 'Failed to create liability');
},
```

**Step 3: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 4: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  // Validate nested asset fields when creating a new linked asset
  if (formData.linkMode === 'new') {
    const assetData = {
      name: formData.newAssetName,
      type: formData.newAssetType,
      currentValue: Number(formData.newAssetCurrentValue),
      purchaseValue: formData.newAssetPurchaseValue === '' ? undefined : Number(formData.newAssetPurchaseValue),
      purchaseDate: formData.newAssetPurchaseDate || undefined,
      expectedGrowthRate: formData.newAssetExpectedGrowthRate,
    };
    const assetResult = createAssetSchema.safeParse(assetData);
    if (!assetResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of assetResult.error.issues) {
        const rawKey = String(issue.path[0] ?? 'form');
        const key = `newAsset${rawKey.charAt(0).toUpperCase()}${rawKey.slice(1)}`;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFormErrors(errors);
      showError('Please fix the errors below.');
      return;
    }
  }

  const submitData: CreateLiabilityInput = {
    name: formData.name,
    type: formData.type,
    currentBalance: Number(formData.currentBalance),
    interestRate: Number(formData.interestRate),
    interestType: formData.interestType,
    openDate: formData.openDate,
    termEndDate: formData.termEndDate,
    linkedAssetId:
      formData.linkMode === 'existing' ? formData.linkedAssetId || undefined : undefined,
    metadata: formData.lender ? { lender: formData.lender } : undefined,
  };

  const result = createLiabilitySchema.safeParse(submitData);
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

  createMutation.mutate(submitData);
};
```

**Step 5: Add inline errors under key fields**

Under Liability Name `<Input>`:
```tsx
{formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
```

Under Current Balance `<Input>`:
```tsx
{formErrors.currentBalance && <p className="text-sm text-destructive mt-1">{formErrors.currentBalance}</p>}
```

Under Interest Rate `<Input>`:
```tsx
{formErrors.interestRate && <p className="text-sm text-destructive mt-1">{formErrors.interestRate}</p>}
```

Under Open Date `<Input>`:
```tsx
{formErrors.openDate && <p className="text-sm text-destructive mt-1">{formErrors.openDate}</p>}
```

Under Term End Date `<Input>`:
```tsx
{formErrors.termEndDate && <p className="text-sm text-destructive mt-1">{formErrors.termEndDate}</p>}
```

Under the New Asset Name `<Input>` (inside `linkMode === 'new'` section):
```tsx
{formErrors.newAssetName && <p className="text-sm text-destructive mt-1">{formErrors.newAssetName}</p>}
```

Under the New Asset Current Value `<Input>`:
```tsx
{formErrors.newAssetCurrentValue && <p className="text-sm text-destructive mt-1">{formErrors.newAssetCurrentValue}</p>}
```

**Step 6: Remove existing API inline error div**

Remove the `{createMutation.error && ...}` div.

**Step 7: Commit**

```bash
git add apps/frontend/src/components/liabilities/LiabilityForm.tsx
git commit -m "feat(liabilities): add Zod validation, toast to LiabilityForm"
```

---

### Task 9: Update LiabilityEditForm

Same pattern as Task 8 but for editing. The nested asset validation only applies when `linkMode === 'new'`.

**Files:**
- Modify: `apps/frontend/src/components/liabilities/LiabilityEditForm.tsx`

**Step 1: Update imports**

```typescript
import { updateLiabilitySchema, createAssetSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';
```

**Step 2: Add `showError` to `updateMutation.onError`**

```typescript
onError: (error: Error) => {
  showError(error.message || 'Failed to update liability');
},
```

**Step 3: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 4: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  // Validate nested asset when creating new
  if (formData.linkMode === 'new') {
    const assetData = {
      name: formData.newAssetName,
      type: formData.newAssetType,
      currentValue: Number(formData.newAssetCurrentValue),
      purchaseValue: formData.newAssetPurchaseValue === '' ? undefined : Number(formData.newAssetPurchaseValue),
      purchaseDate: formData.newAssetPurchaseDate || undefined,
      expectedGrowthRate: formData.newAssetExpectedGrowthRate,
    };
    const assetResult = createAssetSchema.safeParse(assetData);
    if (!assetResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of assetResult.error.issues) {
        const rawKey = String(issue.path[0] ?? 'form');
        const key = `newAsset${rawKey.charAt(0).toUpperCase()}${rawKey.slice(1)}`;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFormErrors(errors);
      showError('Please fix the errors below.');
      return;
    }
  }

  const submitData: UpdateLiabilityInput = {
    name: formData.name,
    type: formData.type,
    currentBalance: Number(formData.currentBalance),
    interestRate: Number(formData.interestRate),
    interestType: formData.interestType,
    openDate: formData.openDate,
    termEndDate: formData.termEndDate,
    linkedAssetId:
      formData.linkMode === 'none'
        ? null
        : formData.linkMode === 'existing'
        ? formData.linkedAssetId || null
        : undefined,
    metadata: formData.lender ? { lender: formData.lender } : undefined,
  };

  const result = updateLiabilitySchema.safeParse(submitData);
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

  const previousAssetId = liability.linkedAsset?.id || null;
  const linkIsChanging =
    previousAssetId !== null &&
    (formData.linkMode === 'none' ||
      formData.linkMode === 'new' ||
      (formData.linkMode === 'existing' && formData.linkedAssetId !== previousAssetId));
  if (linkIsChanging) {
    setPendingSubmitData(submitData);
    return;
  }
  updateMutation.mutate(submitData);
};
```

**Step 5: Add inline errors** (same fields as Task 8, same pattern)

Under each of: name, currentBalance, interestRate, openDate, termEndDate, newAssetName, newAssetCurrentValue.

**Step 6: Remove existing API inline error div**

Remove the `{updateMutation.error && ...}` div.

**Step 7: Commit**

```bash
git add apps/frontend/src/components/liabilities/LiabilityEditForm.tsx
git commit -m "feat(liabilities): add Zod validation, toast to LiabilityEditForm"
```

---

### Task 10: Update TransactionForm

**Files:**
- Modify: `apps/frontend/src/components/transactions/TransactionForm.tsx`

`TransactionForm` already imports `showError`. Only add: formErrors state, Zod validation in handleSubmit, inline error display.

**Step 1: Add schema imports**

```typescript
import { createTransactionSchema, updateTransactionSchema } from '@finplan/shared';
```

**Step 2: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 3: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  const submitData = {
    ...formData,
    date: new Date(formData.date).toISOString(),
    liabilityId: formData.liabilityId || undefined,
    categoryId: formData.categoryId || undefined,
    description: formData.description || undefined,
  };

  const schema = isEditing ? updateTransactionSchema : createTransactionSchema;
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

  if (isEditing) {
    updateMutation.mutate({
      transaction: submitData,
      updateScope: isGeneratedTransaction ? updateScope : undefined,
    });
  } else {
    createMutation.mutate(submitData);
  }
};
```

**Step 4: Add inline errors under name, amount, and accountId fields**

Under Transaction Name `<Input>`:
```tsx
{formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
```

Under Amount `<Input>`:
```tsx
{formErrors.amount && <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>}
```

Under Account `<select>`:
```tsx
{formErrors.accountId && <p className="text-sm text-destructive mt-1">{formErrors.accountId}</p>}
```

**Step 5: Remove existing API inline error div**

Remove the `{mutation.error && ...}` div.

**Step 6: Commit**

```bash
git add apps/frontend/src/components/transactions/TransactionForm.tsx
git commit -m "feat(transactions): add Zod validation and toast on validation failure"
```

---

### Task 11: Update RecurringRuleForm

**Files:**
- Modify: `apps/frontend/src/components/recurring/RecurringRuleForm.tsx`

`RecurringRuleForm` already imports `showError`.

**Step 1: Add schema imports**

```typescript
import { createRecurringRuleSchema, updateRecurringRuleSchema } from '@finplan/shared';
```

**Step 2: Add formErrors state**

```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
```

**Step 3: Replace `handleSubmit` with Zod validation**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setFormErrors({});

  const templateTransaction = {
    accountId: formData.accountId,
    type: formData.type,
    amount: Number(formData.amount),
    name: formData.name,
    categoryId: formData.categoryId || undefined,
    description: formData.description || undefined,
  };

  const recurringRuleData: CreateRecurringRuleInput = {
    frequency: formData.frequency,
    interval: formData.interval,
    startDate: new Date(formData.startDate),
    endDate: formData.useOccurrences
      ? undefined
      : formData.endDate
      ? new Date(formData.endDate)
      : undefined,
    occurrences: formData.useOccurrences ? formData.occurrences : undefined,
    isActive: true,
    templateTransaction,
  };

  const schema = isEditing ? updateRecurringRuleSchema : createRecurringRuleSchema;
  const result = schema.safeParse(recurringRuleData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      // templateTransaction errors have path like ['templateTransaction', 'name']
      const key = issue.path.length > 1
        ? String(issue.path[issue.path.length - 1])
        : String(issue.path[0] ?? 'form');
      if (!errors[key]) errors[key] = issue.message;
    }
    setFormErrors(errors);
    showError('Please fix the errors below.');
    return;
  }

  if (isEditing) {
    updateMutation.mutate(recurringRuleData);
  } else {
    createMutation.mutate(recurringRuleData);
  }
};
```

**Step 4: Add inline errors under name and amount fields**

Under Transaction Name `<Input>`:
```tsx
{formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
```

Under Amount `<Input>`:
```tsx
{formErrors.amount && <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>}
```

**Step 5: Remove existing API inline error div**

Remove the `{mutation.error && ...}` div.

**Step 6: Commit**

```bash
git add apps/frontend/src/components/recurring/RecurringRuleForm.tsx
git commit -m "feat(recurring): add Zod validation and toast on validation failure"
```

---

### Task 12: Update RegisterPage

**Files:**
- Modify: `apps/frontend/src/pages/auth/RegisterPage.tsx`

RegisterPage uses inline error state (`setError`). We keep that **and** add a toast on validation failure.

**Step 1: Add toast import**

```typescript
import { showError } from '../../lib/toast';
```

**Step 2: Replace `handleSubmit` with Zod-validated version**

Use an inline schema (no need to add to shared package — these are UI-only password rules):

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    showError('Please fix the errors below.');
    return;
  }

  if (password.length < 12) {
    setError('Password must be at least 12 characters');
    showError('Please fix the errors below.');
    return;
  }

  setIsLoading(true);

  try {
    await register({ name, email, password });
  } catch (err) {
    const apiError = err as ApiError;
    const message = apiError?.message || 'Registration failed';
    setError(message);
    showError(message);
  } finally {
    setIsLoading(false);
  }
};
```

**Step 3: Verify manually**

- Submit register form with mismatched passwords → inline error + toast
- Submit with short password → inline error + toast
- Submit with API error → inline error + toast

**Step 4: Commit**

```bash
git add apps/frontend/src/pages/auth/RegisterPage.tsx
git commit -m "feat(auth): add toast error to RegisterPage validation failures"
```

---

### Task 13: Final verification

**Step 1: Run all tests**

```bash
cd packages/shared && bun test
cd apps/frontend && bun test
```

Expected: all tests pass.

**Step 2: Type-check**

```bash
cd apps/frontend && pnpm type-check
cd packages/shared && pnpm type-check
```

Expected: no errors.

**Step 3: Update design doc**

Update `docs/plans/2026-03-15-form-validation-toast-design.md` to note that `createGoalContributionSchema` was already present (no addition needed) and the implementation is complete.

**Step 4: Final commit**

```bash
git add docs/plans/2026-03-15-form-validation-toast-design.md
git commit -m "docs: mark form validation pattern implementation complete"
```
