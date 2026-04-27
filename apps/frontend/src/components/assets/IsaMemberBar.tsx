import type { IsaMemberPosition } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

interface Props {
  pos: IsaMemberPosition;
  annualLimit: number;
  showName: boolean;
  showPence: boolean;
}

export function IsaMemberBar({ pos, annualLimit, showName, showPence }: Props) {
  const { name, used, forecast, forecastedYearTotal, monthlyPlanned, estimatedFlag } = pos;
  const remaining = Math.max(0, annualLimit - forecastedYearTotal);
  const overUsed = used > annualLimit;
  const overUsedAmount = Math.max(0, used - annualLimit);
  const overForecast = !overUsed && forecastedYearTotal > annualLimit;
  const barMax = Math.max(annualLimit, used + forecast);
  const usedPct = barMax > 0 ? (used / barMax) * 100 : 0;
  const forecastPct = barMax > 0 ? (forecast / barMax) * 100 : 0;
  const limitPct = barMax > 0 ? (annualLimit / barMax) * 100 : 0;

  const tooltip = `Used so far: ${formatCurrency(used, showPence)} · Forecast: ${formatCurrency(
    forecast,
    showPence
  )} · Limit: ${formatCurrency(annualLimit, showPence)}`;

  return (
    <div className="flex flex-col gap-1.5 py-2.5">
      <div className="flex items-baseline justify-between">
        {showName ? (
          <span className="text-[12px] font-semibold text-foreground">{name}</span>
        ) : (
          <span className="text-[12px] font-semibold text-foreground">ISA allowance</span>
        )}
        <span className="font-numeric text-[11px] text-text-secondary">
          <strong className="text-foreground">{formatCurrency(used, showPence)}</strong> of{" "}
          {formatCurrency(annualLimit, showPence)} used
          {!overUsed && ` · ${formatCurrency(remaining, showPence)} remaining`}
        </span>
      </div>
      <div
        className="relative h-2 rounded-full bg-foreground/[0.05]"
        title={tooltip}
        data-testid="isa-bar"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-tier-surplus/70"
          style={{ width: `${usedPct}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${usedPct}%`,
            width: `${forecastPct}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, var(--tier-surplus) 0 3px, transparent 3px 6px)",
            opacity: 0.4,
          }}
        />
        {(overForecast || overUsed) && (
          <div
            data-testid="limit-marker"
            className="absolute -top-0.5 -bottom-0.5 w-0.5 rounded-sm bg-text-secondary"
            style={{ left: `${limitPct}%` }}
          />
        )}
      </div>
      <div className="flex items-baseline justify-between text-[10px] text-text-tertiary">
        <span className={overForecast || overUsed ? "text-attention" : undefined}>
          {overUsed
            ? `${formatCurrency(overUsedAmount, showPence)} over allowance`
            : overForecast
              ? `Forecast ${formatCurrency(forecastedYearTotal, showPence)} — ${formatCurrency(
                  forecastedYearTotal - annualLimit,
                  showPence
                )} over limit`
              : `Forecast ${formatCurrency(forecastedYearTotal, showPence)} by year end`}
          {estimatedFlag && " (estimated)"}
        </span>
        {monthlyPlanned > 0 && <span>{formatCurrency(monthlyPlanned, showPence)}/mo planned</span>}
      </div>
    </div>
  );
}
