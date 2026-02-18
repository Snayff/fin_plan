import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../services/goal.service';
import { showSuccess, showError } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GoalForm from '../components/goals/GoalForm';
import GoalContributionModal from '../components/goals/GoalContributionModal';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { goalFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Goal, EnhancedGoal } from '../types';
import {
  TrendingUpIcon,
  TargetIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarIcon,
} from 'lucide-react';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<EnhancedGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<EnhancedGoal | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getGoals(),
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
  const totalSaved = filteredGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = filteredGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const activeGoals = filteredGoals.filter((g) => g.status === 'active').length;
  const onTrackGoals = filteredGoals.filter((g) => g.isOnTrack && g.status === 'active').length;
  const needsAttentionGoals = filteredGoals.filter((goal) => {
    if (goal.status !== 'active' || !goal.targetDate) return false;
    return new Date(goal.targetDate).getTime() < Date.now();
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading goals...</div>
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
        return 'bg-destructive text-destructive-foreground';
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
              <p className="text-xs text-muted-foreground mt-1">
                {onTrackGoals} on track
              </p>
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
                goal.priority === 'high'
                  ? 'border-2 border-destructive shadow-md'
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
                    <Badge className={getPriorityBadgeColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
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
                      {goal.progressPercentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress bar with milestones */}
                  <div className="relative w-full bg-muted rounded-full h-3 mb-1">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        goal.progressPercentage >= 100
                          ? 'bg-success'
                          : goal.isOnTrack
                          ? 'bg-primary'
                          : 'bg-warning'
                      }`}
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                    {/* Milestone markers */}
                    {[25, 50, 75].map((milestone) => (
                      <div
                        key={milestone}
                        className="absolute top-0 bottom-0 w-0.5 bg-background"
                        style={{ left: `${milestone}%` }}
                        title={`${milestone}% milestone`}
                      />
                    ))}
                  </div>

                  {/* Amount display */}
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-primary">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
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

                  {/* On track indicator */}
                  {goal.status === 'active' && goal.targetDate && (
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
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setContributingGoal(goal)}
                    className="flex-1"
                    disabled={goal.status !== 'active'}
                  >
                    Add Contribution
                  </Button>
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
    </div>
  );
}
