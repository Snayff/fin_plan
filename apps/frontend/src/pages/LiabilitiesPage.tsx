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
import type { Liability } from '../types';

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

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading liabilities...</div>;
  if (error) return <div className="p-6 text-destructive">Error loading liabilities: {(error as Error).message}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Liabilities</h1>
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

      {filteredLiabilities.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No liabilities found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLiabilities.map((liability) => (
            <Card key={liability.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{liability.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{liability.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant="outline">{liability.interestRate.toFixed(2)}%</Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(liability.currentBalance)}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  Open: {new Date(liability.openDate).toLocaleDateString('en-GB')}<br />
                  Term End: {new Date(liability.termEndDate).toLocaleDateString('en-GB')}<br />
                  Forecast @ term end: {formatCurrency((liability as any).projectedBalanceAtTermEnd ?? liability.currentBalance)}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewingProjection(liability)} className="flex-1">Projection</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingLiability(liability)} className="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => setDeletingLiability(liability)} className="text-destructive">Delete</Button>
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
