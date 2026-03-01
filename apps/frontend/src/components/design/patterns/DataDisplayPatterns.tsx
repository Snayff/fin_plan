// Update this file when data display conventions change.
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PatternExample } from '../PatternExample';
import { PatternSection } from '../PatternSection';

function MetricCard({
  label,
  value,
  delta,
  deltaType,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
}) {
  const deltaColor =
    deltaType === 'positive'
      ? 'text-success'
      : deltaType === 'negative'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1 font-mono">{value}</p>
        {delta && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${deltaColor}`}>
            {deltaType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {deltaType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const sampleTransactions = [
  { date: '1 Mar', description: 'Salary', category: 'Income', amount: '+$5,200.00', type: 'income' },
  { date: '2 Mar', description: 'Rent', category: 'Housing', amount: '–$1,800.00', type: 'expense' },
  { date: '3 Mar', description: 'Groceries', category: 'Food', amount: '–$142.50', type: 'expense' },
  { date: '4 Mar', description: 'Freelance', category: 'Income', amount: '+$800.00', type: 'income' },
];

export function DataDisplayPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Data Display</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Patterns for presenting financial data: summary metrics, lists, tables, and charts.
        </p>
      </div>

      <PatternSection
        id="metric-cards"
        title="Metric Cards"
        description="Summary statistics at the top of a page. Grid of 3–4 cards. Consistent structure: label (muted sm) → value (2xl semibold mono) → optional delta (xs with icon). Always use font-mono for financial figures."
        useWhen={[
          'Showing 2–4 key summary metrics at the top of a page',
          'Any standalone financial value that needs visual prominence',
        ]}
        avoidWhen={[
          'More than 4 metric cards in a row — group or summarise instead',
          'Non-financial text values — plain text or a Badge is more appropriate',
        ]}
      >
        <PatternExample
          type="correct"
          code={`<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">Net Worth</p>
      <p className="text-2xl font-semibold text-foreground mt-1 font-mono">
        $48,200.00
      </p>
      <p className="text-xs mt-1 flex items-center gap-1 text-success">
        <TrendingUp className="h-3 w-3" />
        +$1,200 this month
      </p>
    </CardContent>
  </Card>
</div>`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Net Worth"
              value="$48,200.00"
              delta="+$1,200 this month"
              deltaType="positive"
            />
            <MetricCard
              label="Monthly Expenses"
              value="$3,840.00"
              delta="+$240 vs last month"
              deltaType="negative"
            />
            <MetricCard
              label="Savings Rate"
              value="26%"
              delta="On track"
              deltaType="neutral"
            />
          </div>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="table"
        title="Table"
        description="For lists of records with multiple comparable attributes. Use the Table component. Amounts are right-aligned and use font-mono. Income is text-success, expenses use the default foreground."
        useWhen={[
          'Displaying 5+ records with 3+ comparable columns',
          'Transactions, budget items, or anything users need to scan column by column',
        ]}
        avoidWhen={[
          '2–4 items with 1–2 attributes — use a simple list or Card instead',
          'Single-column data — a plain list or stack of Cards is clearer',
        ]}
      >
        <PatternExample
          type="correct"
          code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Description</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions.map((tx) => (
      <TableRow key={tx.id}>
        <TableCell className="text-muted-foreground">{tx.date}</TableCell>
        <TableCell>{tx.description}</TableCell>
        <TableCell className="text-muted-foreground">{tx.category}</TableCell>
        <TableCell className={cn(
          "text-right font-mono",
          tx.type === 'income' ? 'text-success' : 'text-foreground'
        )}>
          {tx.amount}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTransactions.map((tx) => (
                <TableRow key={tx.description + tx.date}>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                  <TableCell
                    className={`text-right font-mono ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}
                  >
                    {tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="charts"
        title="Charts"
        description="All charts are wrapped in a Card with a CardHeader title. Charts use the design token chart colours (chart-1 through chart-5) — never hardcode hex values in Recharts props."
        useWhen={[
          'Showing trends over time (line/area chart)',
          'Comparing proportions (pie/donut chart)',
          'Comparing categories side by side (bar chart)',
        ]}
        avoidWhen={[
          'Data that is better expressed as a single number — use a Metric Card',
          'Fewer than 3 data points — a simple statement is clearer',
        ]}
      >
        <PatternExample
          label="Chart wrapper convention"
          code={`// All charts follow this Card wrapper:
<Card>
  <CardHeader>
    <CardTitle>Income vs Expenses</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <Bar dataKey="income" fill="hsl(var(--chart-1))" />  {/* Teal */}
        <Bar dataKey="expenses" fill="hsl(var(--chart-2))" /> {/* Slate */}
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

// Chart colour tokens:
// chart-1: hsl(var(--chart-1)) — Teal   → Income, primary series
// chart-2: hsl(var(--chart-2)) — Slate  → Expenses
// chart-3: hsl(var(--chart-3)) — Purple → Tertiary data
// chart-4: hsl(var(--chart-4)) — Magenta → Additional
// chart-5: hsl(var(--chart-5)) — Orange  → Highlights / CTAs`}
        >
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end gap-2 px-4">
                {[
                  { month: 'Dec', income: 70, expense: 55 },
                  { month: 'Jan', income: 85, expense: 60 },
                  { month: 'Feb', income: 75, expense: 65 },
                  { month: 'Mar', income: 90, expense: 58 },
                ].map(({ month, income, expense }) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5" style={{ height: 100 }}>
                      <div
                        className="flex-1 rounded-t"
                        style={{ height: `${income}%`, backgroundColor: 'hsl(var(--chart-1))' }}
                      />
                      <div
                        className="flex-1 rounded-t"
                        style={{ height: `${expense}%`, backgroundColor: 'hsl(var(--chart-2))' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{month}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                  Income
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                  Expenses
                </span>
              </div>
            </CardContent>
          </Card>
        </PatternExample>
      </PatternSection>
    </div>
  );
}
