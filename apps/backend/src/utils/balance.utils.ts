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
