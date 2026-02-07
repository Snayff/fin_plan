import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../services/transaction.service';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import type { TransactionType, CreateTransactionInput } from '../../types';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTransactionInput>({
    accountId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    type: 'expense',
    categoryId: '',
    name: '',
    description: '',
    recurrence: 'none',
    recurrence_end_date: '',
  });

  // Fetch accounts and categories
  const { data: accountsData, isLoading: isLoadingAccounts, error: accountsError } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSuccess?.();
    },
  });

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Auto-select first account if none selected
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0]?.id || '' }));
    }
  }, [accounts, formData.accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Show loading state while fetching data
  if (isLoadingAccounts || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading form data...</p>
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (accountsError || categoriesError) {
    return (
      <div className="py-8">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">Failed to load form data</p>
          {accountsError && <p>Accounts: {(accountsError as Error).message}</p>}
          {categoriesError && <p>Categories: {(categoriesError as Error).message}</p>}
        </div>
        {onCancel && (
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onCancel} variant="secondary">
              Close
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show warning if no accounts exist
  if (accounts.length === 0) {
    return (
      <div className="py-8">
        <div className="bg-warning-subtle border border-warning text-warning px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">No accounts available</p>
          <p>You need to create at least one account before adding transactions.</p>
        </div>
        {onCancel && (
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onCancel} variant="secondary">
              Close
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Monthly Salary, Grocery Shopping"
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
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType, categoryId: '' })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Target Account *</Label>
        <select
          id="accountId"
          required
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select account...</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} (£{Number(account.balance || 0).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="amount"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Transaction Date *</Label>
        <Input
          type="date"
          id="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          value={formData.categoryId || ''}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select category...</option>
          {filteredCategories.map((category) => (
            <React.Fragment key={category.id}>
              <option value={category.id}>{category.name}</option>
              {category.subcategories?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  &nbsp;&nbsp;└─ {sub.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrence">Recurrence</Label>
        <select
          id="recurrence"
          value={formData.recurrence || 'none'}
          onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="none">None</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {formData.recurrence && formData.recurrence !== 'none' && (
        <div className="space-y-2">
          <Label htmlFor="recurrence_end_date">
            End Date <span className="text-muted-foreground font-normal text-xs">(Optional - leave blank for indefinite)</span>
          </Label>
          <Input
            type="date"
            id="recurrence_end_date"
            value={formData.recurrence_end_date || ''}
            onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
            placeholder="Leave blank for indefinite recurrence"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave blank if the transaction should recur indefinitely</p>
        </div>
      )}

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
          {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
}
