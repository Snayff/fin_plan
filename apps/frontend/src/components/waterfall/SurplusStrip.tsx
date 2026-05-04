import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

interface Props {
  income: number;
  committed: number;
  discretionary: number;
}

export function SurplusStrip({ income, committed, discretionary }: Props) {
  const surplus = toGBP(income - committed - discretionary);
  const pct = income > 0 ? (surplus / income) * 100 : null;

  return (
    <div
      className="flex items-baseline justify-between rounded-md border border-tier-surplus/20 bg-tier-surplus/5 px-5 py-3 text-tier-surplus"
      data-testid="surplus-strip"
    >
      <span className="font-heading text-xs font-bold uppercase tracking-widest">= SURPLUS</span>
      <span className="font-numeric text-base font-semibold tabular-nums">
        {formatCurrency(surplus)}
        {pct !== null && (
          <span className="ml-2 text-xs text-tier-surplus/70">· {pct.toFixed(1)}%</span>
        )}
      </span>
    </div>
  );
}
