import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

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
        balance: true,
        currency: true,
      },
    });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

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
    const categoryIds = categorySpending.map((cs) => cs.categoryId);
    
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
      category: categoryMap.get(cs.categoryId),
      amount: Number(cs._sum.amount) || 0,
    }));

    // Calculate net worth (simplified - just account balances for now)
    // In future phases, we'll add assets and liabilities
    const netWorth = totalBalance;

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalBalance,
        netWorth,
        monthlyIncome,
        monthlyExpense,
        netCashFlow,
        savingsRate: monthlyIncome > 0 ? ((netCashFlow / monthlyIncome) * 100).toFixed(2) : 0,
      },
      accounts: accounts.map((acc) => ({
        ...acc,
        balance: Number(acc.balance),
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get transactions grouped by month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        amount: true,
        type: true,
      },
    });

    // Get starting balance (sum of all accounts at start date)
    const accountsAtStart = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: { balance: true },
    });

    // Calculate cumulative balance changes
    const monthlyData: { [key: string]: number } = {};
    let runningBalance = accountsAtStart.reduce((sum, acc) => sum + Number(acc.balance), 0);

    // Group transactions by month
    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = runningBalance;
      }

      const change = t.type === 'income' ? Number(t.amount) : -Number(t.amount);
      runningBalance += change;
      monthlyData[monthKey] = runningBalance;
    });

    // Convert to array format for charts
    const trendData = Object.entries(monthlyData).map(([month, balance]) => ({
      month,
      balance,
    }));

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
