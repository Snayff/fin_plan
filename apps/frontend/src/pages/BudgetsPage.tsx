import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../services/budget.service';
import { showError, showSuccess } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import type { BudgetPeriod, BudgetSummary, EnhancedBudget } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import BudgetForm from '../components/budgets/BudgetForm';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom',
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Invalid date range';
  }

  return `${start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} - ${end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<BudgetSummary | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetService.getBudgets(),
  });

  const budgets = data?.budgets || [];

  const budgetIds = useMemo(() => budgets.map((budget) => budget.id), [budgets]);

  const { data: budgetDetails = {}, isFetching: isFetchingDetails } = useQuery({
    queryKey: ['budgets', 'details', budgetIds],
    queryFn: async () => {
      const entries = await Promise.all(
        budgetIds.map(async (id) => {
          const response = await budgetService.getBudgetById(id);
          return [id, response.budget] as const;
        })
      );

      return Object.fromEntries(entries) as Record<string, EnhancedBudget>;
    },
    enabled: budgetIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget deleted successfully!');
      setDeletingBudget(null);
    },
    onError: (mutationError: Error) => {
      showError(mutationError.message || 'Failed to delete budget');
    },
  });

  const activeBudget = budgets.find((budget) => budget.isActive) || null;
  const activeBudgetDetail = activeBudget ? budgetDetails[activeBudget.id] : undefined;

  const totalAllocated = activeBudgetDetail?.totalAllocated ?? activeBudget?.totalAllocated ?? 0;
  const totalSpent = activeBudgetDetail?.totalSpent ?? 0;
  const remaining = activeBudgetDetail?.totalRemaining ?? totalAllocated - totalSpent;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading budgets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading budgets: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Create New Budget</Button>
      </div>

      {activeBudget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalAllocated)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No budgets yet. Create your first budget to start tracking spending.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>Create Your First Budget</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {isFetchingDetails && (
            <p className="text-sm text-muted-foreground mb-4">Refreshing budget tracking data...</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const detail = budgetDetails[budget.id];
              const spent = detail?.totalSpent ?? 0;
              const allocated = detail?.totalAllocated ?? budget.totalAllocated;
              const progress = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;

              return (
                <Card key={budget.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <Link to={`/budget/${budget.id}`} className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate hover:underline">
                          {budget.name}
                        </h3>
                      </Link>
                      <Badge variant="outline">{PERIOD_LABELS[budget.period]}</Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">{formatDateRange(budget.startDate, budget.endDate)}</p>
                      <Badge
                        variant={budget.isActive ? 'default' : 'secondary'}
                        className={budget.isActive ? 'bg-success-subtle text-success' : ''}
                      >
                        {budget.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Allocated vs Spent</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(allocated)} / {formatCurrency(spent)}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% used</p>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/budget/${budget.id}`}>Open</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                        onClick={() => setDeletingBudget(budget)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Budget">
        <BudgetForm onSuccess={() => setIsCreateModalOpen(false)} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {deletingBudget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingBudget(null)}
          onConfirm={() => deleteMutation.mutate(deletingBudget.id)}
          title="Delete Budget"
          message={
            <>
              Are you sure you want to delete <strong>{deletingBudget.name}</strong>?
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                This action cannot be undone. All budget items in this budget will also be deleted.
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
