import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { showSuccess, showError } from '../lib/toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AccountForm from '../components/accounts/AccountForm';
import AccountEditForm from '../components/accounts/AccountEditForm';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Account } from '../types';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
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

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts yet. Create your first account to get started.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
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
                  <p className="text-sm text-muted-foreground mb-1">Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {account.currency} {account.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
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
            <div>
              <p>Are you sure you want to delete <strong>{deletingAccount.name}</strong>?</p>
              <p className="mt-2 text-sm text-gray-600">
                This action cannot be undone. If the account has transactions, it will be marked as inactive instead.
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
