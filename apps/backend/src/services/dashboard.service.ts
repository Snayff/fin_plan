import { prisma } from '../config/database';
import { calculateAccountBalances, endOfDay } from '../utils/balance.utils';

export const dashboardService = {
  /**
   * Get comprehensive dashboard summary
   */
  async getDashboardSummary(householdId: string, options: { startDate?: Date; endDate?: Date } = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = options.startDate || startOfMonth;
    const endDate = options.endDate || endOfMonth;

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { householdId, isActive: true },
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

    // Calculate total cash from account balances
    const totalCash = Array.from(balances.values()).reduce((sum, balance) => sum + balance, 0);

    // Get transaction summary for the period
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          householdId,
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
          householdId,
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
      where: { householdId },
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
        householdId,
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
      where: { householdId },
      _sum: { currentValue: true },
      _count: true,
    });
    const totalAssets = Number(assetAgg._sum.currentValue) || 0;

    // Get total liability balances
    const liabilityAgg = await prisma.liability.aggregate({
      where: { householdId },
      _sum: { currentBalance: true },
      _count: true,
    });
    const totalLiabilities = Number(liabilityAgg._sum.currentBalance) || 0;

    // Calculate net worth consistently: cash + assets - liabilities
    const netWorth = totalCash + totalAssets - totalLiabilities;

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalBalance: totalCash,
        totalCash,
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
  async getNetWorthTrend(householdId: string, months: number = 6) {
    const now = new Date();

    const accounts = await prisma.account.findMany({
      where: { householdId, isActive: true },
      select: { id: true },
    });

    const accountIds = accounts.map(a => a.id);
    if (accountIds.length === 0) return [];

    // Generate month-end dates: `months` past months plus the current month
    // (i.e. months=6 yields 7 data points: 6 completed months + current month-to-date)
    const monthlyDates: Date[] = [];
    for (let i = 0; i <= months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 0);
      monthlyDates.push(date);
    }

    const lastDate = monthlyDates[monthlyDates.length - 1]!;
    const cutoff = endOfDay(lastDate);

    // 3 queries total regardless of how many months are requested
    const [allTransactions, allAssets, allLiabilities] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          date: { lte: cutoff },
        },
        select: { accountId: true, amount: true, type: true, date: true },
      }),
      prisma.asset.findMany({
        where: { householdId },
        select: { currentValue: true, purchaseDate: true, createdAt: true },
      }),
      prisma.liability.findMany({
        where: { householdId },
        select: { currentBalance: true, openDate: true },
      }),
    ]);

    return monthlyDates.map(date => {
      const monthCutoff = endOfDay(date);

      const cash = allTransactions
        .filter(t => t.date <= monthCutoff)
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (t.type === 'income' ? amount : -amount);
        }, 0);

      const totalAssets = allAssets
        .filter(a => (a.purchaseDate ?? a.createdAt) <= monthCutoff)
        .reduce((sum, a) => sum + Number(a.currentValue), 0);

      const totalLiabilities = allLiabilities
        .filter(l => l.openDate <= monthCutoff)
        .reduce((sum, l) => sum + Number(l.currentBalance), 0);

      const netWorth = cash + totalAssets - totalLiabilities;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      return {
        month: monthKey,
        balance: cash,
        cash,
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth,
      };
    });
  },

  /**
   * Get income vs expense trend (monthly comparison)
   */
  async getIncomeExpenseTrend(householdId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    type RawRow = { month: string; type: string; total: string };

    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
        type,
        COALESCE(SUM(amount), 0)::text AS total
      FROM transactions
      WHERE household_id = ${householdId}
        AND type IN ('income', 'expense')
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY DATE_TRUNC('month', date)
    `;

    const monthlyData: Record<string, { income: number; expense: number }> = {};

    for (const row of rows) {
      if (!monthlyData[row.month]) {
        monthlyData[row.month] = { income: 0, expense: 0 };
      }
      const entry = monthlyData[row.month]!;
      const amount = parseFloat(row.total);
      if (row.type === 'income') {
        entry.income = amount;
      } else {
        entry.expense = amount;
      }
    }

    // Note: only months with transactions appear in the result — months with no
    // activity are omitted. Callers should not assume a contiguous date series.
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));
  },
};
