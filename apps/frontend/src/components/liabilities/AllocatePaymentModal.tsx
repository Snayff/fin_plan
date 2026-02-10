import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import type { Liability, Transaction } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { showSuccess, showError } from '../../lib/toast';

interface AllocatePaymentModalProps {
  liability: Liability;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AllocatePaymentModal({ liability, onSuccess, onCancel }: AllocatePaymentModalProps) {
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [principalAmount, setPrincipalAmount] = useState<number>(0);
  const [interestAmount, setInterestAmount] = useState<number>(0);

  // Fetch unallocated transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['unallocated-transactions', liability.id],
    queryFn: () => liabilityService.getUnallocatedTransactions(liability.id),
  });

  const allocateMutation = useMutation({
    mutationFn: () =>
      liabilityService.allocatePayment(liability.id, {
        transactionId: selectedTransaction!.id,
        liabilityId: liability.id,
        principalAmount,
        interestAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['unallocated-transactions'] });
      showSuccess('Payment allocated successfully!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to allocate payment');
    },
  });

  const transactions = transactionsData?.transactions || [];

  // When a transaction is selected, auto-calculate split
  useEffect(() => {
    if (selectedTransaction) {
      const amount = selectedTransaction.amount;
      // Calculate interest portion based on liability interest rate
      const monthlyRate = liability.interestRate / 12 / 100;
      const estimatedInterest = Math.min(
        parseFloat((liability.currentBalance * monthlyRate).toFixed(2)),
        amount
      );
      const estimatedPrincipal = parseFloat((amount - estimatedInterest).toFixed(2));
      setInterestAmount(estimatedInterest);
      setPrincipalAmount(estimatedPrincipal);
    }
  }, [selectedTransaction, liability.currentBalance, liability.interestRate]);

  const totalAllocation = principalAmount + interestAmount;
  const hasAmountMismatch = selectedTransaction && Math.abs(totalAllocation - selectedTransaction.amount) > 0.01;
  const canSubmit = selectedTransaction && !hasAmountMismatch && totalAllocation > 0;

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    allocateMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-md p-4 mb-2">
        <p className="text-sm text-muted-foreground mb-1">Allocating to</p>
        <p className="font-semibold text-foreground">{liability.name}</p>
        <p className="text-sm text-brand">Balance: {formatCurrency(liability.currentBalance)}</p>
      </div>

      {/* Transaction Selection */}
      <div className="space-y-2">
        <Label>Select Transaction *</Label>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-muted/50 border border-border rounded-md p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No unallocated expense transactions found.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create an expense transaction first, then allocate it here.
            </p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {transactions.map((transaction) => (
              <label
                key={transaction.id}
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTransaction?.id === transaction.id ? 'bg-muted/80' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="transaction"
                    checked={selectedTransaction?.id === transaction.id}
                    onChange={() => setSelectedTransaction(transaction)}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transaction.name || transaction.description || 'Transaction'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-GB')}
                      {transaction.account && ` · ${transaction.account.name}`}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </p>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Payment Split */}
      {selectedTransaction && (
        <>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Payment Split for {formatCurrency(selectedTransaction.amount)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  id="principalAmount"
                  step="0.01"
                  min="0"
                  value={principalAmount}
                  onChange={(e) => {
                    const newPrincipal = Number(e.target.value);
                    setPrincipalAmount(newPrincipal);
                    setInterestAmount(parseFloat((selectedTransaction.amount - newPrincipal).toFixed(2)));
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">Reduces your balance</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestAmount">Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  id="interestAmount"
                  step="0.01"
                  min="0"
                  value={interestAmount}
                  onChange={(e) => {
                    const newInterest = Number(e.target.value);
                    setInterestAmount(newInterest);
                    setPrincipalAmount(parseFloat((selectedTransaction.amount - newInterest).toFixed(2)));
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">Cost of borrowing</p>
            </div>
          </div>

          {/* Validation Feedback */}
          {hasAmountMismatch && (
            <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
              Principal ({formatCurrency(principalAmount)}) + Interest ({formatCurrency(interestAmount)}) = {formatCurrency(totalAllocation)} must equal the transaction amount ({formatCurrency(selectedTransaction.amount)})
            </div>
          )}

          {!hasAmountMismatch && principalAmount > 0 && (
            <div className="bg-success-subtle/20 border border-success-subtle rounded-md p-3">
              <p className="text-sm text-success">
                Balance will decrease to {formatCurrency(Math.max(0, liability.currentBalance - principalAmount))}
              </p>
            </div>
          )}
        </>
      )}

      {allocateMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(allocateMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit || allocateMutation.isPending}>
          {allocateMutation.isPending ? 'Allocating...' : 'Allocate Payment'}
        </Button>
      </div>
    </form>
  );
}
