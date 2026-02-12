import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '../services/liability.service';
import { showSuccess, showError } from '../lib/toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LiabilityForm from '../components/liabilities/LiabilityForm';
import LiabilityEditForm from '../components/liabilities/LiabilityEditForm';
import AllocatePaymentModal from '../components/liabilities/AllocatePaymentModal';
import PayoffProjectionModal from '../components/liabilities/PayoffProjectionModal';
import FilterBar from '../components/filters/FilterBar';
import { useClientFilters } from '../hooks/useClientFilters';
import { liabilityFilterConfig } from '../config/filter-configs';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import type { Liability } from '../types';
import { WalletIcon, LayoutListIcon, TrendingUpIcon, CalendarIcon } from 'lucide-react';

export default function LiabilitiesPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [viewingProjection, setViewingProjection] = useState<Liability | null>(null);
  const [allocatingPayment, setAllocatingPayment] = useState<Liability | null>(null);
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
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete liability');
    },
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
  } = useClientFilters({
    items: liabilities,
    fields: liabilityFilterConfig.fields,
  });

  // Calculate summary stats from filtered data
  const totalDebt = filteredLiabilities.reduce((sum, liability) => sum + liability.currentBalance, 0);
  const totalLiabilities = filteredLiabilities.length;
  const monthlyMinimumPayment = filteredLiabilities.reduce((sum, liability) => {
    const multiplier = liability.paymentFrequency === 'monthly' ? 1 :
                       liability.paymentFrequency === 'biweekly' ? 2.17 : 4.33;
    return sum + (liability.minimumPayment * multiplier);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading liabilities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading liabilities: {(error as Error).message}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getInterestRateBadgeColor = (rate: number) => {
    if (rate === 0) return 'bg-muted text-muted-foreground';
    if (rate < 5) return 'bg-success-subtle text-success';
    if (rate < 10) return 'bg-warning-subtle text-warning';
    return 'bg-chart-3-subtle text-chart-3'; // Brand purple/rose for higher rates
  };

  const calculatePayoffProgress = (liability: Liability) => {
    const totalPaid = liability.originalAmount - liability.currentBalance;
    const progress = (totalPaid / liability.originalAmount) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Liabilities</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Add Liability
        </Button>
      </div>

      <FilterBar
        config={liabilityFilterConfig}
        filters={filters}
        onFilterChange={setFilter}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* Summary Cards */}
      {filteredLiabilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon className="h-4 w-4 text-brand" />
                <p className="text-sm text-muted-foreground">Total Debt</p>
              </div>
              <p className="text-2xl font-bold text-brand">
                {formatCurrency(totalDebt)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <LayoutListIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Liabilities</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totalLiabilities}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Monthly Minimum</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyMinimumPayment)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {liabilities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No liabilities yet. Track debts and loans to manage your financial obligations.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Add Liability
            </Button>
          </CardContent>
        </Card>
      ) : filteredLiabilities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No liabilities match your filters.</p>
            <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLiabilities.map((liability) => (
            <Card key={liability.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{liability.name}</h3>
                    <p className="text-sm text-text-secondary capitalize">{liability.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant="outline" className={getInterestRateBadgeColor(liability.interestRate)}>
                    {liability.interestRate.toFixed(2)}% APR
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-brand">
                    {formatCurrency(liability.currentBalance)}
                  </p>
                </div>

                {/* Payoff Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Paid Off</span>
                    <span>{calculatePayoffProgress(liability).toFixed(1)}%</span>
                  </div>
                  <Progress value={calculatePayoffProgress(liability)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(liability.originalAmount - liability.currentBalance)} of {formatCurrency(liability.originalAmount)}
                  </p>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Min Payment</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(liability.minimumPayment)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {liability.paymentFrequency}
                    </p>
                  </div>
                  {liability.projectedPayoffDate && (
                    <div className="bg-muted/50 border border-border rounded-md p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Payoff Date</p>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {new Date(liability.projectedPayoffDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAllocatingPayment(liability)}
                      className="flex-1"
                    >
                      Allocate Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingProjection(liability)}
                      className="flex-1"
                    >
                      View Projection
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLiability(liability)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingLiability(liability)}
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive-subtle"
                    >
                      Delete
                    </Button>
                  </div>
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
        title="Create Liability"
      >
        <LiabilityForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingLiability && (
        <Modal
          isOpen={true}
          onClose={() => setEditingLiability(null)}
          title="Edit Liability"
        >
          <LiabilityEditForm
            liability={editingLiability}
            onSuccess={() => setEditingLiability(null)}
            onCancel={() => setEditingLiability(null)}
          />
        </Modal>
      )}

      {/* Allocate Payment Modal */}
      {allocatingPayment && (
        <Modal
          isOpen={true}
          onClose={() => setAllocatingPayment(null)}
          title="Allocate Payment"
        >
          <AllocatePaymentModal
            liability={allocatingPayment}
            onSuccess={() => setAllocatingPayment(null)}
            onCancel={() => setAllocatingPayment(null)}
          />
        </Modal>
      )}

      {/* Payoff Projection Modal */}
      {viewingProjection && (
        <Modal
          isOpen={true}
          onClose={() => setViewingProjection(null)}
          title="Payoff Projection"
        >
          <PayoffProjectionModal
            liability={viewingProjection}
            onClose={() => setViewingProjection(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingLiability && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingLiability(null)}
          onConfirm={() => deleteMutation.mutate(deletingLiability.id)}
          title="Delete Liability"
          message={
            <>
              Are you sure you want to delete <strong>{deletingLiability.name}</strong>?
              <br /><br />
              <span className="text-sm text-muted-foreground">
                This action cannot be undone. All payment allocation history for this liability will also be deleted.
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
