import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { format } from 'date-fns';
import NetWorthChart from '../components/charts/NetWorthChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: netWorthTrendResponse } = useQuery({
    queryKey: ['dashboard-net-worth-trend', 6],
    queryFn: () => dashboardService.getNetWorthTrend(6),
  });

  const { data: incomeExpenseTrendResponse } = useQuery({
    queryKey: ['dashboard-income-expense-trend', 6],
    queryFn: () => dashboardService.getIncomeExpenseTrend(6),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive-subtle border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          Error loading dashboard: {(error as Error).message}
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const accounts = data?.accounts || [];
  const recentTransactions = data?.recentTransactions || [];
  const topCategories = data?.topCategories || [];

  const totalCash = summary?.totalCash ?? summary?.totalBalance ?? 0;
  const totalAssets = summary?.totalAssets || 0;
  const totalLiabilities = summary?.totalLiabilities || 0;
  const calculatedNetWorth = totalCash + totalAssets - totalLiabilities;

  // Prepare chart data
  const categoryChartData = topCategories.map((item) => ({
    name: item.category?.name || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#gray',
  }));

  const netWorthData =
    (() => {
      const mapped =
        netWorthTrendResponse?.trend?.map((point) => ({
          date: `${point.month}-01`,
          cash: point.cash ?? point.balance ?? 0,
          assets: point.assets || 0,
          liabilities: point.liabilities || 0,
          netWorth: point.netWorth ?? (point.cash ?? point.balance ?? 0) + (point.assets || 0) - (point.liabilities || 0),
        })) || [];

      const firstMeaningfulIndex = mapped.findIndex(
        (point) =>
          point.netWorth !== 0 || point.cash !== 0 || point.assets !== 0 || point.liabilities !== 0
      );

      const trimmed = firstMeaningfulIndex >= 0 ? mapped.slice(firstMeaningfulIndex) : mapped;

      if (trimmed.length > 0) {
        return trimmed.map(({ date, netWorth }) => ({ date, netWorth }));
      }

      return [
        {
          date: data?.period?.startDate || new Date().toISOString(),
          netWorth: calculatedNetWorth,
        },
      ];
    })();

  const incomeExpenseData =
    incomeExpenseTrendResponse?.trend?.map((point) => ({
      date: `${point.month}-01`,
      income: point.income || 0,
      expense: point.expense || 0,
    })) || [
      {
        date: data?.period?.startDate || new Date().toISOString(),
        income: summary?.monthlyIncome || 0,
        expense: summary?.monthlyExpense || 0,
      },
    ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Overview for {data?.period?.startDate ? format(new Date(data.period.startDate), 'MMMM yyyy') : 'this month'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Net Worth</div>
            <div className="text-2xl font-bold text-foreground">
              £{calculatedNetWorth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-text-tertiary mt-2">Cash + Assets - Liabilities</div>
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
              <span className="text-primary">
                Cash: £{totalCash.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-text-tertiary">+</span>
              <span className="text-success">
                Assets: £{totalAssets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-text-tertiary">-</span>
              <span className="text-brand">
                Liabilities: £{totalLiabilities.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Income</div>
            <div className="text-2xl font-bold text-success">
              £{summary?.monthlyIncome?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-text-tertiary mt-1">This Period</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Expenses</div>
            <div className="text-2xl font-bold text-expense">
              £{summary?.monthlyExpense?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-text-tertiary mt-1">This Period</div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Net Cash Flow</div>
            <div className={`text-2xl font-bold ${(summary?.netCashFlow || 0) >= 0 ? 'text-success' : 'text-warning'}`}>
              £{summary?.netCashFlow?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-text-tertiary mt-1">
              Savings Rate: {summary?.savingsRate || '0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Assets</div>
            <div className="text-2xl font-bold text-success">
              £{summary?.totalAssets?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-text-tertiary mt-1">Property, investments, etc.</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Liabilities</div>
            <div className="text-2xl font-bold text-brand">
              £{summary?.totalLiabilities?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm text-text-tertiary mt-1">Loans, mortgages, etc.</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <NetWorthChart data={netWorthData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={incomeExpenseData} />
          </CardContent>
        </Card>
      </div>

      {/* Accounts and Categories Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No accounts yet. Add your first account to get started.</p>
            ) : (
              <div className="space-y-3">
                {accounts.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <div className="font-medium text-foreground">{account.name}</div>
                      <div className="text-sm text-text-secondary capitalize">{account.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {account.currency} {account.balance.toLocaleString('en-GB', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {accounts.length > 5 && (
                  <div className="text-sm text-primary hover:text-primary-hover cursor-pointer pt-2">
                    View all {accounts.length} accounts →
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={categoryChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet. Add your first transaction to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                        {format(new Date(transaction.date), 'd MMM')}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {transaction.category && (
                          <Badge variant="outline" style={{
                            backgroundColor: `${transaction.category.color}20`,
                            color: transaction.category.color,
                            borderColor: transaction.category.color,
                          }}>
                            {transaction.category.name}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        <span className={transaction.type === 'income' ? 'text-success' : 'text-expense'}>
                          {transaction.type === 'income' ? '+' : '-'}£
                          {transaction.amount.toLocaleString('en-GB', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
