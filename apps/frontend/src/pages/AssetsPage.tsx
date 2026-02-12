import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/asset.service';
import { showSuccess, showError } from '../lib/toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AssetForm from '../components/assets/AssetForm';
import AssetEditForm from '../components/assets/AssetEditForm';
import UpdateAssetValueModal from '../components/assets/UpdateAssetValueModal';
import AssetValueHistoryChart from '../components/charts/AssetValueHistoryChart';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { assetFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Asset, EnhancedAsset } from '../types';
import { TrendingUpIcon, TrendingDownIcon, CoinsIcon, LayoutListIcon } from 'lucide-react';

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [updatingValueAsset, setUpdatingValueAsset] = useState<EnhancedAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['assets', 'enhanced'],
    queryFn: () => assetService.getEnhancedAssets(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Asset deleted successfully!');
      setDeletingAsset(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete asset');
    },
  });

  const assets = data?.assets || [];

  const {
    filteredItems: filteredAssets,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount,
    filteredCount,
  } = useClientFilters({
    items: assets,
    fields: assetFilterConfig.fields,
  });

  // Calculate summary stats from filtered data
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalAssets = filteredAssets.length;
  const totalGain = filteredAssets.reduce((sum, asset) => sum + (asset.totalGain || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading assets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading assets: {(error as Error).message}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getLiquidityBadgeColor = (liquidityType: string) => {
    switch (liquidityType) {
      case 'liquid':
        return 'bg-success-subtle text-success';
      case 'semi_liquid':
        return 'bg-warning-subtle text-warning';
      case 'illiquid':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Assets</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Add Asset
        </Button>
      </div>

      <FilterBar
        config={assetFilterConfig}
        filters={filters}
        onFilterChange={setFilter}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* Summary Cards */}
      {filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CoinsIcon className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Total Asset Value</p>
              </div>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <LayoutListIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Assets</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totalAssets}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {totalGain >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">Total Gain</p>
              </div>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                {formatCurrency(totalGain)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {assets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No assets yet. Create your first asset to track your wealth.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Asset
            </Button>
          </CardContent>
        </Card>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No assets match your filters.</p>
            <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{asset.name}</h3>
                    <p className="text-sm text-text-secondary capitalize">{asset.type.replace('_', ' ')}</p>
                  </div>
                  <Badge className={getLiquidityBadgeColor(asset.liquidityType)}>
                    {asset.liquidityType.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(asset.currentValue)}
                  </p>
                </div>

                {/* Value History Chart */}
                {asset.valueHistory && asset.valueHistory.length > 0 && (
                  <div className="mb-4 border border-border rounded-md overflow-hidden">
                    <AssetValueHistoryChart data={asset.valueHistory} />
                  </div>
                )}

                {/* Gain/Loss */}
                {asset.purchaseValue !== null && asset.totalGain !== null && (
                  <div className={`border rounded-md p-3 mb-4 ${asset.totalGain >= 0 ? 'bg-success-subtle/20 border-success-subtle' : 'bg-muted/20 border-muted'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      {asset.totalGain >= 0 ? (
                        <TrendingUpIcon className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDownIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {asset.totalGain >= 0 ? 'Gain' : 'Loss'}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${asset.totalGain >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {formatCurrency(asset.totalGain)}
                      {asset.totalGainPercent !== null && (
                        <span className="text-xs ml-1">
                          ({asset.totalGainPercent >= 0 ? '+' : ''}{asset.totalGainPercent.toFixed(2)}%)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpdatingValueAsset(asset)}
                    className="flex-1"
                  >
                    Update Value
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAsset(asset)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingAsset(asset)}
                    className="text-destructive hover:text-destructive hover:bg-destructive-subtle"
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
        title="Create Asset"
      >
        <AssetForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingAsset && (
        <Modal
          isOpen={true}
          onClose={() => setEditingAsset(null)}
          title="Edit Asset"
        >
          <AssetEditForm
            asset={editingAsset}
            onSuccess={() => setEditingAsset(null)}
            onCancel={() => setEditingAsset(null)}
          />
        </Modal>
      )}

      {/* Update Value Modal */}
      {updatingValueAsset && (
        <Modal
          isOpen={true}
          onClose={() => setUpdatingValueAsset(null)}
          title="Update Asset Value"
        >
          <UpdateAssetValueModal
            asset={updatingValueAsset}
            onSuccess={() => setUpdatingValueAsset(null)}
            onCancel={() => setUpdatingValueAsset(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingAsset && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingAsset(null)}
          onConfirm={() => deleteMutation.mutate(deletingAsset.id)}
          title="Delete Asset"
          message={
            <>
              Are you sure you want to delete <strong>{deletingAsset.name}</strong>?
              <br /><br />
              <span className="text-sm text-muted-foreground">
                This action cannot be undone. All value history for this asset will also be deleted.
              </span>
            </>
          }
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
