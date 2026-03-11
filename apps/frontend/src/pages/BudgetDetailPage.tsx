import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../services/budget.service';
import { categoryService } from '../services/category.service';
import { showError, showSuccess } from '../lib/toast';
import { convertToPeriodTotal, formatCurrency, FREQUENCY_LABELS } from '../lib/utils';
import type { AddBudgetItemInput, BudgetItem, BudgetPeriod, Category, CategoryBudgetGroup, RecurringFrequency } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import BudgetForm from '../components/budgets/BudgetForm';
import ImportRecurringDialog from '../components/budgets/ImportRecurringDialog';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

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

export default function BudgetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const budgetId = id ?? '';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Discretionary quick-add state
  const [discretionaryCategoryId, setDiscretionaryCategoryId] = useState('');
  const [discretionaryAmount, setDiscretionaryAmount] = useState('');
  const [discretionaryFrequency, setDiscretionaryFrequency] = useState<RecurringFrequency>('monthly');

  const {
    data: budgetData,
    isLoading: isLoadingBudget,
    error: budgetError,
  } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => budgetService.getBudgetById(budgetId),
    enabled: Boolean(budgetId),
  });

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const budget = budgetData?.budget;

  const addItemMutation = useMutation({
    mutationFn: (payload: AddBudgetItemInput) =>
      budgetService.addBudgetItem(budgetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget item added successfully!');
      setAddingCategoryId(null);
      setAddAmount('');
      setAddNotes('');
      // Reset discretionary quick-add
      setDiscretionaryCategoryId('');
      setDiscretionaryAmount('');
      setDiscretionaryFrequency('monthly');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to add budget item');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (payload: { itemId: string; allocatedAmount: number; notes: string }) =>
      budgetService.updateBudgetItem(budgetId, payload.itemId, {
        allocatedAmount: payload.allocatedAmount,
        notes: payload.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget item updated successfully!');
      setEditingItemId(null);
      setEditingAmount('');
      setEditingNotes('');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update budget item');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => budgetService.deleteBudgetItem(budgetId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget item deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete budget item');
    },
  });

  const removeCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => budgetService.removeCategoryFromBudget(budgetId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Category removed from budget successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to remove category from budget');
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: () => budgetService.deleteBudget(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget deleted successfully!');
      navigate('/budget');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete budget');
    },
  });

  const expenseCategories = useMemo(() => {
    const allCategories = categoriesData?.categories || [];
    return allCategories.filter((category) => category.type === 'expense');
  }, [categoriesData?.categories]);

  const availableCategories = useMemo(() => {
    if (!budget) {
      return [] as Category[];
    }

    const includedCategoryIds = new Set(budget.categoryGroups.map((group) => group.categoryId));
    return expenseCategories.filter((category) => !includedCategoryIds.has(category.id));
  }, [budget, expenseCategories]);

  // Split category groups into committed and discretionary sections
  const committedGroups = useMemo(
    () => (budget?.categoryGroups ?? []).filter((g) => g.groupItemType !== 'discretionary'),
    [budget?.categoryGroups]
  );

  const discretionaryGroups = useMemo(
    () => (budget?.categoryGroups ?? []).filter((g) => g.groupItemType === 'discretionary'),
    [budget?.categoryGroups]
  );

  // Set of recurringRuleIds already in this budget (for ImportRecurringDialog deduplication)
  const existingRecurringRuleIds = useMemo(
    () =>
      new Set(
        (budget?.categoryGroups ?? [])
          .flatMap((g) => g.items)
          .map((item) => item.recurringRuleId)
          .filter((id): id is string => id !== null)
      ),
    [budget?.categoryGroups]
  );

  // Computed live preview of period total for discretionary quick-add
  const discretionaryPreview = useMemo(() => {
    const amount = Number(discretionaryAmount);
    if (!amount || !discretionaryCategoryId) return null;
    return convertToPeriodTotal(amount, discretionaryFrequency, budget?.period ?? 'monthly');
  }, [discretionaryAmount, discretionaryFrequency, discretionaryCategoryId, budget?.period]);

  const startEditingItem = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditingAmount(String(item.allocatedAmount));
    setEditingNotes(item.notes || '');
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingAmount('');
    setEditingNotes('');
  };

  const handleUpdateItem = (itemId: string) => {
    const parsedAmount = Number(editingAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      showError('Allocated amount must be a non-negative number');
      return;
    }

    updateItemMutation.mutate({
      itemId,
      allocatedAmount: parsedAmount,
      notes: editingNotes.trim(),
    });
  };

  const startAddingItem = (categoryId: string) => {
    setAddingCategoryId(categoryId);
    setAddAmount('');
    setAddNotes('');
  };

  const cancelAddingItem = () => {
    setAddingCategoryId(null);
    setAddAmount('');
    setAddNotes('');
  };

  const handleAddItem = (categoryId: string) => {
    const parsedAmount = Number(addAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      showError('Allocated amount must be a non-negative number');
      return;
    }

    addItemMutation.mutate({
      categoryId,
      allocatedAmount: parsedAmount,
      itemType: 'committed',
      notes: addNotes.trim() || undefined,
    });
  };

  const handleAddDiscretionaryItem = () => {
    if (!discretionaryCategoryId) {
      showError('Please select a category');
      return;
    }
    const amount = Number(discretionaryAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    const periodTotal = convertToPeriodTotal(amount, discretionaryFrequency, budget?.period ?? 'monthly');
    addItemMutation.mutate({
      categoryId: discretionaryCategoryId,
      allocatedAmount: periodTotal,
      itemType: 'discretionary',
      entryFrequency: discretionaryFrequency,
      entryAmount: amount,
    });
  };

  const renderCategoryGroup = (group: CategoryBudgetGroup) => (
    <Card key={group.categoryId}>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: group.categoryColor || '#94a3b8' }}
              />
              <span aria-hidden>{group.categoryIcon || '📁'}</span>
              <h3 className="font-semibold text-foreground truncate">{group.categoryName}</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              {formatCurrency(group.allocated)} allocated / {formatCurrency(group.spent)} spent
            </p>

            <div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    group.isOverBudget ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${group.percentUsed}%` }}
                />
              </div>
              <p
                className={`text-xs mt-1 ${
                  group.isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'
                }`}
              >
                {group.percentUsed.toFixed(1)}% used
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
            onClick={() => removeCategoryMutation.mutate(group.categoryId)}
            disabled={removeCategoryMutation.isPending}
          >
            Remove Category
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          {group.items.map((item) => {
            const isEditing = editingItemId === item.id;

            if (isEditing) {
              return (
                <div key={item.id} className="grid gap-2 md:grid-cols-[1fr_140px_auto]">
                  <Input
                    value={editingNotes}
                    onChange={(event) => setEditingNotes(event.target.value)}
                    placeholder="Description"
                    maxLength={500}
                  />

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingAmount}
                      onChange={(event) => setEditingAmount(event.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateItem(item.id)} disabled={updateItemMutation.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditingItem}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="grid gap-2 md:grid-cols-[1fr_140px_auto] items-center rounded-md border border-border p-3"
              >
                <button
                  type="button"
                  className="text-left hover:text-primary"
                  onClick={() => startEditingItem(item)}
                  title="Click to edit description"
                >
                  {item.notes?.trim() ? item.notes : 'No description'}
                </button>

                <button
                  type="button"
                  className="text-left font-medium hover:text-primary"
                  onClick={() => startEditingItem(item)}
                  title="Click to edit amount"
                >
                  {formatCurrency(item.allocatedAmount)}
                </button>

                <div className="flex gap-2 md:justify-end">
                  <Button variant="outline" size="sm" onClick={() => startEditingItem(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    disabled={deleteItemMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}

          {addingCategoryId === group.categoryId ? (
            <div className="grid gap-2 md:grid-cols-[1fr_140px_auto] rounded-md border border-border p-3">
              <Input
                value={addNotes}
                onChange={(event) => setAddNotes(event.target.value)}
                placeholder="Description"
                maxLength={500}
              />

              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addAmount}
                  onChange={(event) => setAddAmount(event.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddItem(group.categoryId)}
                  disabled={addItemMutation.isPending}
                >
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={cancelAddingItem}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => startAddingItem(group.categoryId)}>
              + Add Item
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!budgetId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-destructive">Budget ID is missing.</p>
            <Button asChild variant="outline">
              <Link to="/budget">Back to Budgets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingBudget || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading budget details...</div>
      </div>
    );
  }

  if (budgetError) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading budget: {(budgetError as Error).message}
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading categories: {(categoriesError as Error).message}
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">Budget not found.</p>
            <Button asChild variant="outline">
              <Link to="/budget">Back to Budgets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground">
            <Link to="/budget">← Back to Budgets</Link>
          </Button>

          <h1 className="text-3xl font-bold text-foreground">{budget.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{PERIOD_LABELS[budget.period]}</Badge>
            <Badge
              variant={budget.isActive ? 'default' : 'secondary'}
              className={budget.isActive ? 'bg-success-subtle text-success' : ''}
            >
              {budget.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDateRange(budget.startDate, budget.endDate)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit Budget
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Expected Income</p>
            <p className="text-xl font-bold text-success">{formatCurrency(budget.expectedIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(budget.totalAllocated)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-xl font-bold text-expense">{formatCurrency(budget.totalSpent)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className={`text-xl font-bold ${budget.totalRemaining >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(budget.totalRemaining)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Unallocated</p>
            <p className={`text-xl font-bold ${budget.unallocated >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(budget.unallocated)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* COMMITTED SPEND SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Committed Spend</h2>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            Import Regular Bills
          </Button>
        </div>

        {committedGroups.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-muted-foreground">No committed spend yet.</p>
              <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                Import from recurring rules
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {committedGroups.map((group) => renderCategoryGroup(group))}
          </div>
        )}
      </section>

      {/* DISCRETIONARY SPEND SECTION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Discretionary Spend</h2>

        {/* Quick-add row */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Add discretionary spend</p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_100px_130px_auto]">
              <select
                value={discretionaryCategoryId}
                onChange={(e) => setDiscretionaryCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select category...</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discretionaryAmount}
                  onChange={(e) => setDiscretionaryAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>

              <select
                value={discretionaryFrequency}
                onChange={(e) => setDiscretionaryFrequency(e.target.value as RecurringFrequency)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {(['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as RecurringFrequency[]).map((freq) => (
                  <option key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</option>
                ))}
              </select>

              <Button
                onClick={handleAddDiscretionaryItem}
                disabled={addItemMutation.isPending || !discretionaryCategoryId || !discretionaryAmount}
              >
                Add
              </Button>
            </div>

            {discretionaryPreview !== null && (
              <p className="text-sm text-muted-foreground">
                → <span className="font-medium text-foreground">{formatCurrency(discretionaryPreview)}</span> per {budget?.period ?? 'month'}
              </p>
            )}
          </CardContent>
        </Card>

        {discretionaryGroups.length > 0 && (
          <div className="space-y-4">
            {discretionaryGroups.map((group) => renderCategoryGroup(group))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Available Categories</h2>

        {availableCategories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              All expense categories are already included in this budget.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableCategories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color || '#94a3b8' }}
                      />
                      <span aria-hidden>{category.icon || '📁'}</span>
                      <p className="font-medium text-foreground truncate">{category.name}</p>
                    </div>

                    {addingCategoryId !== category.id && (
                      <Button variant="outline" size="sm" onClick={() => startAddingItem(category.id)}>
                        Add to Budget
                      </Button>
                    )}
                  </div>

                  {addingCategoryId === category.id && (
                    <div className="grid gap-2 md:grid-cols-[1fr_140px_auto] rounded-md border border-border p-3">
                      <Input
                        value={addNotes}
                        onChange={(event) => setAddNotes(event.target.value)}
                        placeholder="Description"
                        maxLength={500}
                      />

                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={addAmount}
                          onChange={(event) => setAddAmount(event.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAddItem(category.id)} disabled={addItemMutation.isPending}>
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelAddingItem}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Budget">
        <BudgetForm budget={budget} onSuccess={() => setIsEditModalOpen(false)} onCancel={() => setIsEditModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteBudgetMutation.mutate()}
        title="Delete Budget"
        message={
          <>
            Are you sure you want to delete <strong>{budget.name}</strong>?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              This action cannot be undone. All budget items for this budget will be deleted.
            </span>
          </>
        }
        confirmText="Delete"
        variant="danger"
        isLoading={deleteBudgetMutation.isPending}
      />

      {budget && (
        <ImportRecurringDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          budgetId={budgetId}
          budgetPeriod={budget.period}
          existingRecurringRuleIds={existingRecurringRuleIds}
        />
      )}
    </div>
  );
}
