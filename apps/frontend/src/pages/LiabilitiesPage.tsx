import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../services/liability.service';
import { showSuccess, showError } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LiabilityForm from '../components/liabilities/LiabilityForm';
import LiabilityEditForm from '../components/liabilities/LiabilityEditForm';
import PayoffProjectionModal from '../components/liabilities/PayoffProjectionModal';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { liabilityFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { EnhancedLiability, Liability } from '../types';
import { CalendarIcon, TrendingDownIcon, PercentIcon, CreditCardIcon } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

function getInterestRateBadgeColor(rate: number): string {
  if (rate > 15) return 'bg-destructive-subtle text-destructive border-destructive';
  if (rate >= 5)  return 'bg-warning-subtle text-warning border-warning';
  return 'bg-success-subtle text-success border-success';
}

export default function LiabilitiesPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [viewingProjection, setViewingProjection] = useState<Liability | null>(null);
  const [deletingLiability, setDeletingLiability] = useState<Liability | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['liabilities', 'enhanced'],
    queryFn: () => liabilityService.getEnhancedLiabilities(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => liabilityService.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      showSuccess('Liability deleted successfully!');
      setDeletingLiability(null);
    },
    onError: (err: Error) => showError(err.message || 'Failed to delete liability'),
  });

  const liabilities = data?.liabilities || [];
  const {
    filteredItems: filteredLiabilities,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    totalCount,
    filteredCount,
  } = useClientFilters({ items: liabilities, fields: liabilityFilterConfig.fields });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }
  if (error) return <div className="p-6 text-destructive">Error loading liabilities: {(error as Error).message}</div>;

  const totalDebt = filteredLiabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const avgRate = filteredLiabilities.length > 0
    ? filteredLiabilities.reduce((sum, l) => sum + l.interestRate, 0) / filteredLiabilities.length
    : 0;
  const highestRateLiability = filteredLiabilities.reduce<EnhancedLiability | null>(
    (top, l) => (!top || l.interestRate > top.interestRate ? l : top), null
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Liabilities</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Add Liability</Button>
      </div>

      {liabilities.length > 0 && (
        <FilterBar
          config={liabilityFilterConfig}
          filters={filters}
          onFilterChange={setFilter}
          onClearAll={clearFilters}
          activeFilterCount={activeFilterCount}
          totalCount={totalCount}
          filteredCount={filteredCount}
        />
      )}

      {/* Summary Cards */}
      {filteredLiabilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCardIcon className="h-4 w-4 text-expense" />
                <p className="text-sm text-muted-foreground">Total Owed</p>
              </div>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PercentIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Average Interest Rate</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{avgRate.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Highest Rate</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {highestRateLiability ? `${highestRateLiability.interestRate.toFixed(2)}%` : '—'}
              </p>
              {highestRateLiability && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{highestRateLiability.name}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {filteredLiabilities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No liabilities found.</p>
            {liabilities.length === 0 && (
              <Button onClick={() => setIsCreateModalOpen(true)}>Add Your First Liability</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLiabilities.map((liability) => (
            <Card key={liability.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground">{liability.name}</h3>
                    <p className="text-sm text-text-secondary capitalize">{liability.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getInterestRateBadgeColor(liability.interestRate)}
                  >
                    {liability.interestRate.toFixed(2)}%
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-expense">{formatCurrency(liability.currentBalance)}</p>
                </div>

                {liability.linkedAsset && (
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Linked asset</p>
                    <p className="text-sm font-medium text-foreground">{liability.linkedAsset.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {liability.linkedAsset.type.replace(/_/g, ' ')} · {formatCurrency(liability.linkedAsset.currentValue)}
                    </p>
                  </div>
                )}

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    <span>Opened {new Date(liability.openDate).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    <span>Term ends {new Date(liability.termEndDate).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Forecast at term end</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(liability.projectedBalanceAtTermEnd ?? liability.currentBalance)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewingProjection(liability)} className="flex-1">Projection</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingLiability(liability)} className="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => setDeletingLiability(liability)} className="text-destructive hover:text-destructive hover:bg-destructive-subtle">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Liability">
        <LiabilityForm onSuccess={() => setIsCreateModalOpen(false)} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {editingLiability && (
        <Modal isOpen={true} onClose={() => setEditingLiability(null)} title="Edit Liability">
          <LiabilityEditForm liability={editingLiability} onSuccess={() => setEditingLiability(null)} onCancel={() => setEditingLiability(null)} />
        </Modal>
      )}

      {viewingProjection && (
        <Modal isOpen={true} onClose={() => setViewingProjection(null)} title="Liability Projection">
          <PayoffProjectionModal liability={viewingProjection} onClose={() => setViewingProjection(null)} />
        </Modal>
      )}

      {deletingLiability && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingLiability(null)}
          onConfirm={() => deleteMutation.mutate(deletingLiability.id)}
          title="Delete Liability"
          message={`Are you sure you want to delete ${deletingLiability.name}?`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
