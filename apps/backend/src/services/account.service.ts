import { prisma } from '../config/database';
import { AccountType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype?: string;
  balance: number;
  currency: string;
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
  balance?: number;
  currency?: string;
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
   * Get all accounts for a user
   */
  async getUserAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    return accounts;
  },

  /**
   * Get a single account by ID
   */
  async getAccountById(accountId: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  },

  /**
   * Create a new account
   */
  async createAccount(userId: string, data: CreateAccountInput) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Account name is required');
    }

    if (!data.type) {
      throw new ValidationError('Account type is required');
    }

    if (data.balance === undefined || data.balance === null) {
      throw new ValidationError('Account balance is required');
    }

    if (!data.currency || data.currency.trim().length === 0) {
      throw new ValidationError('Currency is required');
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type,
        subtype: data.subtype?.trim() || null,
        balance: data.balance,
        currency: data.currency.toUpperCase(),
        metadata: data.metadata || {},
        isActive: true,
      },
    });

    return account;
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
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.currency !== undefined) updateData.currency = data.currency.toUpperCase();
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

    return account;
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
      account,
      transactionCount: account._count.transactions,
      recentTransactions,
    };
  },
};
