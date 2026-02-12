import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { showSuccess, showError } from '../lib/toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AccountForm from '../components/accounts/AccountForm';
import AccountEditForm from '../components/accounts/AccountEditForm';
import MiniAccountChart from '../components/charts/MiniAccountChart';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { accountFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Account } from '../types';
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, LayoutListIcon, TrendingUpIcon } from 'lucide-react';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts', 'enhanced'],
    queryFn: () => accountService.getEnhancedAccounts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Account deleted successfully!');
      setDeletingAccount(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete account');
    },
  });

  const accounts = data?.accounts || [];

  const {
    filteredItems: filteredAccounts,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount,
    filteredCount,
  } = useClientFilters({
    items: accounts,
    fields: accountFilterConfig.fields,
  });

  const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.balance, 0);
  const activeCount = filteredAccounts.filter(a => a.isActive).length;
  const netMonthlyFlow = filteredAccounts.reduce(
    (sum, a) => sum + (a.monthlyFlow.income - a.monthlyFlow.expense), 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading accounts: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Add Account
        </Button>
      </div>

      <FilterBar
        config={accountFilterConfig}
        filters={filters}
        onFilterChange={setFilter}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* Summary Cards */}
      {filteredAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Total Balance</p>
              </div>
              <p className="text-2xl font-bold text-success">
                £{totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <LayoutListIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Accounts</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {activeCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Net Monthly Flow</p>
              </div>
              <p className={`text-2xl font-bold ${netMonthlyFlow >= 0 ? 'text-success' : 'text-expense'}`}>
                £{netMonthlyFlow.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts yet. Create your first account to get started.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts match your filters.</p>
            <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{account.name}</h3>
                    <p className="text-sm text-text-secondary capitalize">{account.type}</p>
                  </div>
                  <Badge variant={account.isActive ? "default" : "secondary"} className={account.isActive ? "bg-success-subtle text-success" : ""}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {account.currency} {account.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* Mini Chart */}
                <div className="mb-4 border border-border rounded-md overflow-hidden">
                  <MiniAccountChart data={account.balanceHistory} />
                </div>

                {/* Monthly Flow */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-success-subtle/20 border border-success-subtle rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowUpIcon className="h-3 w-3 text-success" />
                      <p className="text-xs text-muted-foreground">Incoming</p>
                    </div>
                    <p className="text-sm font-semibold text-success">
                      {account.currency} {account.monthlyFlow.income.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="bg-chart-2-subtle/20 border border-chart-2-subtle rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowDownIcon className="h-3 w-3 text-chart-2" />
                      <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>
                    <p className="text-sm font-semibold text-chart-2">
                      {account.currency} {account.monthlyFlow.expense.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAccount(account)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingAccount(account)}
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive-subtle"
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
        title="Create Account"
      >
        <AccountForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingAccount && (
        <Modal
          isOpen={true}
          onClose={() => setEditingAccount(null)}
          title="Edit Account"
        >
          <AccountEditForm
            account={editingAccount}
            onSuccess={() => setEditingAccount(null)}
            onCancel={() => setEditingAccount(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingAccount && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingAccount(null)}
          onConfirm={() => deleteMutation.mutate(deletingAccount.id)}
          title="Delete Account"
          message={
            <>
              Are you sure you want to delete <strong>{deletingAccount.name}</strong>?
              <br /><br />
              <span className="text-sm text-muted-foreground">
                This action cannot be undone. If the account has transactions, it will be marked as inactive instead.
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
