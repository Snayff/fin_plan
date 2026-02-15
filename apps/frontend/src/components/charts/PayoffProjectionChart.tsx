import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Use design tokens for chart colors
const CHART_COLORS = {
  balance: 'hsl(177 95% 39%)',       // Teal (success) - showing positive progress
  balanceFill: 'hsl(177 95% 39%)',
};

interface PayoffProjectionChartProps {
  data: Array<{
    date: string;
    balance: number;
    principalPaid: number;
    interestPaid: number;
  }>;
}

export default function PayoffProjectionChart({ data }: PayoffProjectionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
        No projection data available
      </div>
    );
  }

  // Sample data for long schedules to keep chart performant
  const sampledData = data.length > 60
    ? data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 60) === 0)
    : data;

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={sampledData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.balanceFill} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.balanceFill} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Balance']}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={CHART_COLORS.balance}
          fill="url(#balanceGradient)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
