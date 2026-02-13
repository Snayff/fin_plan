import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../../services/goal.service';
import type { EnhancedGoal, CreateGoalContributionInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface GoalContributionModalProps {
  goal: EnhancedGoal;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function GoalContributionModal({
  goal,
  onSuccess,
  onCancel,
}: GoalContributionModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: '' as string | number,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const addContributionMutation = useMutation({
    mutationFn: (data: CreateGoalContributionInput) =>
      goalService.addContribution(goal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateGoalContributionInput = {
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes || undefined,
    };
    addContributionMutation.mutate(submitData);
  };

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-md p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current Progress:</span>
          <span className="font-semibold">
            £{goal.currentAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target Amount:</span>
          <span className="font-semibold">
            £{goal.targetAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining:</span>
          <span className="font-semibold text-primary">
            £{remaining.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-3">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-center text-muted-foreground">
          {goal.progressPercentage.toFixed(1)}% Complete
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Contribution Amount *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="amount"
            step="0.01"
            required
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Quick fill: Remaining amount is £{remaining.toFixed(2)}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFormData({ ...formData, amount: remaining })}
        >
          Fill Remaining Amount
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Contribution Date *</Label>
        <Input
          type="date"
          id="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes about this contribution..."
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {addContributionMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(addContributionMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={addContributionMutation.isPending}>
          {addContributionMutation.isPending ? 'Adding...' : 'Add Contribution'}
        </Button>
      </div>
    </form>
  );
}
