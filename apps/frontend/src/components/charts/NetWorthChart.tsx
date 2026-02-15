import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

// Use design tokens for chart colors
const CHART_COLORS = {
  line: 'hsl(177 95% 39%)',      // Teal (chart-1/success)
  grid: 'hsl(230 27% 26%)',      // border color
  text: 'hsl(230 23% 82%)',      // text-secondary
};

interface NetWorthChartProps {
  data: Array<{
    date: string;
    netWorth: number;
  }>;
}

export default function NetWorthChart({ data }: NetWorthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available yet. Add transactions to see your net worth trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM yyyy', { locale: enGB })}
          stroke={CHART_COLORS.text}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke={CHART_COLORS.text}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(230 27% 19%)',
            border: '1px solid hsl(230 27% 26%)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'hsl(230 29% 96%)',
          }}
          labelFormatter={(date) => format(new Date(date), 'MMMM yyyy', { locale: enGB })}
          formatter={(value: number) => [`£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, 'Net Worth']}
        />
        <Line
          type="monotone"
          dataKey="netWorth"
          stroke={CHART_COLORS.line}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.line, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
