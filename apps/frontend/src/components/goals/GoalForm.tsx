import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../services/goal.service';
import type {
  Goal,
  GoalType,
  Priority,
  GoalStatus,
  CreateGoalInput,
  UpdateGoalInput,
} from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface GoalFormProps {
  goal?: Goal;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GOAL_TYPE_ICONS: Record<GoalType, string> = {
  savings: '💰',
  debt_payoff: '💳',
  net_worth: '📈',
  purchase: '🛍️',
  investment: '📊',
  income: '💵',
};

const GOAL_ICON_OPTIONS = Array.from(
  new Set([...Object.values(GOAL_TYPE_ICONS), '🎯', '🏠', '🚗', '✈️', '🎓', '🧳', '🔧', '📚'])
);

interface GoalFormState {
  name: string;
  description: string;
  type: GoalType;
  targetAmount: string | number;
  targetDate: string;
  priority: Priority;
  status: GoalStatus;
  icon: string;
}

function getInitialFormData(goal?: Goal): GoalFormState {
  return {
    name: goal?.name ?? '',
    description: goal?.description ?? '',
    type: (goal?.type as GoalType) ?? 'savings',
    targetAmount: goal?.targetAmount ?? '',
    targetDate: goal?.targetDate ? (goal.targetDate.split('T')[0] ?? '') : '',
    priority: (goal?.priority as Priority) ?? 'medium',
    status: (goal?.status as GoalStatus) ?? 'active',
    icon: goal?.icon ?? GOAL_TYPE_ICONS[goal?.type as GoalType] ?? '🎯',
  };
}

export default function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(goal);
  const [formData, setFormData] = useState<GoalFormState>(() => getInitialFormData(goal));

  useEffect(() => {
    setFormData(getInitialFormData(goal));
  }, [goal]);

  const submitMutation = useMutation({
    mutationFn: (data: CreateGoalInput | UpdateGoalInput) => {
      if (isEditMode && goal) {
        return goalService.updateGoal(goal.id, data as UpdateGoalInput);
      }

      return goalService.createGoal(data as CreateGoalInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      const submitData: UpdateGoalInput = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        targetAmount: Number(formData.targetAmount),
        targetDate: formData.targetDate || undefined,
        priority: formData.priority,
        status: formData.status,
        icon: formData.icon,
      };
      submitMutation.mutate(submitData);
      return;
    }

    const submitData: CreateGoalInput = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      targetAmount: Number(formData.targetAmount),
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
      icon: formData.icon,
    };

    submitMutation.mutate(submitData);
  };

  const handleTypeChange = (newType: GoalType) => {
    setFormData({
      ...formData,
      type: newType,
      icon: GOAL_TYPE_ICONS[newType] || '🎯',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Goal Name *</Label>
        <Input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Emergency Fund, New Car, Retirement"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add notes about this goal..."
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Goal Type *</Label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value as GoalType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="savings">Savings</option>
          <option value="debt_payoff">Debt Payoff</option>
          <option value="net_worth">Net Worth</option>
          <option value="purchase">Purchase</option>
          <option value="investment">Investment</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-3">
          <div className="text-3xl leading-none" aria-hidden="true">
            {formData.icon}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {GOAL_ICON_OPTIONS.map((icon) => {
              const isSelected = formData.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Select ${icon} icon`}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`h-9 w-9 rounded-md border text-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
                  }`}
                >
                  <span aria-hidden="true">{icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAmount">Target Amount *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="targetAmount"
            step="0.01"
            required
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
        {goal && (
          <p className="text-xs text-muted-foreground">
            Current progress: £{goal.currentAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Target Date (Optional)</Label>
        <Input
          type="date"
          id="targetDate"
          value={formData.targetDate}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        />
        {!isEditMode && (
          <p className="text-xs text-muted-foreground">When do you want to achieve this goal?</p>
        )}
      </div>

      <div className={`grid gap-4 ${isEditMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <select
            id="priority"
            required
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          {!isEditMode && (
            <p className="text-xs text-muted-foreground">High priority goals appear first</p>
          )}
        </div>

        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </div>

      {submitMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(submitMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Goal'
              : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}