import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringService } from '../../services/recurring.service';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import { showSuccess, showError } from '../../lib/toast';
import type {
  RecurringRule,
  RecurringFrequency,
  CreateRecurringRuleInput,
  TransactionType,
} from '../../types';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface RecurringRuleFormProps {
  recurringRule?: RecurringRule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RecurringRuleForm({
  recurringRule,
  onSuccess,
  onCancel,
}: RecurringRuleFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!recurringRule;

  const [formData, setFormData] = useState({
    // Recurring rule fields
    frequency: (recurringRule?.frequency || 'monthly') as RecurringFrequency,
    interval: recurringRule?.interval || 1,
    startDate: recurringRule
      ? format(new Date(recurringRule.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    endDate: recurringRule?.endDate
      ? format(new Date(recurringRule.endDate), 'yyyy-MM-dd')
      : '',
    occurrences: recurringRule?.occurrences || null,
    useOccurrences: !!recurringRule?.occurrences, // Toggle for occurrences vs endDate

    // Template transaction fields
    accountId: recurringRule?.templateTransaction.accountId || '',
    type: (recurringRule?.templateTransaction.type || 'expense') as TransactionType,
    amount: recurringRule?.templateTransaction.amount || 0,
    name: recurringRule?.templateTransaction.name || '',
    categoryId: recurringRule?.templateTransaction.categoryId || '',
    description: recurringRule?.templateTransaction.description || '',
  });

  // Preview occurrences
  const [preview, setPreview] = useState<string[]>([]);

  // Fetch accounts and categories
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Auto-select first account if none selected
  useEffect(() => {
    if (!isEditing && accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0]?.id || '' }));
    }
  }, [accounts, formData.accountId, isEditing]);

  // Preview occurrences when frequency/interval/dates change
  useEffect(() => {
    const fetchPreview = async () => {
      if (!formData.startDate) return;

      try {
        const result = await recurringService.previewOccurrences({
          frequency: formData.frequency,
          interval: formData.interval,
          startDate: formData.startDate,
          endDate: formData.useOccurrences ? null : (formData.endDate || null),
          occurrences: formData.useOccurrences ? (formData.occurrences || 10) : null,
          limit: 5,
        });
        setPreview(result.occurrences);
      } catch {
        // Silently fail preview
        setPreview([]);
      }
    };

    fetchPreview();
  }, [
    formData.frequency,
    formData.interval,
    formData.startDate,
    formData.endDate,
    formData.occurrences,
    formData.useOccurrences,
  ]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRecurringRuleInput) =>
      recurringService.createRecurringRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringRules'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('Recurring rule created successfully!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create recurring rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateRecurringRuleInput) =>
      recurringService.updateRecurringRule(recurringRule!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringRules'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('Recurring rule updated successfully!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update recurring rule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    if (isEditing) {
      updateMutation.mutate(recurringRuleData);
    } else {
      createMutation.mutate(recurringRuleData);
    }
  };

  const mutation = isEditing ? updateMutation : createMutation;

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

  if (accounts.length === 0) {
    return (
      <div className="py-8">
        <div className="bg-warning-subtle border border-warning text-warning px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">No accounts available</p>
          <p>You need to create at least one account before creating recurring transactions.</p>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Template Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Transaction Details</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Transaction Name *</Label>
          <Input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Rent, Salary, Netflix Subscription"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            required
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as TransactionType,
                categoryId: '',
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
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
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value === '' ? 0 : parseFloat(e.target.value),
                })
              }
              className="pl-8"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountId">Account *</Label>
          <select
            id="accountId"
            required
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category...</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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
      </div>

      {/* Recurrence Pattern Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Recurrence Pattern</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <select
              id="frequency"
              required
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Every</Label>
            <Input
              type="number"
              id="interval"
              min="1"
              max="99"
              value={formData.interval}
              onChange={(e) =>
                setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })
              }
            />
            <p className="text-xs text-muted-foreground">
              {formData.interval} {formData.frequency}(s)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            type="date"
            id="startDate"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useOccurrences"
              checked={formData.useOccurrences}
              onChange={(e) =>
                setFormData({ ...formData, useOccurrences: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="useOccurrences" className="font-normal cursor-pointer">
              Limit by number of occurrences
            </Label>
          </div>

          {formData.useOccurrences ? (
            <div className="space-y-2">
              <Label htmlFor="occurrences">Number of Occurrences</Label>
              <Input
                type="number"
                id="occurrences"
                min="1"
                value={formData.occurrences || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occurrences: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="e.g., 12"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for indefinite recurrence
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Preview - Next 5 Occurrences:</h3>
          <div className="bg-muted p-3 rounded-md space-y-1">
            {preview.map((date, index) => (
              <div key={index} className="text-sm">
                {index + 1}. {format(new Date(date), 'PPP')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {mutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">
            Unable to {isEditing ? 'update' : 'create'} recurring rule
          </p>
          <p>{(mutation.error as Error).message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
            ? 'Update Recurring Rule'
            : 'Create Recurring Rule'}
        </Button>
      </div>
    </form>
  );
}
