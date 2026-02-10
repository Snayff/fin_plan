import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import { accountService } from '../../services/account.service';
import type { Liability, LiabilityType, InterestType, PaymentFrequency, UpdateLiabilityInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LiabilityEditFormProps {
  liability: Liability;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LiabilityEditForm({ liability, onSuccess, onCancel }: LiabilityEditFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: liability.name,
    type: liability.type as LiabilityType,
    currentBalance: liability.currentBalance,
    originalAmount: liability.originalAmount,
    interestRate: liability.interestRate,
    interestType: liability.interestType as InterestType,
    minimumPayment: liability.minimumPayment,
    paymentFrequency: liability.paymentFrequency as PaymentFrequency,
    payoffDate: liability.payoffDate ? liability.payoffDate.substring(0, 10) : '',
    accountId: liability.accountId ?? '',
    lender: (liability.metadata as any)?.lender || '',
  });

  // Fetch accounts for the dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLiabilityInput) => liabilityService.updateLiability(liability.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: UpdateLiabilityInput = {
      name: formData.name,
      type: formData.type,
      currentBalance: Number(formData.currentBalance),
      originalAmount: Number(formData.originalAmount),
      interestRate: Number(formData.interestRate),
      interestType: formData.interestType,
      minimumPayment: Number(formData.minimumPayment),
      paymentFrequency: formData.paymentFrequency,
      payoffDate: formData.payoffDate || undefined,
      ...(formData.accountId === '' ? {} : { accountId: formData.accountId }),
      metadata: formData.lender ? { lender: formData.lender } : undefined,
    };
    updateMutation.mutate(submitData);
  };

  const accounts = accountsData?.accounts || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Liability Name *</Label>
        <Input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Mortgage, Car Loan, Credit Card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as LiabilityType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="mortgage">Mortgage</option>
          <option value="auto_loan">Auto Loan</option>
          <option value="student_loan">Student Loan</option>
          <option value="credit_card">Credit Card</option>
          <option value="personal_loan">Personal Loan</option>
          <option value="line_of_credit">Line of Credit</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="originalAmount">Original Amount *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="originalAmount"
            step="0.01"
            required
            value={formData.originalAmount}
            onChange={(e) => setFormData({ ...formData, originalAmount: Number(e.target.value) })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentBalance">Current Balance *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="currentBalance"
            step="0.01"
            required
            value={formData.currentBalance}
            onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%) *</Label>
          <Input
            type="number"
            id="interestRate"
            step="0.01"
            required
            value={formData.interestRate}
            onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestType">Interest Type *</Label>
          <select
            id="interestType"
            required
            value={formData.interestType}
            onChange={(e) => setFormData({ ...formData, interestType: e.target.value as InterestType })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimumPayment">Minimum Payment *</Label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-muted-foreground">£</span>
            <Input
              type="number"
              id="minimumPayment"
              step="0.01"
              required
              value={formData.minimumPayment}
              onChange={(e) => setFormData({ ...formData, minimumPayment: Number(e.target.value) })}
              className="pl-8"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
          <select
            id="paymentFrequency"
            required
            value={formData.paymentFrequency}
            onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value as PaymentFrequency })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payoffDate">Target Payoff Date (Optional)</Label>
        <Input
          type="date"
          id="payoffDate"
          value={formData.payoffDate}
          onChange={(e) => setFormData({ ...formData, payoffDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lender">Lender (Optional)</Label>
        <Input
          type="text"
          id="lender"
          value={formData.lender}
          onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
          placeholder="e.g., Bank of England, Nationwide"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Linked Account (Optional)</Label>
        <select
          id="accountId"
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">None</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {updateMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(updateMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Updating...' : 'Update Liability'}
        </Button>
      </div>
    </form>
  );
}
