import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/format";
import { usePrefersReducedMotion } from "@/utils/motion";
import type { SurplusPoint } from "@finplan/shared";

interface SurplusAccumulationChartProps {
  data: SurplusPoint[];
}

export function SurplusAccumulationChart({ data }: SurplusAccumulationChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isEmpty = data.length < 2 || data.every((d) => d.cumulative === 0);
  const last = data[data.length - 1];

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-heading font-semibold uppercase tracking-widest text-text-tertiary">
          Surplus Accumulation
        </span>
      </div>

      {isEmpty ? (
        <div className="h-40 flex items-center justify-center px-6">
          <p className="text-sm text-text-tertiary text-center">
            Add assets in the Assets section to see your projection
          </p>
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4adcd0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4adcd0" stopOpacity={0} />
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
                formatter={(value: number) => [formatCurrency(value), "Accumulated"]}
                contentStyle={{
                  background: "#141b2e",
                  border: "1px solid #222c45",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#4adcd0"
                strokeWidth={2}
                fill="url(#surplusGrad)"
                dot={false}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stat row */}
      {!isEmpty && last && (
        <div className="px-5 py-3 border-t border-surface-elevated flex items-center gap-6">
          <div>
            <span className="text-xs text-text-tertiary">Today</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">£0</p>
          </div>
          <div>
            <span className="text-xs text-text-tertiary">Accumulated ({last.year})</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">
              {formatCurrency(last.cumulative)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
