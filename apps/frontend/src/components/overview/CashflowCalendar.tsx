import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCashflow } from "@/hooks/useWaterfall";
import { buildShortfallNudge } from "@/hooks/useNudge";
import { formatCurrency } from "@/utils/format";
import { NudgeCard } from "@/components/common/NudgeCard";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";

interface CashflowCalendarProps {
  year: number;
  onBack: () => void;
}

export function CashflowCalendar({ year, onBack }: CashflowCalendarProps) {
  const { data: months, isLoading, isError, refetch } = useCashflow(year);

  if (isLoading && !months) return <SkeletonLoader variant="right-panel" />;
  if (isError && !months)
    return (
      <PanelError variant="right" onRetry={refetch} message="Could not load cashflow calendar" />
    );

  const cashflowNudge = buildShortfallNudge(months ?? []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <button
          onClick={onBack}
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          ← Committed / Yearly Bills
        </button>
        <h2 className="text-base font-semibold">Yearly Bills — {year} Cashflow</h2>
      </div>

      <div className="space-y-1">
        {(months ?? []).map((month) => {
          const monthName = format(new Date(month.year, month.month - 1, 1), "MMMM");

          return (
            <div
              key={`${month.year}-${month.month}`}
              className={cn("rounded px-3 py-2 text-sm border", month.shortfall && "border-attention/30")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn("font-medium", month.shortfall ? "text-attention" : undefined)}
                >
                  {monthName}
                </span>
                <span
                  className={cn("text-xs", month.shortfall ? "text-attention" : undefined)}
                >
                  Pot after: {formatCurrency(month.potAfter)}
                </span>
              </div>
              {month.bills.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {month.bills.map((bill) => (
                    <li
                      key={bill.id}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span>{bill.name}</span>
                      <span>{formatCurrency(bill.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {month.oneOffIncome.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {month.oneOffIncome.map((income) => (
                    <li
                      key={income.id}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span>{income.name}</span>
                      <span className="text-green-600 dark:text-green-400">
                        +{formatCurrency(income.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {cashflowNudge && (
        <NudgeCard message={cashflowNudge.message} options={cashflowNudge.options} />
      )}
    </div>
  );
}
