import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { format } from 'date-fns';
import NetWorthChart from '../components/charts/NetWorthChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading dashboard: {(error as Error).message}
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const accounts = data?.accounts || [];
  const recentTransactions = data?.recentTransactions || [];
  const topCategories = data?.topCategories || [];

  // Prepare chart data
  const categoryChartData = topCategories.map((item) => ({
    name: item.category?.name || 'Unknown',
    value: item.amount,
    color: item.category?.color || '#gray',
  }));

  // Mock data for charts (replace with real data from backend when available)
  const netWorthData = [
    { date: '2024-01-01', netWorth: summary?.netWorth || 0 },
  ];

  const incomeExpenseData = [
    { 
      date: data?.period?.startDate || new Date().toISOString(), 
      income: summary?.monthlyIncome || 0, 
      expense: summary?.monthlyExpense || 0 
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview for {data?.period?.startDate ? format(new Date(data.period.startDate), 'MMMM yyyy') : 'this month'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Net Worth</div>
          <div className="text-2xl font-bold text-gray-900">
            ${summary?.netWorth?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Balance</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Income</div>
          <div className="text-2xl font-bold text-green-600">
            ${summary?.monthlyIncome?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">This Period</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            ${summary?.monthlyExpense?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">This Period</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Net Cash Flow</div>
          <div className={`text-2xl font-bold ${(summary?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary?.netCashFlow?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Savings Rate: {summary?.savingsRate || '0'}%
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Net Worth Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Trend</h2>
          <NetWorthChart data={netWorthData} />
        </div>

        {/* Income vs Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h2>
          <IncomeExpenseChart data={incomeExpenseData} />
        </div>
      </div>

      {/* Accounts and Categories Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Accounts Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No accounts yet. Add your first account to get started.</p>
          ) : (
            <div className="space-y-3">
              {accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{account.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {account.currency} {account.balance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length > 5 && (
                <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  View all {accounts.length} accounts →
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Spending Categories - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
          <CategoryPieChart data={categoryChartData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet. Add your first transaction to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {format(new Date(transaction.date), 'MMM d')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.category && (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: `${transaction.category.color}20`,
                            color: transaction.category.color,
                          }}
                        >
                          {transaction.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}$
                        {transaction.amount.toLocaleString('en-US', {
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
      </div>
    </div>
  );
}
