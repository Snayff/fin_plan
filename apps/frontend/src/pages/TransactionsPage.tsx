import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transaction.service';
import { showSuccess, showError } from '../lib/toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionFilters from '../components/transactions/TransactionFilters';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Transaction, TransactionFilters as Filters } from '../types';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionService.getTransactions(filters),
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
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading transactions: {(error as Error).message}
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

      <TransactionFilters onFilterChange={setFilters} currentFilters={filters} />

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {Object.keys(filters).length > 0 
                ? 'No transactions match your filters.'
                : 'No transactions yet. Create your first transaction to get started.'}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Transaction
            </Button>
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
                    Description
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
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
                        {transaction.type === 'income' ? '+' : '-'}$
                        {transaction.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
                {deletingTransaction.description} - $
                {deletingTransaction.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
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
