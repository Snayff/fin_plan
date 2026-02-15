import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Use design tokens for chart colors
const CHART_COLORS = {
  income: 'hsl(177 95% 39%)',    // Teal (chart-1/success) - vibrant positive
  expense: 'hsl(215 25% 35%)',   // Dark Slate Grey (chart-2/expense) - discrete, harmonious
  grid: 'hsl(230 27% 26%)',      // border color
  text: 'hsl(230 23% 82%)',      // text-secondary
};

interface IncomeExpenseChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available yet. Add transactions to see your income vs expenses.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM')}
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
          labelFormatter={(date) => format(new Date(date), 'MMMM yyyy')}
          formatter={(value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
        />
        <Legend />
        <Bar dataKey="income" fill={CHART_COLORS.income} name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill={CHART_COLORS.expense} name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
