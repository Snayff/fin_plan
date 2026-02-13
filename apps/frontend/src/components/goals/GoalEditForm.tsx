import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../services/goal.service';
import { accountService } from '../../services/account.service';
import type { Goal, GoalType, Priority, GoalStatus, UpdateGoalInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface GoalEditFormProps {
  goal: Goal;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Predefined icons for goal types
const GOAL_ICONS = {
  savings: '💰',
  debt_payoff: '💳',
  net_worth: '📈',
  purchase: '🛍️',
  investment: '📊',
  income: '💵',
};

export default function GoalEditForm({ goal, onSuccess, onCancel }: GoalEditFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: goal.name,
    description: goal.description || '',
    type: goal.type as GoalType,
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
    priority: goal.priority as Priority,
    status: goal.status as GoalStatus,
    icon: goal.icon || '🎯',
    linkedAccountId: goal.linkedAccountId || '',
  });

  // Fetch accounts for the dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateGoalInput) => goalService.updateGoal(goal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: UpdateGoalInput = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      targetAmount: Number(formData.targetAmount),
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
      status: formData.status,
      icon: formData.icon,
      linkedAccountId: formData.linkedAccountId || undefined,
    };
    updateMutation.mutate(submitData);
  };

  const accounts = accountsData?.accounts || [];

  // Update icon when type changes
  const handleTypeChange = (newType: GoalType) => {
    setFormData({
      ...formData,
      type: newType,
      icon: GOAL_ICONS[newType] || formData.icon,
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

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="icon">Icon</Label>
          <div className="flex items-center gap-2">
            <div className="text-3xl">{formData.icon}</div>
            <select
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.entries(GOAL_ICONS).map(([type, icon]) => (
                <option key={type} value={icon}>
                  {icon} {type.replace('_', ' ')}
                </option>
              ))}
              <option value="🎯">🎯 Target</option>
              <option value="🏠">🏠 Home</option>
              <option value="🚗">🚗 Vehicle</option>
              <option value="✈️">✈️ Travel</option>
              <option value="🎓">🎓 Education</option>
            </select>
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
            onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Current progress: £{goal.currentAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Target Date (Optional)</Label>
        <Input
          type="date"
          id="targetDate"
          value={formData.targetDate}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        </div>

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedAccountId">Linked Account (Optional)</Label>
        <select
          id="linkedAccountId"
          value={formData.linkedAccountId}
          onChange={(e) => setFormData({ ...formData, linkedAccountId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">None</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {updateMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(updateMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Updating...' : 'Update Goal'}
        </Button>
      </div>
    </form>
  );
}
