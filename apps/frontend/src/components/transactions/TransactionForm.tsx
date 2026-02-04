import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../services/transaction.service';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import type { TransactionType, CreateTransactionInput } from '../../types';
import { format } from 'date-fns';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTransactionInput>({
    accountId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    type: 'expense',
    categoryId: '',
    description: '',
  });

  // Fetch accounts and categories
  const { data: accountsData, isLoading: isLoadingAccounts, error: accountsError } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSuccess?.();
    },
  });

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Auto-select first account if none selected
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0]?.id || '' }));
    }
  }, [accounts, formData.accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Show loading state while fetching data
  if (isLoadingAccounts || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading form data...</p>
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (accountsError || categoriesError) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          <p className="font-medium mb-1">Failed to load form data</p>
          {accountsError && <p>Accounts: {(accountsError as Error).message}</p>}
          {categoriesError && <p>Categories: {(categoriesError as Error).message}</p>}
        </div>
        {onCancel && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show warning if no accounts exist
  if (accounts.length === 0) {
    return (
      <div className="py-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
          <p className="font-medium mb-1">No accounts available</p>
          <p>You need to create at least one account before adding transactions.</p>
        </div>
        {onCancel && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Transaction Type *
        </label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType, categoryId: '' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <input
          type="text"
          id="description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Monthly Salary, Grocery Shopping"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount *
        </label>
        <input
          type="number"
          id="amount"
          required
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          type="date"
          id="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
          Account *
        </label>
        <select
          id="accountId"
          required
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select account...</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency} {Number(account.balance || 0).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          id="categoryId"
          required
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select category...</option>
          {filteredCategories.map((category) => (
            <React.Fragment key={category.id}>
              <option value={category.id}>{category.name}</option>
              {category.subcategories?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  &nbsp;&nbsp;└─ {sub.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
          Memo (optional)
        </label>
        <textarea
          id="memo"
          value={formData.memo || ''}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Additional notes..."
        />
      </div>

      {createMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {(createMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
        </button>
      </div>
    </form>
  );
}
