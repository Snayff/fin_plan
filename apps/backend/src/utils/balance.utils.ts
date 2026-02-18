import { prisma } from '../config/database';

/**
 * Normalize date to end of day (23:59:59.999)
 * This ensures that when we calculate balance "as of" a date,
 * we include all transactions on that date
 */
export function endOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

/**
 * Calculate account balance up to end of specified date
 * Balance = Sum of all income transactions - Sum of all expense transactions
 * up to and including the specified date
 * 
 * @param accountId - Account to calculate balance for
 * @param asOfDate - Calculate balance up to this date (inclusive, end of day)
 * @returns Calculated balance
 */
export async function calculateAccountBalance(
  accountId: string,
  asOfDate: Date = new Date()
): Promise<number> {
  const cutoffDate = endOfDay(asOfDate);

  const [incomeSum, expenseSum] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        accountId,
        type: 'income',
        date: { lte: cutoffDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        accountId,
        type: 'expense',
        date: { lte: cutoffDate },
      },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(incomeSum._sum.amount) || 0;
  const expense = Number(expenseSum._sum.amount) || 0;
  
  return income - expense;
}

/**
 * Calculate balances for multiple accounts efficiently
 * 
 * @param accountIds - Array of account IDs to calculate balances for
 * @param asOfDate - Calculate balances up to this date (inclusive, end of day)
 * @returns Map of accountId to calculated balance
 */
export async function calculateAccountBalances(
  accountIds: string[],
  asOfDate: Date = new Date()
): Promise<Map<string, number>> {
  if (accountIds.length === 0) {
    return new Map();
  }

  const cutoffDate = endOfDay(asOfDate);

  // Get all transactions for these accounts up to the cutoff date
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { lte: cutoffDate },
    },
    select: {
      accountId: true,
      amount: true,
      type: true,
    },
  });

  // Calculate balances for each account
  const balances = new Map<string, number>();
  
  // Initialize all accounts with 0 balance
  accountIds.forEach(id => balances.set(id, 0));

  // Sum up transactions
  transactions.forEach(transaction => {
    const currentBalance = balances.get(transaction.accountId) || 0;
    const amount = Number(transaction.amount);
    const change = transaction.type === 'income' ? amount : -amount;
    balances.set(transaction.accountId, currentBalance + change);
  });

  return balances;
}

/**
 * Calculate historical balance snapshots for an account at weekly intervals
 * 
 * @param accountId - Account to calculate balance history for
 * @param daysBack - Number of days to look back (default 90)
 * @returns Array of balance snapshots with date and balance
 */
export async function calculateAccountBalanceHistory(
  accountId: string,
  daysBack: number = 90
): Promise<Array<{ date: Date; balance: number }>> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);

  // Calculate weekly snapshots
  const snapshots: Array<{ date: Date; balance: number }> = [];
  const weeksBack = Math.ceil(daysBack / 7);

  for (let i = weeksBack; i >= 0; i--) {
    const snapshotDate = new Date(now);
    snapshotDate.setDate(snapshotDate.getDate() - (i * 7));
    
    const balance = await calculateAccountBalance(accountId, snapshotDate);
    snapshots.push({
      date: snapshotDate,
      balance,
    });
  }

  return snapshots;
}

/**
 * Calculate account flow (income and expenses) for a date range
 * 
 * @param accountId - Account to calculate flow for
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Object with income and expense totals
 */
export async function calculateAccountFlow(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<{ income: number; expense: number }> {
  const cutoffStart = new Date(startDate);
  cutoffStart.setHours(0, 0, 0, 0);
  
  const cutoffEnd = endOfDay(endDate);

  const [incomeSum, expenseSum] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        accountId,
        type: 'income',
        date: { gte: cutoffStart, lte: cutoffEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        accountId,
        type: 'expense',
        date: { gte: cutoffStart, lte: cutoffEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    income: Number(incomeSum._sum.amount) || 0,
    expense: Number(expenseSum._sum.amount) || 0,
  };
}

/**
 * Calculate monthly flow for multiple accounts efficiently
 * 
 * @param accountIds - Array of account IDs
 * @param startDate - Start of month
 * @param endDate - End of month
 * @returns Map of accountId to flow data
 */
export async function calculateAccountsMonthlyFlow(
  accountIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Map<string, { income: number; expense: number }>> {
  if (accountIds.length === 0) {
    return new Map();
  }

  const cutoffStart = new Date(startDate);
  cutoffStart.setHours(0, 0, 0, 0);
  
  const cutoffEnd = endOfDay(endDate);

  // Get all transactions for these accounts in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: cutoffStart, lte: cutoffEnd },
    },
    select: {
      accountId: true,
      amount: true,
      type: true,
    },
  });

  // Calculate flow for each account
  const flows = new Map<string, { income: number; expense: number }>();
  
  // Initialize all accounts with 0 flow
  accountIds.forEach(id => flows.set(id, { income: 0, expense: 0 }));

  // Sum up transactions by type
  transactions.forEach(transaction => {
    const currentFlow = flows.get(transaction.accountId)!;
    const amount = Number(transaction.amount);
    
    if (transaction.type === 'income') {
      currentFlow.income += amount;
    } else {
      currentFlow.expense += amount;
    }
  });

  return flows;
}

/**
 * Calculate balance history for multiple accounts efficiently
 * Returns weekly snapshots over the specified period, starting from account creation or daysBack, whichever is later
 * 
 * @param accountIds - Array of account IDs
 * @param accountCreationDates - Map of accountId to creation date
 * @param daysBack - Number of days to look back (default 90)
 * @returns Map of accountId to array of balance snapshots
 */
export async function calculateAccountsBalanceHistory(
  accountIds: string[],
  accountCreationDates: Map<string, Date>,
  daysBack: number = 90
): Promise<Map<string, Array<{ date: Date; balance: number }>>> {
  if (accountIds.length === 0) {
    return new Map();
  }

  const now = new Date();
  const defaultStartDate = new Date(now);
  defaultStartDate.setDate(defaultStartDate.getDate() - daysBack);

  // Initialize result map
  const historiesMap = new Map<string, Array<{ date: Date; balance: number }>>();
  accountIds.forEach(id => historiesMap.set(id, []));

  // Calculate history for each account individually (since they may have different start dates)
  for (const accountId of accountIds) {
    const creationDate = accountCreationDates.get(accountId);
    if (!creationDate) continue;

    // Use the later of: account creation date or 90 days ago
    const startDate = creationDate > defaultStartDate ? creationDate : defaultStartDate;
    
    // Calculate how many weeks from start date to now
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksBack = Math.ceil(daysDiff / 7);

    // Generate snapshot dates (weekly) for this account
    const snapshotDates: Date[] = [];
    for (let i = weeksBack; i >= 0; i--) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(snapshotDate.getDate() - (i * 7));
      
      // Only include dates on or after the start date
      if (snapshotDate >= startDate) {
        snapshotDates.push(snapshotDate);
      }
    }

    // Calculate balance at each snapshot date for this account
    for (const snapshotDate of snapshotDates) {
      const balance = await calculateAccountBalance(accountId, snapshotDate);
      historiesMap.get(accountId)!.push({
        date: snapshotDate,
        balance,
      });
    }
  }

  return historiesMap;
}
