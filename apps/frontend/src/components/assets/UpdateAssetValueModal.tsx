import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../../services/asset.service';
import type { Asset, UpdateAssetValueInput } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface UpdateAssetValueModalProps {
  asset: Asset;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UpdateAssetValueModal({ asset, onSuccess, onCancel }: UpdateAssetValueModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    newValue: asset.currentValue,
    date: new Date().toISOString().substring(0, 10),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAssetValueInput) => assetService.updateAssetValue(asset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: UpdateAssetValueInput = {
      newValue: Number(formData.newValue),
      date: formData.date,
      source: 'manual',
    };
    updateMutation.mutate(submitData);
  };

  const gain = formData.newValue - asset.currentValue;
  const gainPercent = asset.currentValue > 0 ? ((gain / asset.currentValue) * 100).toFixed(2) : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-md p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-1">Current Value</p>
        <p className="text-2xl font-bold text-foreground">
          £{asset.currentValue.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newValue">New Value *</Label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            id="newValue"
            step="0.01"
            required
            value={formData.newValue}
            onChange={(e) => setFormData({ ...formData, newValue: Number(e.target.value) })}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Valuation Date</Label>
        <Input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Date of this valuation (defaults to today)
        </p>
      </div>

      {gain !== 0 && (
        <div className={`border rounded-md p-4 ${gain >= 0 ? 'bg-success-subtle/20 border-success-subtle' : 'bg-muted/20 border-muted'}`}>
          <p className="text-sm text-muted-foreground mb-1">
            {gain >= 0 ? 'Increase' : 'Decrease'}
          </p>
          <p className={`text-lg font-bold ${gain >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
            {gain >= 0 ? '+' : ''}£{gain.toLocaleString('en-GB', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-sm ml-2">
              ({gain >= 0 ? '+' : ''}{gainPercent}%)
            </span>
          </p>
        </div>
      )}

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
          {updateMutation.isPending ? 'Updating...' : 'Update Value'}
        </Button>
      </div>
    </form>
  );
}
