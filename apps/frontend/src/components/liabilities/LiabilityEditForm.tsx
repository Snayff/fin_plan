import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import { assetService } from '../../services/asset.service';
import type { AssetType, InterestType, Liability, LiabilityType, LiquidityType, UpdateLiabilityInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import ConfirmDialog from '../ui/ConfirmDialog';

interface LiabilityEditFormProps {
  liability: Liability;
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

export default function LiabilityEditForm({ liability, onSuccess, onCancel }: LiabilityEditFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: liability.name,
    type: liability.type as LiabilityType,
    currentBalance: liability.currentBalance,
    interestRate: liability.interestRate,
    interestType: liability.interestType as InterestType,
    openDate: liability.openDate.substring(0, 10),
    termEndDate: liability.termEndDate.substring(0, 10),
    lender: (liability.metadata as any)?.lender || '',
    linkedAssetId: liability.linkedAsset?.id || '',
    linkMode: liability.linkedAsset ? 'existing' as 'none' | 'existing' | 'new' : 'none' as 'none' | 'existing' | 'new',
    newAssetName: '',
    newAssetType: 'housing' as AssetType,
    newAssetCurrentValue: '' as string | number,
    newAssetPurchaseValue: '' as string | number,
    newAssetPurchaseDate: '',
    newAssetExpectedGrowthRate: 0,
  });

  const [pendingSubmitData, setPendingSubmitData] = useState<UpdateLiabilityInput | null>(null);

  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetService.getAssets(),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateLiabilityInput) => {
      let linkedAssetId = data.linkedAssetId;

      if (formData.linkMode === 'new') {
        const assetResult = await assetService.createAsset({
          name: formData.newAssetName,
          type: formData.newAssetType,
          currentValue: Number(formData.newAssetCurrentValue),
          purchaseValue:
            formData.newAssetPurchaseValue === '' ? undefined : Number(formData.newAssetPurchaseValue),
          purchaseDate: formData.newAssetPurchaseDate || undefined,
          expectedGrowthRate: formData.newAssetExpectedGrowthRate,
        });
        linkedAssetId = assetResult.asset.id;
      }

      return liabilityService.updateLiability(liability.id, {
        ...data,
        linkedAssetId,
      });
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
    const submitData: UpdateLiabilityInput = {
      name: formData.name,
      type: formData.type,
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate),
      interestType: formData.interestType,
      openDate: formData.openDate,
      termEndDate: formData.termEndDate,
      linkedAssetId:
        formData.linkMode === 'none'
          ? null
          : formData.linkMode === 'existing'
          ? formData.linkedAssetId || null
          : undefined,
      metadata: formData.lender ? { lender: formData.lender } : undefined,
    };
    const previousAssetId = liability.linkedAsset?.id || null;
    const linkIsChanging =
      previousAssetId !== null &&
      (formData.linkMode === 'none' ||
        formData.linkMode === 'new' ||
        (formData.linkMode === 'existing' && formData.linkedAssetId !== previousAssetId));
    if (linkIsChanging) {
      setPendingSubmitData(submitData);
      return;
    }
    updateMutation.mutate(submitData);
  };

  const assets = assetsData?.assets || [];
  const derivedLiquidityType = ASSET_LIQUIDITY_BY_TYPE[formData.newAssetType];

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
        <Input type="number" id="currentBalance" step="0.01" required value={formData.currentBalance} onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%) *</Label>
          <Input type="number" id="interestRate" step="0.01" required value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })} />
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

      <div className="space-y-3 border border-border rounded-md p-4">
        <div>
          <Label>Linked Asset</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Update the asset associated with this liability, or remove the link.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant={formData.linkMode === 'none' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData({ ...formData, linkMode: 'none', linkedAssetId: '' })}
          >
            No linked asset
          </Button>
          <Button
            type="button"
            variant={formData.linkMode === 'existing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData({ ...formData, linkMode: 'existing' })}
          >
            Select existing asset
          </Button>
          <Button
            type="button"
            variant={formData.linkMode === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData({ ...formData, linkMode: 'new', linkedAssetId: '' })}
          >
            Create new asset
          </Button>
        </div>

        {formData.linkMode === 'existing' && (
          <div className="space-y-2">
            <Label htmlFor="linkedAssetId">Existing Asset</Label>
            <select
              id="linkedAssetId"
              value={formData.linkedAssetId}
              onChange={(e) => setFormData({ ...formData, linkedAssetId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => {
                const isCurrent = asset.id === liability.linkedAsset?.id;
                const disabled = Boolean(asset.linkedLiability && !isCurrent);
                return (
                  <option key={asset.id} value={asset.id} disabled={disabled}>
                    {asset.name}
                    {disabled ? ` (already linked to ${asset.linkedLiability?.name})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {formData.linkMode === 'new' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newAssetName">Asset Name *</Label>
              <Input
                id="newAssetName"
                required={formData.linkMode === 'new'}
                value={formData.newAssetName}
                onChange={(e) => setFormData({ ...formData, newAssetName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newAssetType">Asset Type *</Label>
              <select
                id="newAssetType"
                value={formData.newAssetType}
                onChange={(e) => setFormData({ ...formData, newAssetType: e.target.value as AssetType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label htmlFor="newAssetCurrentValue">Current Value *</Label>
              <Input
                id="newAssetCurrentValue"
                type="number"
                step="0.01"
                required={formData.linkMode === 'new'}
                value={formData.newAssetCurrentValue}
                onChange={(e) => setFormData({ ...formData, newAssetCurrentValue: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newAssetPurchaseValue">Purchase Value</Label>
                <Input
                  id="newAssetPurchaseValue"
                  type="number"
                  step="0.01"
                  value={formData.newAssetPurchaseValue}
                  onChange={(e) => setFormData({ ...formData, newAssetPurchaseValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAssetPurchaseDate">Purchase Date</Label>
                <Input
                  id="newAssetPurchaseDate"
                  type="date"
                  value={formData.newAssetPurchaseDate}
                  onChange={(e) => setFormData({ ...formData, newAssetPurchaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newAssetExpectedGrowthRate">Expected Growth Rate (%)</Label>
              <Input
                id="newAssetExpectedGrowthRate"
                type="number"
                step="0.1"
                min={-100}
                max={1000}
                value={formData.newAssetExpectedGrowthRate}
                onChange={(e) =>
                  setFormData({ ...formData, newAssetExpectedGrowthRate: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Liquidity Type</Label>
              <Input value={derivedLiquidityType.replace('_', ' ')} disabled className="capitalize bg-muted" />
            </div>
          </div>
        )}
      </div>

      {updateMutation.error && (
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          {(updateMutation.error as Error).message}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>}
        <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Updating...' : 'Update Liability'}</Button>
      </div>

      {pendingSubmitData && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPendingSubmitData(null)}
          onConfirm={() => {
            updateMutation.mutate(pendingSubmitData);
            setPendingSubmitData(null);
          }}
          title="Change Linked Asset"
          message={
            formData.linkMode === 'none'
              ? `This liability is currently linked to "${liability.linkedAsset?.name}". Saving will remove that link.`
              : formData.linkMode === 'new'
              ? `This liability is currently linked to "${liability.linkedAsset?.name}". Saving will remove that link and create a new linked asset instead.`
              : `This liability is currently linked to "${liability.linkedAsset?.name}". Saving will remove that link and replace it with the selected asset.`
          }
          confirmText="Yes, change link"
          variant="warning"
        />
      )}
    </form>
  );
}
