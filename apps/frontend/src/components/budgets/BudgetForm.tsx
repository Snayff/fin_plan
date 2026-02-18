import { useEffect, useMemo, useState } from 'react';
import { addMonths, format, subDays } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../../services/budget.service';
import { showError, showSuccess } from '../../lib/toast';
import type { BudgetPeriod, CreateBudgetInput, UpdateBudgetInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EditableBudget {
  id: string;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

interface BudgetFormProps {
  budget?: EditableBudget;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface BudgetFormState {
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

interface BudgetFormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

function toDateInputValue(value?: string): string {
  if (!value) return '';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return format(date, 'yyyy-MM-dd');
}

function getInitialFormData(budget?: EditableBudget): BudgetFormState {
  return {
    name: budget?.name ?? '',
    period: budget?.period ?? 'monthly',
    startDate: toDateInputValue(budget?.startDate),
    endDate: toDateInputValue(budget?.endDate),
  };
}

function calculateEndDate(startDate: string, period: BudgetPeriod): string {
  if (!startDate || period === 'custom') {
    return '';
  }

  const parsedStart = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsedStart.getTime())) {
    return '';
  }

  const monthsToAdd =
    period === 'monthly' ? 1 : period === 'quarterly' ? 3 : period === 'annual' ? 12 : 0;

  if (!monthsToAdd) {
    return '';
  }

  return format(subDays(addMonths(parsedStart, monthsToAdd), 1), 'yyyy-MM-dd');
}

export default function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(budget);
  const [formData, setFormData] = useState<BudgetFormState>(() => getInitialFormData(budget));
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  useEffect(() => {
    setFormData(getInitialFormData(budget));
    setErrors({});
  }, [budget]);

  const submitMutation = useMutation({
    mutationFn: (data: CreateBudgetInput | UpdateBudgetInput) => {
      if (isEditMode && budget) {
        return budgetService.updateBudget(budget.id, data as UpdateBudgetInput);
      }

      return budgetService.createBudget(data as CreateBudgetInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (budget?.id) {
        queryClient.invalidateQueries({ queryKey: ['budget', budget.id] });
      }

      showSuccess(isEditMode ? 'Budget updated successfully!' : 'Budget created successfully!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || (isEditMode ? 'Failed to update budget' : 'Failed to create budget'));
    },
  });

  const periodOptions = useMemo(
    () => [
      { value: 'monthly' as const, label: 'Monthly' },
      { value: 'quarterly' as const, label: 'Quarterly' },
      { value: 'annual' as const, label: 'Annual' },
      { value: 'custom' as const, label: 'Custom' },
    ],
    []
  );

  const handlePeriodChange = (period: BudgetPeriod) => {
    setFormData((prev) => ({
      ...prev,
      period,
      endDate: period === 'custom' ? prev.endDate : calculateEndDate(prev.startDate, period),
    }));

    setErrors((prev) => ({ ...prev, endDate: undefined }));
  };

  const handleStartDateChange = (startDate: string) => {
    setFormData((prev) => ({
      ...prev,
      startDate,
      endDate: prev.period === 'custom' ? prev.endDate : calculateEndDate(startDate, prev.period),
    }));

    setErrors((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
  };

  const validateForm = (): boolean => {
    const nextErrors: BudgetFormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Budget name is required';
    }

    if (!formData.startDate) {
      nextErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      nextErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(`${formData.startDate}T00:00:00`);
      const end = new Date(`${formData.endDate}T00:00:00`);

      if (Number.isNaN(start.getTime())) {
        nextErrors.startDate = 'Please enter a valid start date';
      }

      if (Number.isNaN(end.getTime())) {
        nextErrors.endDate = 'Please enter a valid end date';
      }

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        nextErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    if (isEditMode) {
      submitMutation.mutate(payload as UpdateBudgetInput);
      return;
    }

    submitMutation.mutate(payload as CreateBudgetInput);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Budget Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }));
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g., January 2026 Budget"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Period *</Label>
        <select
          id="period"
          value={formData.period}
          onChange={(e) => handlePeriodChange(e.target.value as BudgetPeriod)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date *</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
        />
        {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date *</Label>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, endDate: e.target.value }));
            setErrors((prev) => ({ ...prev, endDate: undefined }));
          }}
          disabled={formData.period !== 'custom'}
        />
        {formData.period !== 'custom' && (
          <p className="text-xs text-muted-foreground">
            End date is auto-calculated for {formData.period} budgets.
          </p>
        )}
        {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
      </div>

      {submitMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(submitMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitMutation.isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Budget'
              : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}
