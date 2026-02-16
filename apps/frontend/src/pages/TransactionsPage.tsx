import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transaction.service';
import { accountService } from '../services/account.service';
import { categoryService } from '../services/category.service';
import { showSuccess, showError } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionForm from '../components/transactions/TransactionForm';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { buildTransactionFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Transaction } from '../types';
import { format } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, RepeatIcon } from 'lucide-react';

function toAmountNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getAllTransactions(1000),
    retry: (failureCount, error) => {
      const statusCode = (error as { statusCode?: number } | undefined)?.statusCode;

      // Do not retry client-side validation/auth issues.
      if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
        return false;
      }

      // Retry transient errors (network/5xx) up to 2 times.
      return failureCount < 2;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Transaction deleted successfully!');
      setDeletingTransaction(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete transaction');
    },
  });

  const transactions = data?.transactions || [];
  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];

  // Defensive normalization: backend should send numbers, but coerce here too
  // so summary cards never concatenate strings.
  const normalizedTransactions = useMemo(
    () => transactions.map((t) => ({ ...t, amount: toAmountNumber(t.amount) })),
    [transactions]
  );

  const filterConfig = useMemo(
    () => buildTransactionFilterConfig(accounts, categories),
    [accounts, categories]
  );

  const {
    filteredItems: filteredTransactions,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount,
    filteredCount,
  } = useClientFilters({
    items: normalizedTransactions,
    fields: filterConfig.fields,
  });

  // Summary stats from filtered data
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + toAmountNumber(t.amount), 0);
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + toAmountNumber(t.amount), 0);
  const netCashFlow = totalIncome - totalExpenses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md space-y-3">
          <p className="font-medium">Unable to load transactions right now.</p>
          <p className="text-sm">{(error as Error).message}</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Add Transaction
        </Button>
      </div>

      {/* Only show filter bar if there are transactions */}
      {transactions.length > 0 && (
        <FilterBar
          config={filterConfig}
          filters={filters}
          onFilterChange={setFilter}
          onClearAll={clearFilters}
          activeFilterCount={activeFilterCount}
          totalCount={totalCount}
          filteredCount={filteredCount}
        />
      )}

      {/* Summary Cards */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpIcon className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownIcon className="h-4 w-4 text-expense" />
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
              <p className="text-2xl font-bold text-expense">
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
              </div>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-expense'}`}>
                {formatCurrency(netCashFlow)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No transactions yet. Create your first transaction to get started.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Transaction
            </Button>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No transactions match your filters.</p>
            <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{transaction.name || transaction.description || 'Unnamed transaction'}</span>
                          {transaction.isGenerated && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              title="Generated from recurring rule"
                            >
                              <RepeatIcon className="h-3 w-3 mr-1 inline" />
                              Recurring
                            </Badge>
                          )}
                          {transaction.isGenerated && transaction.overriddenFields && transaction.overriddenFields.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                              title={`Edited fields: ${transaction.overriddenFields.join(', ')}`}
                            >
                              Edited
                            </Badge>
                          )}
                        </div>
                        {transaction.description && transaction.description !== transaction.name && (
                          <div className="text-xs text-muted-foreground mt-1">{transaction.description}</div>
                        )}
                        {transaction.memo && (
                          <div className="text-xs text-text-tertiary mt-1">{transaction.memo}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.category ? (
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${transaction.category.color}20`,
                            color: transaction.category.color,
                            borderColor: transaction.category.color,
                          }}
                        >
                          {transaction.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No category</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {transaction.account?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={transaction.type === 'income' ? 'text-success' : 'text-expense'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount).replace('£', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(transaction)}
                        className="text-primary hover:text-primary-hover"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTransaction(transaction)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Transaction"
      >
        <TransactionForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingTransaction && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          title="Edit Transaction"
        >
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={() => setEditingTransaction(null)}
            onCancel={() => setEditingTransaction(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingTransaction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={() => deleteMutation.mutate(deletingTransaction.id)}
          title="Delete Transaction"
          message={
            <div>
              <p>
                Are you sure you want to delete this transaction?
              </p>
              <p className="mt-2 text-sm font-medium">
                {deletingTransaction.description} - {formatCurrency(deletingTransaction.amount)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This action cannot be undone and will update your account balance.
              </p>
            </div>
          }
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
