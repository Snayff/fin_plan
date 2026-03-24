import { formatCurrency } from "@/utils/format";

interface MiniWaterfallChartProps {
  income: number;
  committed: number;
  discretionary: number;
  surplus: number;
}

const TIER_COLORS = {
  income: "#0ea5e9",
  committed: "#6366f1",
  discretionary: "#a855f7",
  surplus: "#4adcd0",
};

/**
 * Compact waterfall chart showing how money cascades through tiers.
 * Renders as stacked horizontal bars with tier colours, updating live.
 */
export function MiniWaterfallChart({
  income,
  committed,
  discretionary,
  surplus,
}: MiniWaterfallChartProps) {
  // Avoid division by zero
  const total = income || 1;
  const committedPct = Math.min((committed / total) * 100, 100);
  const discretionaryPct = Math.min((discretionary / total) * 100, 100);
  const surplusPct = Math.max(100 - committedPct - discretionaryPct, 0);

  return (
    <div className="space-y-3">
      {/* Cascading bar */}
      <div className="space-y-1.5">
        {/* Income — full width */}
        <TierBar
          label="Income"
          amount={income}
          pct={100}
          color={TIER_COLORS.income}
          active={income > 0}
        />
        {/* Committed — proportion of income */}
        <TierBar
          label="Committed"
          amount={committed}
          pct={committedPct}
          color={TIER_COLORS.committed}
          active={committed > 0}
        />
        {/* Discretionary — proportion of income */}
        <TierBar
          label="Discretionary"
          amount={discretionary}
          pct={discretionaryPct}
          color={TIER_COLORS.discretionary}
          active={discretionary > 0}
        />
        {/* Surplus — remainder */}
        <TierBar
          label="Surplus"
          amount={surplus}
          pct={surplusPct}
          color={TIER_COLORS.surplus}
          active={surplus !== 0}
          isSurplus
        />
      </div>
    </div>
  );
}

function TierBar({
  label,
  amount,
  pct,
  color,
  active,
  isSurplus,
}: {
  label: string;
  amount: number;
  pct: number;
  color: string;
  active: boolean;
  isSurplus?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color: active ? color : undefined }}>
          {label}
        </span>
        <span className={active ? "font-mono font-medium" : "text-muted-foreground"}>
          {active ? formatCurrency(amount) : "—"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: active ? `${Math.max(pct, 2)}%` : "0%",
            backgroundColor: color,
            opacity: active ? (isSurplus && amount < 0 ? 0.5 : 0.8) : 0.2,
          }}
        />
      </div>
    </div>
  );
}
