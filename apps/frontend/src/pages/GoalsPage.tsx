import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../services/goal.service';
import { accountService } from '../services/account.service';
import { showSuccess, showError } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GoalForm from '../components/goals/GoalForm';
import GoalContributionModal from '../components/goals/GoalContributionModal';
import GoalCelebration from '../components/goals/GoalCelebration';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { goalFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import type { Goal, EnhancedGoal } from '../types';
import {
  TrendingUpIcon,
  TargetIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarIcon,
} from 'lucide-react';

function getProgressSourceLabel(goal: EnhancedGoal): string {
  switch (goal.type) {
    case 'savings':
    case 'investment':
    case 'net_worth':
      return 'Auto-tracked from accounts';
    case 'debt_payoff':
    case 'purchase':
      return goal.linkedAccountId
        ? 'Auto-tracked from account'
        : 'Manually tracked';
    case 'income':
      return goal.incomePeriod === 'year' ? 'Auto-tracked (this year)' : 'Auto-tracked (this month)';
    default:
      return 'Manually tracked';
  }
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<EnhancedGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<EnhancedGoal | null>(null);
  const [relinkGoal, setRelinkGoal] = useState<EnhancedGoal | null>(null);
  const [relinkSelectedAccountId, setRelinkSelectedAccountId] = useState('');
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);
  const [celebrationVariant, setCelebrationVariant] = useState<number | null>(null);
  const prevProgressRef = useRef<Record<string, number>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getGoals(),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });
  const accounts = accountsData?.accounts ?? [];

  const relinkMutation = useMutation({
    mutationFn: ({ goalId, linkedAccountId }: { goalId: string; linkedAccountId: string }) =>
      goalService.updateGoal(goalId, { linkedAccountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('Account re-linked successfully');
      setRelinkGoal(null);
      setRelinkSelectedAccountId('');
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to re-link account');
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: (goalId: string) => {
      setCompletingGoalId(goalId);
      return goalService.updateGoal(goalId, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Goal marked as complete!');
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to update goal');
    },
    onSettled: () => setCompletingGoalId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Goal deleted successfully!');
      setDeletingGoal(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete goal');
    },
  });

  const goals = (data?.goals || []) as EnhancedGoal[];

  // Detect when any goal crosses the 100% threshold and trigger a celebration
  useEffect(() => {
    if (!goals.length) return;
    goals.forEach((goal) => {
      const prev = prevProgressRef.current[goal.id] ?? 0;
      if (prev < 100 && goal.progressPercentage >= 100) {
        const variant = Math.floor(Math.random() * 5) + 1;
        setCelebrationVariant(variant);
      }
      prevProgressRef.current[goal.id] = goal.progressPercentage;
    });
  }, [goals]);

  const {
    filteredItems: filteredGoals,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount,
    filteredCount,
  } = useClientFilters({
    items: goals,
    fields: goalFilterConfig.fields,
  });

  // Sort: high priority first, then by creation date
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate summary stats from filtered data
  const totalSaved = filteredGoals.reduce((sum, goal) => sum + Number(goal.calculatedProgress ?? 0), 0);
  const totalTarget = filteredGoals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  const activeGoals = filteredGoals.filter((g) => g.status === 'active').length;
  const needsAttentionGoals = filteredGoals.filter((goal) => {
    if (goal.status !== 'active' || !goal.targetDate) return false;
    return new Date(goal.targetDate).getTime() < Date.now();
  }).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading goals: {(error as Error).message}
        </div>
      </div>
    );
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-primary text-primary-foreground';
      case 'medium':
        return 'bg-warning-subtle text-warning';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'archived':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Goals</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Add Goal</Button>
      </div>

      {/* Only show filter bar if there are goals */}
      {goals.length > 0 && (
        <FilterBar
          config={goalFilterConfig}
          filters={filters}
          onFilterChange={setFilter}
          onClearAll={clearFilters}
          activeFilterCount={activeFilterCount}
          totalCount={totalCount}
          filteredCount={filteredCount}
        />
      )}

      {/* Summary Cards */}
      {filteredGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TargetIcon className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total Saved</p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalSaved)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {formatCurrency(totalTarget)} target
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeGoals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2Icon className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
              <p className="text-2xl font-bold text-success">
                {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Overall completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Needs Attention</p>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">
                {needsAttentionGoals}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Behind schedule</p>
            </CardContent>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No goals yet. Create your first goal to start tracking your progress.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>Create Goal</Button>
          </CardContent>
        </Card>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No goals match your filters.</p>
            <Button variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => (
            <Card
              key={goal.id}
              className={
                goal.progressPercentage >= 100 && goal.status === 'active'
                  ? 'border-2 border-success shadow-md'
                  : goal.priority === 'high'
                  ? 'border-2 border-primary shadow-md'
                  : undefined
              }
            >
              <CardContent className="p-6">
                {/* Header with icon, name, and badges */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{goal.icon || '🎯'}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-tight">
                        {goal.name}
                      </h3>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">
                        {goal.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {goal.progressPercentage >= 100 && goal.status === 'active' ? (
                      <Badge className="bg-success text-success-foreground">Goal reached!</Badge>
                    ) : (
                      <Badge className={getPriorityBadgeColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                    )}
                    <Badge className={getStatusBadgeColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {goal.description}
                  </p>
                )}

                {/* Progress Section */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {Number(goal.progressPercentage).toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress bar with milestones */}
                  <div className="relative w-full bg-muted rounded-full h-3 mb-1">
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(Number(goal.progressPercentage))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${goal.name} progress`}
                      className={`h-3 rounded-full transition-all ${
                        Number(goal.progressPercentage) >= 100
                          ? 'bg-success'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(Number(goal.progressPercentage), 100)}%` }}
                    />
                    {/* Milestone markers */}
                    {[25, 50, 75].map((milestone) => (
                      <div
                        key={milestone}
                        className="absolute top-0 bottom-0 w-0.5 bg-background"
                        style={{ left: `${milestone}%` }}
                        title={`${milestone}% milestone`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {/* Amount display */}
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-primary">
                      {goal.linkedAccountMissing
                        ? '—'
                        : formatCurrency(goal.calculatedProgress ?? 0)
                      }
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress source label */}
                  {goal.linkedAccountMissing ? (
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="text-xs text-warning">
                        ⚠ Linked account not found — progress unavailable
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs shrink-0"
                        onClick={() => setRelinkGoal(goal)}
                      >
                        Re-link account
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getProgressSourceLabel(goal)}
                    </p>
                  )}
                </div>

                {/* Target date and tracking */}
                <div className="border-t border-border pt-3 mb-4 space-y-2">
                  {goal.targetDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        Target Date:
                      </span>
                      <span className="font-medium">
                        {new Date(goal.targetDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {goal.daysRemaining !== null && goal.daysRemaining >= 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Days Remaining:</span>
                      <span className="font-medium">{goal.daysRemaining} days</span>
                    </div>
                  )}

                  {goal.recommendedMonthlyContribution !== null && goal.status === 'active' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Recommended/month:</span>
                      <span className={`font-medium ${!goal.isOnTrack ? 'text-warning' : ''}`}>
                        {formatCurrency(goal.recommendedMonthlyContribution)}
                      </span>
                    </div>
                  )}

                  {/* On track indicator / completion CTA */}
                  {goal.status === 'active' && goal.progressPercentage >= 100 ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => markCompleteMutation.mutate(goal.id)}
                      disabled={completingGoalId === goal.id}
                    >
                      <CheckCircle2Icon className="h-3.5 w-3.5 mr-1.5" />
                      Mark Complete
                    </Button>
                  ) : (
                    goal.status === 'active' && goal.targetDate && (
                      <div className="flex items-center gap-1 text-xs">
                        {goal.isOnTrack ? (
                          <>
                            <CheckCircle2Icon className="h-3 w-3 text-success" />
                            <span className="text-success font-medium">On Track</span>
                          </>
                        ) : (
                          <>
                            <AlertCircleIcon className="h-3 w-3 text-warning" />
                            <span className="text-warning font-medium">Behind Schedule</span>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {goal.type === 'purchase' && !goal.linkedAccountId && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setContributingGoal(goal)}
                      className="flex-1"
                      disabled={goal.status !== 'active'}
                    >
                      Add Contribution
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGoal(goal)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingGoal(goal)}
                    className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Goal"
      >
        <GoalForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingGoal && (
        <Modal isOpen={true} onClose={() => setEditingGoal(null)} title="Edit Goal">
          <GoalForm
            goal={editingGoal}
            onSuccess={() => setEditingGoal(null)}
            onCancel={() => setEditingGoal(null)}
          />
        </Modal>
      )}

      {/* Contribution Modal */}
      {contributingGoal && (
        <Modal
          isOpen={true}
          onClose={() => setContributingGoal(null)}
          title="Add Contribution"
        >
          <GoalContributionModal
            goal={contributingGoal}
            onSuccess={() => setContributingGoal(null)}
            onCancel={() => setContributingGoal(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingGoal && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingGoal(null)}
          onConfirm={() => deleteMutation.mutate(deletingGoal.id)}
          title="Delete Goal"
          message={
            <>
              Are you sure you want to delete <strong>{deletingGoal.name}</strong>?
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                This action cannot be undone. All contribution history for this goal will also
                be deleted.
              </span>
            </>
          }
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Re-link Account Modal */}
      {relinkGoal && (
        <Modal
          isOpen={true}
          onClose={() => { setRelinkGoal(null); setRelinkSelectedAccountId(''); }}
          title="Re-link Account"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a replacement account for <strong>{relinkGoal.name}</strong>.
            </p>
            <div className="space-y-2">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={relinkSelectedAccountId}
                onChange={(e) => setRelinkSelectedAccountId(e.target.value)}
              >
                <option value="">Select account...</option>
                {(relinkGoal.type === 'debt_payoff'
                  ? accounts.filter(a => ['credit', 'loan', 'liability'].includes(a.type))
                  : accounts
                ).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => { setRelinkGoal(null); setRelinkSelectedAccountId(''); }}
              >
                Cancel
              </Button>
              <Button
                disabled={!relinkSelectedAccountId || relinkMutation.isPending}
                onClick={() => relinkMutation.mutate({ goalId: relinkGoal.id, linkedAccountId: relinkSelectedAccountId })}
              >
                {relinkMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Celebration Animation */}
      {celebrationVariant !== null && (
        <GoalCelebration
          variant={celebrationVariant}
          onComplete={() => setCelebrationVariant(null)}
        />
      )}
    </div>
  );
}
