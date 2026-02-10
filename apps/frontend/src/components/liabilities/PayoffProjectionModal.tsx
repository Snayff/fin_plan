import { useQuery } from '@tanstack/react-query';
import { liabilityService } from '../../services/liability.service';
import type { Liability } from '../../types';
import { Button } from '../ui/button';
import PayoffProjectionChart from '../charts/PayoffProjectionChart';
import { CalendarIcon, TrendingUpIcon, CoinsIcon } from 'lucide-react';
import { useState } from 'react';

interface PayoffProjectionModalProps {
  liability: Liability;
  onClose?: () => void;
}

export default function PayoffProjectionModal({ liability, onClose }: PayoffProjectionModalProps) {
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['liability-projection', liability.id],
    queryFn: () => liabilityService.getPayoffProjection(liability.id),
  });

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground">Calculating projection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md text-sm">
          Error loading projection: {(error as Error).message}
        </div>
        {onClose && (
          <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        )}
      </div>
    );
  }

  const projection = data?.projection;
  if (!projection) return null;

  const schedule = projection.schedule || [];
  const displaySchedule = showFullSchedule ? schedule : schedule.slice(0, 12);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 border border-border rounded-md p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CoinsIcon className="h-3 w-3 text-brand" />
            <p className="text-xs text-muted-foreground">Balance</p>
          </div>
          <p className="text-sm font-bold text-brand">
            {formatCurrency(projection.currentBalance)}
          </p>
        </div>
        <div className="bg-muted/50 border border-border rounded-md p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Payoff Date</p>
          </div>
          <p className="text-sm font-bold text-foreground">
            {projection.projectedPayoffDate
              ? new Date(projection.projectedPayoffDate).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A'}
          </p>
        </div>
        <div className="bg-muted/50 border border-border rounded-md p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUpIcon className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Interest</p>
          </div>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(projection.totalInterestToPay)}
          </p>
        </div>
      </div>

      {/* Projection Chart */}
      {schedule.length > 0 && (
        <div className="border border-border rounded-md p-3">
          <p className="text-sm font-medium text-foreground mb-2">Balance Over Time</p>
          <PayoffProjectionChart data={schedule} />
        </div>
      )}

      {/* Amortization Schedule Table */}
      {schedule.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          <div className="p-3 bg-muted/30 border-b border-border">
            <p className="text-sm font-medium text-foreground">Amortization Schedule</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Month</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Date</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">Payment</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">Principal</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">Interest</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {displaySchedule.map((entry) => (
                  <tr key={entry.month} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-3 py-2 text-foreground">{entry.month}</td>
                    <td className="px-3 py-2 text-foreground">
                      {new Date(entry.date).toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">{formatCurrency(entry.payment)}</td>
                    <td className="px-3 py-2 text-right text-success">{formatCurrency(entry.principal)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(entry.interest)}</td>
                    <td className="px-3 py-2 text-right text-foreground font-medium">{formatCurrency(entry.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schedule.length > 12 && (
            <div className="p-3 border-t border-border text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullSchedule(!showFullSchedule)}
              >
                {showFullSchedule
                  ? `Show Less`
                  : `Show All ${schedule.length} Months`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Monthly Payment Info */}
      <div className="bg-success-subtle/10 border border-success-subtle rounded-md p-3">
        <p className="text-xs text-muted-foreground mb-1">Monthly payment of</p>
        <p className="text-lg font-bold text-success">{formatCurrency(projection.monthlyPayment)}</p>
      </div>

      {onClose && (
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      )}
    </div>
  );
}
