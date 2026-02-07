import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/account.service';
import type { AccountType, CreateAccountInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'current' as AccountType,
    openingBalance: '' as string | number,
    currency: 'GBP',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAccountInput) => accountService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateAccountInput = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      description: formData.description,
      openingBalance: formData.openingBalance === '' ? 0 : Number(formData.openingBalance),
    };
    createMutation.mutate(submitData);
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          type="text"
          id="description"
          value={formData.description || ''}
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
          <option value="current">Current</option>
          <option value="savings">Savings</option>
          <option value="isa">ISA</option>
          <option value="stocks_and_shares_isa">Stocks and Shares ISA</option>
        </select>
      </div>

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

      {createMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(createMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}
