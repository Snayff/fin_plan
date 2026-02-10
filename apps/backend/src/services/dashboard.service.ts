import { prisma } from '../config/database';
import { calculateAccountBalances } from '../utils/balance.utils';

export const dashboardService = {
  /**
   * Get comprehensive dashboard summary
   */
  async getDashboardSummary(userId: string, options: { startDate?: Date; endDate?: Date } = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = options.startDate || startOfMonth;
    const endDate = options.endDate || endOfMonth;

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
      },
    });

    // Calculate balances for all accounts
    const accountIds = accounts.map(a => a.id);
    const balances = accountIds.length > 0 
      ? await calculateAccountBalances(accountIds)
      : new Map<string, number>();

    // Calculate total balance
    const totalBalance = Array.from(balances.values()).reduce((sum, balance) => sum + balance, 0);

    // Get transaction summary for the period
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'income',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const monthlyIncome = Number(incomeAgg._sum.amount) || 0;
    const monthlyExpense = Number(expenseAgg._sum.amount) || 0;
    const netCashFlow = monthlyIncome - monthlyExpense;

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        account: {
          select: {
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            name: true,
            type: true,
            color: true,
          },
        },
      },
    });

    // Get spending by category (top 5)
    const categorySpending = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 5,
    });

    // Get category details for the top spending categories
    // Filter out null values to avoid Prisma 'in' operator errors
    const categoryIds = categorySpending
      .map((cs) => cs.categoryId)
      .filter((id): id is string => id !== null);
    
    const categories = categoryIds.length > 0 
      ? await prisma.category.findMany({
          where: {
            id: { in: categoryIds },
          },
          select: {
            id: true,
            name: true,
            color: true,
          },
        })
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const topCategories = categorySpending.map((cs) => ({
      category: cs.categoryId ? categoryMap.get(cs.categoryId) : null,
      amount: Number(cs._sum.amount) || 0,
    }));

    // Get total asset values
    const assetAgg = await prisma.asset.aggregate({
      where: { userId },
      _sum: { currentValue: true },
      _count: true,
    });
    const totalAssets = Number(assetAgg._sum.currentValue) || 0;

    // Get total liability balances
    const liabilityAgg = await prisma.liability.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
      _count: true,
    });
    const totalLiabilities = Number(liabilityAgg._sum.currentBalance) || 0;

    // Calculate net worth: account balances + assets - liabilities
    const netWorth = totalBalance + totalAssets - totalLiabilities;

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalBalance,
        totalAssets,
        totalLiabilities,
        netWorth,
        monthlyIncome,
        monthlyExpense,
        netCashFlow,
        savingsRate: monthlyIncome > 0 ? ((netCashFlow / monthlyIncome) * 100).toFixed(2) : 0,
      },
      accounts: accounts.map((acc) => ({
        ...acc,
        balance: balances.get(acc.id) || 0,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      topCategories,
      transactionCounts: {
        income: incomeAgg._count,
        expense: expenseAgg._count,
        total: incomeAgg._count + expenseAgg._count,
      },
    };
  },

  /**
   * Get net worth trend (monthly data for charts)
   */
  async getNetWorthTrend(userId: string, months: number = 6) {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get all user accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const accountIds = accounts.map(a => a.id);
    
    // If no accounts, return empty trend data
    if (accountIds.length === 0) {
      return [];
    }
    
    // Generate array of month-end dates
    const monthlyDates: Date[] = [];
    for (let i = 0; i <= months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 0); // Last day of month
      monthlyDates.push(date);
    }

    // Calculate balances for each month-end
    const trendData = await Promise.all(
      monthlyDates.map(async (date) => {
        const balances = await calculateAccountBalances(accountIds, date);
        const totalBalance = Array.from(balances.values()).reduce((sum, bal) => sum + bal, 0);

        // Get assets created before or on this date
        const assetAgg = await prisma.asset.aggregate({
          where: {
            userId,
            createdAt: { lte: date },
          },
          _sum: { currentValue: true },
        });
        const totalAssets = Number(assetAgg._sum.currentValue) || 0;

        // Get liabilities created before or on this date
        const liabilityAgg = await prisma.liability.aggregate({
          where: {
            userId,
            createdAt: { lte: date },
          },
          _sum: { currentBalance: true },
        });
        const totalLiabilities = Number(liabilityAgg._sum.currentBalance) || 0;

        // Calculate net worth for this date
        const netWorth = totalBalance + totalAssets - totalLiabilities;

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return {
          month: monthKey,
          balance: totalBalance,
          assets: totalAssets,
          liabilities: totalLiabilities,
          netWorth,
        };
      })
    );

    return trendData;
  },

  /**
   * Get income vs expense trend (monthly comparison)
   */
  async getIncomeExpenseTrend(userId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get transactions grouped by month and type
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        amount: true,
        type: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += Number(t.amount);
      } else {
        monthlyData[monthKey].expense += Number(t.amount);
      }
    });

    // Convert to array format
    const trendData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

    return trendData.sort((a, b) => a.month.localeCompare(b.month));
  },
};
