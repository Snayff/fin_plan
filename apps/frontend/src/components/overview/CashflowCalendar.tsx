import { useState } from "react";
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
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

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
          const hasShortfall = month.shortfall;
          const isExpanded = expandedMonth === month.month;

          return (
            <div key={`${month.year}-${month.month}`}>
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
                className={cn(
                  "w-full rounded px-3 py-2 text-sm border bg-surface text-left transition-colors hover:bg-surface-elevated",
                  hasShortfall && "border-attention/30",
                  isExpanded && "rounded-b-none"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {hasShortfall && (
                      <span className="h-[6px] w-[6px] rounded-full bg-attention shrink-0" />
                    )}
                    <span
                      className={cn(
                        "font-heading font-medium",
                        hasShortfall ? "text-attention" : undefined
                      )}
                    >
                      {monthName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-xs font-numeric",
                      hasShortfall ? "text-attention" : "text-text-tertiary"
                    )}
                  >
                    Pot after: {formatCurrency(month.potAfter)}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-tier-committed/[0.03] border border-t-0 border-surface-border rounded-b-md px-4 py-3 pl-7 space-y-2">
                  {month.bills.map((bill) => (
                    <div key={bill.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{bill.name}</span>
                      <span className="font-numeric text-text-secondary">
                        -{formatCurrency(bill.amount)}
                      </span>
                    </div>
                  ))}

                  {month.oneOffIncome.length > 0 &&
                    month.oneOffIncome.map((income) => (
                      <div key={income.id} className="flex justify-between text-xs">
                        <span className="text-text-secondary">{income.name}</span>
                        <span className="font-numeric text-text-tertiary">
                          +{formatCurrency(income.amount)}
                        </span>
                      </div>
                    ))}

                  <div className="border-t border-surface-border my-2" />

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">
                        Pot before
                      </span>
                      <span className="font-numeric text-text-tertiary">
                        {formatCurrency(month.potBefore)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">
                        Bills due
                      </span>
                      <span className="font-numeric text-text-tertiary">
                        -{formatCurrency(month.bills.reduce((s, b) => s + b.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">
                        Monthly accrual
                      </span>
                      <span className="font-numeric text-text-tertiary">
                        +{formatCurrency(month.contribution)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">
                        Pot after
                      </span>
                      <span
                        className={cn(
                          "font-numeric",
                          hasShortfall ? "text-attention" : "text-text-tertiary"
                        )}
                      >
                        {formatCurrency(month.potAfter)}
                      </span>
                    </div>
                  </div>

                  {hasShortfall && (
                    <div className="flex items-center gap-1.5 rounded bg-attention/[0.04] px-2.5 py-1.5 text-[11px] text-attention mt-2">
                      <span className="h-[5px] w-[5px] rounded-full bg-attention shrink-0" />
                      Pot is {formatCurrency(Math.abs(month.potAfter))} short for {monthName}
                    </div>
                  )}
                </div>
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
