import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import { usePrefersReducedMotion } from "@/utils/motion";
import type { AccountBalancePoint } from "@finplan/shared";

interface AccountAccumulationChartProps {
  label: string;
  data: AccountBalancePoint[];
  monthlyContributions?: number;
  accent: { stroke: string; gradId: string };
  emptyMessage: string;
}

export function AccountAccumulationChart({
  label,
  data,
  monthlyContributions,
  accent,
  emptyMessage,
}: AccountAccumulationChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  const allZero = data.every((d) => d.balance === 0);
  const noContribs = !monthlyContributions || monthlyContributions === 0;
  const isEmpty = data.length < 2 || (allZero && noContribs);
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <span className="label-chart">{label}</span>
      </div>

      {isEmpty ? (
        <div className="h-40 flex items-center justify-center px-6">
          <p className="text-sm text-text-tertiary text-center">{emptyMessage}</p>
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={accent.gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent.stroke} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={accent.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, showPence), "Balance"]}
                contentStyle={{
                  background: "#141b2e",
                  border: "1px solid #222c45",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={accent.stroke}
                strokeWidth={2}
                fill={`url(#${accent.gradId})`}
                dot={false}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isEmpty && first && last && (
        <div className="px-5 py-3 border-t border-surface-elevated flex items-center gap-6">
          <div>
            <span className="text-xs text-text-tertiary">Today</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">
              {formatCurrency(first.balance, showPence)}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-tertiary">Projected ({last.year})</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">
              {formatCurrency(last.balance, showPence)}
            </p>
          </div>
          {monthlyContributions != null && monthlyContributions > 0 && (
            <div className="ml-auto">
              <span className="font-numeric text-xs text-page-accent/70 tabular-nums">
                +{formatCurrency(monthlyContributions, showPence)}/mo
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
