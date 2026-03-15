import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/account.service';
import { showSuccess, showError } from '../../lib/toast';
import { ACCOUNT_TYPE_OPTIONS } from '../../lib/utils';
import { createAccountSchema, updateAccountSchema } from '@finplan/shared';
import type { Account, AccountType, CreateAccountInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AccountFormProps {
  account?: Account;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const isEditing = !!account;
  const queryClient = useQueryClient();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: account?.name ?? '',
    type: (account?.type ?? 'current') as AccountType,
    description: account?.description ?? '',
    openingBalance: '' as string | number,
    currency: account?.currency ?? 'GBP',
    isActive: account?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAccountInput) => accountService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('Account created!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create account');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAccountInput> & { isActive?: boolean }) =>
      accountService.updateAccount(account!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Account updated!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update account');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name *</Label>
        <Input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Current Account"
        />
        {formErrors.name && (
          <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          type="text"
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Input
          type="text"
          id="currency"
          required
          maxLength={3}
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
          placeholder="GBP"
        />
        {formErrors.currency && (
          <p className="text-sm text-destructive mt-1">{formErrors.currency}</p>
        )}
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="openingBalance">Opening Balance</Label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-muted-foreground">£</span>
            <Input
              type="number"
              id="openingBalance"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="pl-8"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Can be negative for credit cards or loans (e.g., -1000 for £1000 debt). Leave empty to default to 0.
          </p>
        </div>
      )}

      {isEditing && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-input focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Account is active
          </Label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary" disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing ? 'Updating...' : 'Creating...'
            : isEditing ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}
