import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../../services/asset.service';
import { liabilityService } from '../../services/liability.service';
import type { Asset, AssetType, LiquidityType, UpdateAssetInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import ConfirmDialog from '../ui/ConfirmDialog';

interface AssetEditFormProps {
  asset: Asset;
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

export default function AssetEditForm({ asset, onSuccess, onCancel }: AssetEditFormProps) {
  const queryClient = useQueryClient();
  const [pendingSubmitData, setPendingSubmitData] = useState<UpdateAssetInput | null>(null);
  const [formData, setFormData] = useState({
    name: asset.name,
    type: asset.type as AssetType,
    purchaseValue: asset.purchaseValue ?? '' as string | number,
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.substring(0, 10) : '',
    expectedGrowthRate: asset.expectedGrowthRate,
    linkedLiabilityId: asset.linkedLiability?.id || '',
  });

  const { data: liabilitiesData } = useQuery({
    queryKey: ['liabilities'],
    queryFn: () => liabilityService.getLiabilities(),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAssetInput) => {
      const result = await assetService.updateAsset(asset.id, data);
      const previousLiabilityId = asset.linkedLiability?.id || null;
      const nextLiabilityId = formData.linkedLiabilityId || null;

      if (previousLiabilityId !== nextLiabilityId) {
        if (previousLiabilityId) {
          await liabilityService.updateLiability(previousLiabilityId, { linkedAssetId: null });
        }

        if (nextLiabilityId) {
          await liabilityService.updateLiability(nextLiabilityId, { linkedAssetId: asset.id });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: UpdateAssetInput = {
      name: formData.name,
      type: formData.type,
      purchaseValue: formData.purchaseValue === '' ? undefined : Number(formData.purchaseValue),
      purchaseDate: formData.purchaseDate || undefined,
      expectedGrowthRate: formData.expectedGrowthRate,
    };
    const previousLiabilityId = asset.linkedLiability?.id || null;
    const nextLiabilityId = formData.linkedLiabilityId || null;
    if (previousLiabilityId && previousLiabilityId !== nextLiabilityId) {
      setPendingSubmitData(submitData);
      return;
    }
    updateMutation.mutate(submitData);
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
        <Label>Current Value</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            step="0.01"
            value={asset.currentValue}
            disabled
            className="pl-8 bg-muted"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Use "Update Value" button to change the current value
        </p>
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
          {liabilities.map((liability) => {
            const isCurrent = liability.id === asset.linkedLiability?.id;
            const disabled = Boolean(liability.linkedAsset && !isCurrent);
            return (
              <option key={liability.id} value={liability.id} disabled={disabled}>
                {liability.name}
                {disabled ? ` (already linked to ${liability.linkedAsset?.name})` : ''}
              </option>
            );
          })}
        </select>
        <p className="text-xs text-muted-foreground">
          Switching the linked liability will unlink the previous one automatically.
        </p>
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
          {updateMutation.isPending ? 'Updating...' : 'Update Asset'}
        </Button>
      </div>

      {pendingSubmitData && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPendingSubmitData(null)}
          onConfirm={() => {
            updateMutation.mutate(pendingSubmitData);
            setPendingSubmitData(null);
          }}
          title="Change Linked Liability"
          message={
            formData.linkedLiabilityId
              ? `This asset is currently linked to "${asset.linkedLiability?.name}". Saving will remove that link and replace it with the selected liability.`
              : `This asset is currently linked to "${asset.linkedLiability?.name}". Saving will remove that link.`
          }
          confirmText="Yes, change link"
          variant="warning"
        />
      )}
    </form>
  );
}
