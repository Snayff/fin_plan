import { useId } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import { format, isValid, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";

interface SummarySparklineProps {
  data: Array<{ date: string; value: number }>;
  color: string;
  currentValue?: number;
  paddingX?: number;
}

function SparklineTooltip({
  active,
  payload,
  color,
}: TooltipProps<number, string> & { color: string }) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (value === undefined) return null;

  const dateStr: unknown = payload[0]?.payload?.date;
  const parsed = typeof dateStr === "string" ? parseISO(dateStr) : null;
  const dateLabel = parsed && isValid(parsed) ? format(parsed, "MMM yyyy") : null;

  return (
    <div className="bg-[#0d1021] border border-white/10 rounded px-2 py-1 text-xs leading-snug">
      {dateLabel && <div className="text-white/50">{dateLabel}</div>}
      <div style={{ color }}>{formatCurrency(value, showPence)}</div>
    </div>
  );
}

export function SummarySparkline({
  data,
  color,
  currentValue = 0,
  paddingX = 0,
}: SummarySparklineProps) {
  const id = useId();
  const gradientId = `sg-${id.replace(/:/g, "")}`;

  const chartData =
    data.length >= 2
      ? data
      : [
          { date: "start", value: currentValue },
          { date: "end", value: currentValue },
        ];

  const values = chartData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.15;

  return (
    <div style={{ marginLeft: paddingX, marginRight: paddingX }}>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[yMin, yMax]} hide />
          <Tooltip
            content={<SparklineTooltip color={color} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.4 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
