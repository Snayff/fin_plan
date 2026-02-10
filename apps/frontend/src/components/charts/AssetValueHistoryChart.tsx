import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// Use design tokens for chart colors
const CHART_COLORS = {
  line: 'hsl(177 95% 39%)',      // Teal (chart-1/success)
  positive: 'hsl(177 95% 39%)',  // Teal for positive trend
  negative: 'hsl(var(--muted-foreground))',    // Muted for negative trend (not red!)
};

interface AssetValueHistoryChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
}

export default function AssetValueHistoryChart({ data }: AssetValueHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
        No history available
      </div>
    );
  }

  // Determine if trend is positive or negative
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositiveTrend = lastValue >= firstValue;
  const lineColor = isPositiveTrend ? CHART_COLORS.positive : CHART_COLORS.negative;

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
