import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringService } from '../../services/recurring.service';
import { categoryService } from '../../services/category.service';
import { budgetService } from '../../services/budget.service';
import { convertToPeriodTotal, formatCurrency, FREQUENCY_LABELS } from '../../lib/utils';
import { showError, showSuccess } from '../../lib/toast';
import type { BudgetPeriod, RecurringFrequency } from '../../types';
import { Button } from '../ui/button';
import Modal from '../ui/Modal';

interface ImportRecurringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  budgetPeriod: BudgetPeriod;
  existingRecurringRuleIds: Set<string>;
}

export default function ImportRecurringDialog({
  isOpen,
  onClose,
  budgetId,
  budgetPeriod,
  existingRecurringRuleIds,
}: ImportRecurringDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());

  const { data: rulesData, isLoading: isLoadingRules } = useQuery({
    queryKey: ['recurring-rules'],
    queryFn: () => recurringService.getRecurringRules(),
    enabled: isOpen,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    enabled: isOpen,
  });

  // Filter to active expense recurring rules that have a categoryId and are not already imported
  const importableRules = (rulesData?.recurringRules ?? []).filter(
    (rule) =>
      rule.isActive &&
      rule.templateTransaction.type === 'expense' &&
      rule.templateTransaction.categoryId &&
      !existingRecurringRuleIds.has(rule.id)
  );

  const categoryMap = new Map(
    (categoriesData?.categories ?? []).map((c) => [c.id, c])
  );

  const importMutation = useMutation({
    mutationFn: () => {
      const selected = importableRules.filter((r) => selectedRuleIds.has(r.id));
      const items = selected.map((rule) => ({
        categoryId: rule.templateTransaction.categoryId!,
        allocatedAmount: convertToPeriodTotal(
          rule.templateTransaction.amount,
          rule.frequency as RecurringFrequency,
          budgetPeriod
        ),
        itemType: 'committed' as const,
        recurringRuleId: rule.id,
        entryFrequency: rule.frequency as RecurringFrequency,
        entryAmount: rule.templateTransaction.amount,
      }));
      return budgetService.addBudgetItemsBatch(budgetId, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      showSuccess('Recurring commitments imported successfully!');
      setSelectedRuleIds(new Set());
      onClose();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to import recurring rules');
    },
  });

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const selectAll = () => setSelectedRuleIds(new Set(importableRules.map((r) => r.id)));
  const selectNone = () => setSelectedRuleIds(new Set());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Recurring Rules">
      {isLoadingRules ? (
        <div className="py-8 text-center text-muted-foreground">Loading recurring rules...</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select recurring expenses to add as committed spend in your budget.
            Amounts are converted to your budget period ({budgetPeriod}).
          </p>

          {importableRules.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground border border-dashed rounded-md">
              All active recurring expense rules are already included in this budget.
            </div>
          ) : (
            <>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={selectAll} className="text-primary hover:underline">Select all</button>
                <span className="text-muted-foreground">·</span>
                <button type="button" onClick={selectNone} className="text-primary hover:underline">Clear</button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importableRules.map((rule) => {
                  const category = rule.templateTransaction.categoryId
                    ? categoryMap.get(rule.templateTransaction.categoryId)
                    : null;
                  const periodTotal = convertToPeriodTotal(
                    rule.templateTransaction.amount,
                    rule.frequency as RecurringFrequency,
                    budgetPeriod
                  );
                  const isSelected = selectedRuleIds.has(rule.id);

                  return (
                    <label
                      key={rule.id}
                      className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRule(rule.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {category && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color || '#94a3b8' }}
                            />
                          )}
                          <span className="font-medium text-sm truncate">{rule.templateTransaction.name}</span>
                        </div>
                        {category && (
                          <p className="text-xs text-muted-foreground">{category.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(rule.templateTransaction.amount)} / {FREQUENCY_LABELS[rule.frequency as RecurringFrequency] ?? rule.frequency}
                          {' '}
                          <span className="text-foreground font-medium">→ {formatCurrency(periodTotal)}</span>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => importMutation.mutate()}
              disabled={selectedRuleIds.size === 0 || importMutation.isPending}
            >
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${selectedRuleIds.size > 0 ? `${selectedRuleIds.size} ` : ''}Selected`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
