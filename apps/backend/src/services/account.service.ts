import { prisma } from '../config/database';
import { AccountType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { 
  calculateAccountBalance, 
  calculateAccountBalances,
  calculateAccountsBalanceHistory,
  calculateAccountsMonthlyFlow
} from '../utils/balance.utils';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype?: string;
  openingBalance?: number;
  currency: string;
  description?: string;
  metadata?: {
    institution?: string;
    accountNumber?: string;
    interestRate?: number;
    creditLimit?: number;
  };
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  subtype?: string;
  currency?: string;
  description?: string;
  isActive?: boolean;
  metadata?: {
    institution?: string;
    accountNumber?: string;
    interestRate?: number;
    creditLimit?: number;
  };
}

export const accountService = {
  /**
   * Get all accounts for a user with balance calculated to current date
   */
  async getUserAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate balances efficiently for all accounts
    const accountIds = accounts.map(a => a.id);
    const balances = await calculateAccountBalances(accountIds);

    // Attach calculated balances to accounts
    const accountsWithBalance = accounts.map(account => ({
      ...account,
      balance: balances.get(account.id) || 0,
    }));

    return accountsWithBalance;
  },

  /**
   * Get all accounts for a user with enhanced data:
   * - Current balance
   * - Balance history (weekly snapshots over 90 days)
   * - Monthly flow (income and expense for current month)
   */
  async getUserAccountsWithEnhancedData(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    if (accounts.length === 0) {
      return [];
    }

    const accountIds = accounts.map(a => a.id);

    // Create a map of account IDs to creation dates
    const accountCreationDates = new Map<string, Date>();
    accounts.forEach(account => {
      accountCreationDates.set(account.id, account.createdAt);
    });

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all data in parallel for efficiency
    const [balances, balanceHistories, monthlyFlows] = await Promise.all([
      calculateAccountBalances(accountIds),
      calculateAccountsBalanceHistory(accountIds, accountCreationDates, 90),
      calculateAccountsMonthlyFlow(accountIds, startOfMonth, endOfMonth),
    ]);

    // Combine all data
    const enhancedAccounts = accounts.map(account => {
      const history = balanceHistories.get(account.id) || [];
      const flow = monthlyFlows.get(account.id) || { income: 0, expense: 0 };

      return {
        ...account,
        balance: balances.get(account.id) || 0,
        balanceHistory: history.map(snapshot => ({
          date: snapshot.date.toISOString(),
          balance: snapshot.balance,
        })),
        monthlyFlow: {
          income: flow.income,
          expense: flow.expense,
        },
      };
    });

    return enhancedAccounts;
  },

  /**
   * Get a single account by ID with calculated balance
   */
  async getAccountById(accountId: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Calculate current balance
    const balance = await calculateAccountBalance(accountId);

    return {
      ...account,
      balance,
    };
  },

  /**
   * Create a new account with optional opening balance
   */
  async createAccount(userId: string, data: CreateAccountInput) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Account name is required');
    }

    if (!data.type) {
      throw new ValidationError('Account type is required');
    }

    if (!data.currency || data.currency.trim().length === 0) {
      throw new ValidationError('Currency is required');
    }

    const openingBalance = data.openingBalance ?? 0;

    // Get or create "Opening Balance" category
    let openingBalanceCategory = await prisma.category.findFirst({
      where: {
        userId: null, // System category
        name: 'Opening Balance',
        isSystemCategory: true,
      },
    });

    if (!openingBalanceCategory) {
      // Create system category for opening balances
      openingBalanceCategory = await prisma.category.create({
        data: {
          name: 'Opening Balance',
          type: 'income', // Default, but will vary per transaction
          isSystemCategory: true,
          userId: null,
        },
      });
    }

    // Create account and opening balance transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.account.create({
        data: {
          userId,
          name: data.name.trim(),
          type: data.type,
          subtype: data.subtype?.trim() || null,
          currency: data.currency.toUpperCase(),
          description: data.description?.trim() || null,
          metadata: data.metadata || {},
          isActive: true,
        },
      });

      // Create opening balance transaction if non-zero
      if (openingBalance !== 0) {
        await tx.transaction.create({
          data: {
            userId,
            accountId: account.id,
            date: account.createdAt,
            amount: Math.abs(openingBalance),
            type: openingBalance >= 0 ? 'income' : 'expense',
            name: 'Opening Balance',
            categoryId: openingBalanceCategory!.id,
            metadata: {
              isSystemTransaction: true,
              transactionType: 'opening_balance',
            },
          },
        });
      }

      return account;
    });

    // Return account with calculated balance
    const balance = await calculateAccountBalance(result.id);
    return {
      ...result,
      balance,
    };
  },

  /**
   * Update an account
   */
  async updateAccount(accountId: string, userId: string, data: UpdateAccountInput) {
    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!existingAccount) {
      throw new NotFoundError('Account not found');
    }

    // Validate fields if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Account name cannot be empty');
    }

    if (data.currency !== undefined && data.currency.trim().length === 0) {
      throw new ValidationError('Currency cannot be empty');
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.subtype !== undefined) updateData.subtype = data.subtype?.trim() || null;
    if (data.currency !== undefined) updateData.currency = data.currency.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) {
      // Merge existing metadata with new metadata
      const existingMeta = (existingAccount.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    // Update account
    const account = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });

    // Return account with calculated balance
    const balance = await calculateAccountBalance(accountId);
    return {
      ...account,
      balance,
    };
  },

  /**
   * Delete an account (soft delete by setting isActive to false)
   */
  async deleteAccount(accountId: string, userId: string) {
    // Check if account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId },
    });

    if (transactionCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.account.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      return { message: 'Account deactivated (has transactions)', soft: true };
    }

    // Hard delete if no transactions
    await prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted', soft: false };
  },

  /**
   * Get account summary (balance, transaction count, etc.)
   */
  async getAccountSummary(accountId: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Calculate current balance
    const balance = await calculateAccountBalance(accountId);

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
      },
    });

    return {
      account: {
        ...account,
        balance,
      },
      transactionCount: account._count.transactions,
      recentTransactions,
    };
  },
};
