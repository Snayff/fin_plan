import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../../services/asset.service';
import { accountService } from '../../services/account.service';
import type { AssetType, LiquidityType, CreateAssetInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AssetForm({ onSuccess, onCancel }: AssetFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'investment' as AssetType,
    currentValue: '' as string | number,
    purchaseValue: '' as string | number,
    purchaseDate: '',
    expectedGrowthRate: 0,
    liquidityType: 'liquid' as LiquidityType,
    accountId: '',
  });

  // Fetch accounts for the dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAssetInput) => assetService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateAssetInput = {
      name: formData.name,
      type: formData.type,
      currentValue: Number(formData.currentValue),
      purchaseValue: formData.purchaseValue === '' ? undefined : Number(formData.purchaseValue),
      purchaseDate: formData.purchaseDate || undefined,
      expectedGrowthRate: formData.expectedGrowthRate,
      liquidityType: formData.liquidityType,
      accountId: formData.accountId || undefined,
    };
    createMutation.mutate(submitData);
  };

  const accounts = accountsData?.accounts || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Asset Name *</Label>
        <Input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Residence, Investment Portfolio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <select
          id="type"
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="real_estate">Real Estate</option>
          <option value="investment">Investment</option>
          <option value="vehicle">Vehicle</option>
          <option value="business">Business</option>
          <option value="personal_property">Personal Property</option>
          <option value="crypto">Cryptocurrency</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentValue">Current Value *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="currentValue"
            step="0.01"
            required
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseValue">Purchase Value (Optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="purchaseValue"
            step="0.01"
            value={formData.purchaseValue}
            onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Used to calculate gain/loss
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseDate">Purchase Date (Optional)</Label>
        <Input
          type="date"
          id="purchaseDate"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedGrowthRate">Expected Growth Rate (%)</Label>
        <Input
          type="number"
          id="expectedGrowthRate"
          step="0.1"
          value={formData.expectedGrowthRate}
          onChange={(e) => setFormData({ ...formData, expectedGrowthRate: Number(e.target.value) })}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Annual expected growth rate percentage
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="liquidityType">Liquidity Type *</Label>
        <select
          id="liquidityType"
          required
          value={formData.liquidityType}
          onChange={(e) => setFormData({ ...formData, liquidityType: e.target.value as LiquidityType })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="liquid">Liquid (easily converted to cash)</option>
          <option value="semi_liquid">Semi-Liquid (takes time to convert)</option>
          <option value="illiquid">Illiquid (difficult to convert)</option>
        </select>
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
        <p className="text-xs text-muted-foreground">
          Link this asset to an account for tracking
        </p>
      </div>

      {createMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(createMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}
