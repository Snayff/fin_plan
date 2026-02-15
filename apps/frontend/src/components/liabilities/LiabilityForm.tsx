import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import type { LiabilityType, InterestType, CreateLiabilityInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LiabilityFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LiabilityForm({ onSuccess, onCancel }: LiabilityFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'personal_loan' as LiabilityType,
    currentBalance: '' as string | number,
    interestRate: '' as string | number,
    interestType: 'fixed' as InterestType,
    openDate: '',
    termEndDate: '',
    lender: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLiabilityInput) => liabilityService.createLiability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateLiabilityInput = {
      name: formData.name,
      type: formData.type,
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate),
      interestType: formData.interestType,
      openDate: formData.openDate,
      termEndDate: formData.termEndDate,
      metadata: formData.lender ? { lender: formData.lender } : undefined,
    };
    createMutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Liability Name *</Label>
        <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as LiabilityType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <Label htmlFor="currentBalance">Current Balance *</Label>
        <Input type="number" id="currentBalance" step="0.01" required value={formData.currentBalance} onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%) *</Label>
          <Input type="number" id="interestRate" step="0.01" required value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestType">Interest Type *</Label>
          <select
            id="interestType"
            required
            value={formData.interestType}
            onChange={(e) => setFormData({ ...formData, interestType: e.target.value as InterestType })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openDate">Open Date *</Label>
          <Input type="date" id="openDate" required value={formData.openDate} onChange={(e) => setFormData({ ...formData, openDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="termEndDate">Term End Date *</Label>
          <Input type="date" id="termEndDate" required value={formData.termEndDate} onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lender">Lender (Optional)</Label>
        <Input id="lender" value={formData.lender} onChange={(e) => setFormData({ ...formData, lender: e.target.value })} />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>}
        <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Liability'}</Button>
      </div>
    </form>
  );
}
