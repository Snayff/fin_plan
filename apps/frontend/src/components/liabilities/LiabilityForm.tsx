import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import { assetService } from '../../services/asset.service';
import type { AssetType, CreateAssetInput, CreateLiabilityInput, InterestType, LiabilityType, LiquidityType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { createLiabilitySchema, createAssetSchema } from '@finplan/shared';
import { showError } from '../../lib/toast';

interface LiabilityFormProps {
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
    linkedAssetId: '',
    linkMode: 'none' as 'none' | 'existing' | 'new',
    newAssetName: '',
    newAssetType: 'housing' as AssetType,
    newAssetCurrentValue: '' as string | number,
    newAssetPurchaseValue: '' as string | number,
    newAssetPurchaseDate: '',
    newAssetExpectedGrowthRate: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetService.getAssets(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLiabilityInput) => {
      let linkedAssetId = data.linkedAssetId;

      if (formData.linkMode === 'new') {
        const assetPayload: CreateAssetInput = {
          name: formData.newAssetName,
          type: formData.newAssetType,
          currentValue: Number(formData.newAssetCurrentValue),
          purchaseValue:
            formData.newAssetPurchaseValue === '' ? undefined : Number(formData.newAssetPurchaseValue),
          purchaseDate: formData.newAssetPurchaseDate || undefined,
          expectedGrowthRate: formData.newAssetExpectedGrowthRate,
        };
        const assetResult = await assetService.createAsset(assetPayload);
        linkedAssetId = assetResult.asset.id;
      }

      return liabilityService.createLiability({
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
    onError: (error: Error) => {
      showError(error.message || 'Failed to create liability');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate nested asset fields when creating a new linked asset
    if (formData.linkMode === 'new') {
      const assetData = {
        name: formData.newAssetName,
        type: formData.newAssetType,
        currentValue: Number(formData.newAssetCurrentValue),
        purchaseValue: formData.newAssetPurchaseValue === '' ? undefined : Number(formData.newAssetPurchaseValue),
        purchaseDate: formData.newAssetPurchaseDate || undefined,
        expectedGrowthRate: formData.newAssetExpectedGrowthRate,
      };
      const assetResult = createAssetSchema.safeParse(assetData);
      if (!assetResult.success) {
        const errors: Record<string, string> = {};
        for (const issue of assetResult.error.issues) {
          const rawKey = String(issue.path[0] ?? 'form');
          const key = `newAsset${rawKey.charAt(0).toUpperCase()}${rawKey.slice(1)}`;
          if (!errors[key]) errors[key] = issue.message;
        }
        setFormErrors(errors);
        showError('Please fix the errors below.');
        return;
      }
    }

    const submitData: CreateLiabilityInput = {
      name: formData.name,
      type: formData.type,
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate),
      interestType: formData.interestType,
      openDate: formData.openDate,
      termEndDate: formData.termEndDate,
      linkedAssetId:
        formData.linkMode === 'existing' ? formData.linkedAssetId || undefined : undefined,
      metadata: formData.lender ? { lender: formData.lender } : undefined,
    };

    const { linkedAssetId: _linkedAssetId, ...submitDataForValidation } = submitData;
    const result = createLiabilitySchema.safeParse(submitDataForValidation);
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

  const assets = assetsData?.assets || [];
  const derivedLiquidityType = ASSET_LIQUIDITY_BY_TYPE[formData.newAssetType];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Liability Name *</Label>
        <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
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
        {formErrors.currentBalance && <p className="text-sm text-destructive mt-1">{formErrors.currentBalance}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%) *</Label>
          <Input type="number" id="interestRate" step="0.01" required value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} />
          {formErrors.interestRate && <p className="text-sm text-destructive mt-1">{formErrors.interestRate}</p>}
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
          {formErrors.openDate && <p className="text-sm text-destructive mt-1">{formErrors.openDate}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="termEndDate">Term End Date *</Label>
          <Input type="date" id="termEndDate" required value={formData.termEndDate} onChange={(e) => setFormData({ ...formData, termEndDate: e.target.value })} />
          {formErrors.termEndDate && <p className="text-sm text-destructive mt-1">{formErrors.termEndDate}</p>}
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
            Link an existing asset or create a new one to associate with this liability.
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
              {assets.map((asset) => (
                <option
                  key={asset.id}
                  value={asset.id}
                  disabled={Boolean(asset.linkedLiability)}
                >
                  {asset.name}
                  {asset.linkedLiability ? ` (already linked to ${asset.linkedLiability.name})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Assets already linked to another liability are unavailable.
            </p>
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
                placeholder="e.g., Main Residence"
              />
              {formErrors.newAssetName && <p className="text-sm text-destructive mt-1">{formErrors.newAssetName}</p>}
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
              {formErrors.newAssetCurrentValue && <p className="text-sm text-destructive mt-1">{formErrors.newAssetCurrentValue}</p>}
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

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>}
        <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Liability'}</Button>
      </div>
    </form>
  );
}
