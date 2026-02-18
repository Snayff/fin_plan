import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// Use design tokens for chart colors
const CHART_COLORS = {
  line: 'hsl(177 95% 39%)',      // Teal (chart-1/success)
  positive: 'hsl(177 95% 39%)',  // Teal for positive trend
  negative: 'hsl(0 84% 60%)',    // Red for negative trend
};

interface MiniAccountChartProps {
  data: Array<{
    date: string;
    balance: number;
  }>;
}

export default function MiniAccountChart({ data }: MiniAccountChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
        No data available
      </div>
    );
  }

  // Determine if trend is positive or negative
  const firstBalance = data[0]?.balance || 0;
  const lastBalance = data[data.length - 1]?.balance || 0;
  const isPositiveTrend = lastBalance >= firstBalance;
  const lineColor = isPositiveTrend ? CHART_COLORS.positive : CHART_COLORS.negative;

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          type="monotone"
          dataKey="balance"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
