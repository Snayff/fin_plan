import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/account.service';
import { showSuccess, showError } from '../../lib/toast';
import type { Account, AccountType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AccountEditFormProps {
  account: Account;
  onSuccess: () => void;
  onCancel: () => void;
}

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

export default function AccountEditForm({ account, onSuccess, onCancel }: AccountEditFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    balance: account.balance.toString(),
    currency: account.currency,
    isActive: account.isActive,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => accountService.updateAccount(account.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Account updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update account');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: formData.name,
      type: formData.type as AccountType,
      balance: parseFloat(formData.balance),
      currency: formData.currency,
      isActive: formData.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Account Name *</Label>
        <Input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Checking"
        />
      </div>

      <div className="space-y-2">
        <Label>Account Type *</Label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {accountTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Current Balance *</Label>
        <Input
          type="number"
          step="0.01"
          required
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label>Currency *</Label>
        <Input
          type="text"
          required
          maxLength={3}
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
          placeholder="USD"
        />
      </div>

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

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Updating...' : 'Update Account'}
        </Button>
      </div>
    </form>
  );
}
