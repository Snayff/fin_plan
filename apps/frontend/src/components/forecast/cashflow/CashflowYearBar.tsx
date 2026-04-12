import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { CashflowProjectionMonth } from "@finplan/shared";
import { format } from "date-fns";

interface CashflowYearBarProps {
  month: CashflowProjectionMonth;
  maxAbsNet: number;
  onClick: (month: CashflowProjectionMonth) => void;
  todayDayProportion?: number;
}

export function CashflowYearBar({
  month,
  maxAbsNet,
  onClick,
  todayDayProportion,
}: CashflowYearBarProps) {
  const heightPct =
    maxAbsNet > 0 ? Math.min(100, (Math.abs(month.netChange) / maxAbsNet) * 100) : 0;
  const monthLabel = format(new Date(month.year, month.month - 1, 1), "MMM");
  const ariaLabel = `${monthLabel} ${month.year}: net ${formatCurrency(month.netChange)}, closing ${formatCurrency(month.closingBalance)}${
    month.dipBelowZero ? ", dips below zero" : ""
  }`;
  return (
    <button
      type="button"
      onClick={() => onClick(month)}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex w-full flex-col items-center justify-end h-full rounded-t-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-page-accent",
        month.dipBelowZero
          ? "bg-attention/30 hover:bg-attention/50"
          : "bg-page-accent/25 hover:bg-page-accent/45"
      )}
      style={{ height: `${heightPct}%`, minHeight: 8 }}
    >
      {todayDayProportion !== undefined && (
        <span
          data-testid="today-marker"
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-attention"
          style={{ left: `${todayDayProportion * 100}%` }}
        >
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-attention font-heading">
            today
          </span>
        </span>
      )}
      <span className="absolute -bottom-5 text-[10px] uppercase tracking-widest text-text-tertiary">
        {monthLabel}
      </span>
    </button>
  );
}
