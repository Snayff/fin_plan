import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAssetSchema } from '@finplan/shared';
import { assetService } from '../../services/asset.service';
import { liabilityService } from '../../services/liability.service';
import type { AssetType, LiquidityType, CreateAssetInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { showError } from '../../lib/toast';

interface AssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ASSET_LIQUIDITY_BY_TYPE: Record<AssetType, LiquidityType> = {
  housing: 'illiquid',
  investment: 'liquid',
  vehicle: 'illiquid',
  business: 'illiquid',
  personal_property: 'illiquid',
  crypto: 'liquid',
};

export default function AssetForm({ onSuccess, onCancel }: AssetFormProps) {
  const queryClient = useQueryClient();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'investment' as AssetType,
    currentValue: '' as string | number,
    purchaseValue: '' as string | number,
    purchaseDate: '',
    expectedGrowthRate: 0,
    linkedLiabilityId: '',
  });

  const { data: liabilitiesData } = useQuery({
    queryKey: ['liabilities'],
    queryFn: () => liabilityService.getLiabilities(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAssetInput) => {
      const result = await assetService.createAsset(data);

      if (formData.linkedLiabilityId) {
        await liabilityService.updateLiability(formData.linkedLiabilityId, {
          linkedAssetId: result.asset.id,
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create asset');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const submitData: CreateAssetInput = {
      name: formData.name,
      type: formData.type,
      currentValue: Number(formData.currentValue),
      purchaseValue: formData.purchaseValue === '' ? undefined : Number(formData.purchaseValue),
      purchaseDate: formData.purchaseDate || undefined,
      expectedGrowthRate: formData.expectedGrowthRate,
    };

    const result = createAssetSchema.safeParse(submitData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFormErrors(errors);
      showError('Please fix the errors below.');
      return;
    }

    createMutation.mutate(submitData);
  };
  const derivedLiquidityType = ASSET_LIQUIDITY_BY_TYPE[formData.type];
  const liabilities = liabilitiesData?.liabilities || [];

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
        {formErrors.name && (
          <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
        )}
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
          <option value="housing">Housing</option>
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
          {formErrors.currentValue && (
            <p className="text-sm text-destructive mt-1">{formErrors.currentValue}</p>
          )}
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
          min={-100}
          max={1000}
          value={formData.expectedGrowthRate}
          onChange={(e) => setFormData({ ...formData, expectedGrowthRate: Number(e.target.value) })}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Annual expected growth rate percentage (can be negative for depreciation)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Liquidity Type</Label>
        <Input value={derivedLiquidityType.replace('_', ' ')} disabled className="capitalize bg-muted" />
        <p className="text-xs text-muted-foreground">
          Liquidity is set automatically based on asset type
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedLiabilityId">Linked Liability (Optional)</Label>
        <select
          id="linkedLiabilityId"
          value={formData.linkedLiabilityId}
          onChange={(e) => setFormData({ ...formData, linkedLiabilityId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">No linked liability</option>
          {liabilities.map((liability) => (
            <option
              key={liability.id}
              value={liability.id}
              disabled={Boolean(liability.linkedAsset)}
            >
              {liability.name}
              {liability.linkedAsset ? ` (already linked to ${liability.linkedAsset.name})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          You can link existing liabilities here. Creating a new linked liability is handled from the liability flow.
        </p>
      </div>

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
