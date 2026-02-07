import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../services/transaction.service';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import { showSuccess, showError } from '../../lib/toast';
import type { Transaction, CreateTransactionInput, TransactionType } from '../../types';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface TransactionEditFormProps {
  transaction: Transaction;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransactionEditForm({ transaction, onSuccess, onCancel }: TransactionEditFormProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    type: transaction.type,
    description: transaction.description,
    amount: transaction.amount.toString(),
    date: format(new Date(transaction.date), 'yyyy-MM-dd'),
    accountId: transaction.accountId,
    categoryId: transaction.categoryId || '',
    memo: transaction.memo ?? '',
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<CreateTransactionInput>) => 
      transactionService.updateTransaction(transaction.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Transaction updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update transaction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      type: formData.type,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      accountId: formData.accountId,
      categoryId: formData.categoryId || undefined,
      memo: formData.memo || undefined,
    });
  };

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];
  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type *</Label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType, categoryId: '' })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Input
          type="text"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Grocery shopping"
        />
      </div>

      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input
          type="number"
          step="0.01"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label>Date *</Label>
        <Input
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Account *</Label>
        <select
          required
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency} {account.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select a category (optional)</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentCategoryId && '  ↳ '}
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Memo</Label>
        <textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          rows={2}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Additional notes (optional)"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Updating...' : 'Update Transaction'}
        </Button>
      </div>
    </form>
  );
}
