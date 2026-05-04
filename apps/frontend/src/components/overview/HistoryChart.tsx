import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";
import { usePrefersReducedMotion } from "@/utils/motion";

interface HistoryChartProps {
  data: { recordedAt: string; value: number }[];
  snapshotDate?: Date | null;
}

export function HistoryChart({ data, snapshotDate }: HistoryChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No history yet</span>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.recordedAt), "MMM yy"),
  }));

  const snapshotX = snapshotDate ? format(snapshotDate, "MMM yy") : undefined;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v, showPence)}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, showPence), "Value"]}
            labelFormatter={(label: string) => label}
          />
          {snapshotX && (
            <ReferenceLine
              x={snapshotX}
              stroke="hsl(var(--attention))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!prefersReducedMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
