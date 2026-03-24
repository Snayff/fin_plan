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
      {/* Cascading bars */}
      <div className="space-y-1.5 overflow-visible">
        {/* Income — full width */}
        <TierBar
          label="Income"
          amount={income}
          leftPct={0}
          widthPct={100}
          color={TIER_COLORS.income}
          active={income > 0}
        />
        {/* Committed — starts at 0 */}
        <TierBar
          label="Committed"
          amount={committed}
          leftPct={0}
          widthPct={committedPct}
          color={TIER_COLORS.committed}
          active={committed > 0}
        />
        {/* Discretionary — starts where committed ends */}
        <TierBar
          label="Discretionary"
          amount={discretionary}
          leftPct={committedPct}
          widthPct={discretionaryPct}
          color={TIER_COLORS.discretionary}
          active={discretionary > 0}
        />
        {/* Surplus — breakout card wrapper */}
        <div className="relative z-20 mt-3 -mb-7 py-3 before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:-right-8 before:bg-surface-elevated before:border before:border-surface-elevated-border before:rounded-lg before:-z-10">
          <TierBar
            label="Surplus"
            amount={surplus}
            leftPct={committedPct + discretionaryPct}
            widthPct={surplusPct}
            color={TIER_COLORS.surplus}
            active={surplus !== 0}
            isSurplus
          />
        </div>
      </div>
    </div>
  );
}

function TierBar({
  label,
  amount,
  leftPct,
  widthPct,
  color,
  active,
  isSurplus,
}: {
  label: string;
  amount: number;
  leftPct: number;
  widthPct: number;
  color: string;
  active: boolean;
  isSurplus?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span
          className="w-[100px] shrink-0 font-medium"
          style={{
            color: active ? color : undefined,
            paddingLeft: isSurplus ? "8px" : undefined,
          }}
        >
          {label}
        </span>
        <span className={active ? "font-mono font-medium" : "text-muted-foreground"}>
          {active ? formatCurrency(amount) : "—"}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            left: active ? `${leftPct}%` : "0%",
            width: active ? `${Math.max(widthPct, 2)}%` : "0%",
            backgroundColor: color,
            opacity: active ? (isSurplus && amount < 0 ? 0.5 : 0.8) : 0.2,
          }}
        />
      </div>
    </div>
  );
}
