import { prisma } from '../config/database';
import { TransactionType, RecurrenceType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import {
  detectOverrides,
  trackOverride,
  syncRecurringRule,
  clearOverrides,
} from './recurring.service';

type UpdateScope = 'this_only' | 'all' | 'all_forward';

export interface CreateTransactionInput {
  accountId: string;
  liabilityId?: string;
  date: Date | string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  name: string;
  description?: string;
  memo?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringRuleId?: string;
  recurrence?: RecurrenceType;
  recurrence_end_date?: Date | string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionInput {
  accountId?: string;
  liabilityId?: string;
  date?: Date | string;
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  name?: string;
  description?: string;
  memo?: string;
  tags?: string[];
  recurrence?: RecurrenceType;
  recurrence_end_date?: Date | string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string[];
}

/**
 * Helper function to convert Decimal fields to numbers in transaction objects
 */
function normalizeTransaction(transaction: any) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
  };
}

export const transactionService = {
  /**
   * Get transactions with filters and pagination
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    options: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' } = {}
  ) {
    const ALLOWED_ORDER_FIELDS = ['date', 'amount', 'name', 'type', 'createdAt'];
    const ALLOWED_ORDER_DIRS = ['asc', 'desc'];

    const {
      limit = 50,
      offset = 0,
      orderBy: rawOrderBy = 'date',
      orderDir: rawOrderDir = 'desc',
    } = options;

    const orderBy = ALLOWED_ORDER_FIELDS.includes(rawOrderBy) ? rawOrderBy : 'date';
    const orderDir = ALLOWED_ORDER_DIRS.includes(rawOrderDir) ? rawOrderDir : 'desc';

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { memo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
        liability: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { [orderBy]: orderDir },
      take: limit,
      skip: offset,
    });

    return {
      transactions: transactions.map(normalizeTransaction),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  },

  /**
   * Get single transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
        liability: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return normalizeTransaction(transaction);
  },

  /**
   * Create a new transaction
   */
  async createTransaction(userId: string, data: CreateTransactionInput) {
    // Validate required fields
    if (!data.accountId) {
      throw new ValidationError('Account is required');
    }

    if (!data.date) {
      throw new ValidationError('Date is required');
    }

    if (data.amount === undefined || data.amount === null) {
      throw new ValidationError('Amount is required');
    }

    if (!data.type) {
      throw new ValidationError('Transaction type is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Transaction name is required');
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Verify category exists if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Verify liability exists if provided
    if (data.liabilityId) {
      if (data.type !== 'expense') {
        throw new ValidationError('Liability can only be linked to expense transactions');
      }

      const liability = await prisma.liability.findFirst({
        where: { id: data.liabilityId, userId },
      });

      if (!liability) {
        throw new NotFoundError('Liability not found');
      }
    }

    // Verify subcategory if provided
    if (data.subcategoryId) {
      const subcategory = await prisma.category.findUnique({
        where: { id: data.subcategoryId },
      });

      if (!subcategory) {
        throw new NotFoundError('Subcategory not found');
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        liabilityId: data.liabilityId || null,
        date: new Date(data.date),
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        memo: data.memo?.trim() || null,
        tags: data.tags || [],
        isRecurring: data.isRecurring || false,
        recurringRuleId: data.recurringRuleId || null,
        recurrence: data.recurrence || 'none',
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date) : null,
        metadata: data.metadata || {},
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
        liability: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return normalizeTransaction(transaction);
  },

  /**
   * Update a transaction with optional recurring rule sync
   * @param updateScope - How to handle updates for generated transactions:
   *   - 'this_only': Override this transaction only (default for generated)
   *   - 'all': Update recurring rule and sync ALL transactions
   *   - 'all_forward': Update recurring rule and sync from this date forward
   */
  async updateTransaction(
    transactionId: string,
    userId: string,
    data: UpdateTransactionInput,
    updateScope?: UpdateScope
  ) {
    // Get existing transaction with recurring rule
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { recurringRule: true },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    // Validate fields if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Transaction name cannot be empty');
    }

    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, userId },
      });

      if (!account) {
        throw new NotFoundError('Account not found');
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const resultingType = data.type ?? existing.type;
    const resultingLiabilityId =
      data.liabilityId === undefined
        ? existing.liabilityId
        : data.liabilityId || null;

    if (resultingLiabilityId) {
      if (resultingType !== 'expense') {
        throw new ValidationError(
          'Liability can only be linked to expense transactions'
        );
      }

      const liability = await prisma.liability.findFirst({
        where: { id: resultingLiabilityId, userId },
      });

      if (!liability) {
        throw new NotFoundError('Liability not found');
      }
    }

    if (data.subcategoryId) {
      const subcategory = await prisma.category.findUnique({
        where: { id: data.subcategoryId },
      });

      if (!subcategory) {
        throw new NotFoundError('Subcategory not found');
      }
    }

    // Build update data
    const updateData: any = {};
    if (data.accountId !== undefined) updateData.accountId = data.accountId;
    if (data.liabilityId !== undefined)
      updateData.liabilityId = data.liabilityId || null;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.categoryId !== undefined)
      updateData.categoryId = data.categoryId || null;
    if (data.subcategoryId !== undefined)
      updateData.subcategoryId = data.subcategoryId || null;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || null;
    if (data.memo !== undefined) updateData.memo = data.memo?.trim() || null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.recurrence !== undefined)
      updateData.recurrence = data.recurrence;
    if (data.recurrence_end_date !== undefined)
      updateData.recurrence_end_date = data.recurrence_end_date
        ? new Date(data.recurrence_end_date)
        : null;
    if (data.metadata !== undefined) {
      const existingMeta = (existing.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    // Handle recurring transaction updates
    if (existing.isGenerated && existing.recurringRuleId && updateScope) {
      const recurringRule = existing.recurringRule!;

      if (updateScope === 'this_only') {
        // Track overrides for this transaction only
        const overriddenFields = await detectOverrides(transactionId, updateData);

        for (const field of overriddenFields) {
          const originalValue = (recurringRule.templateTransaction as any)[field];
          const newValue = updateData[field];
          await trackOverride(transactionId, field, originalValue, newValue);
        }

        // Update only this transaction
        const transaction = await prisma.transaction.update({
          where: { id: transactionId },
          data: updateData,
          include: {
            account: { select: { id: true, name: true, type: true } },
            category: {
              select: { id: true, name: true, type: true, color: true },
            },
            liability: { select: { id: true, name: true, type: true } },
            subcategory: { select: { id: true, name: true, color: true } },
          },
        });

        return normalizeTransaction(transaction);
      } else if (updateScope === 'all') {
        // Update recurring rule template and sync ALL transactions
        const templateUpdates: any = {};
        if (data.amount !== undefined) templateUpdates.amount = data.amount;
        if (data.categoryId !== undefined) templateUpdates.categoryId = data.categoryId;
        if (data.subcategoryId !== undefined) templateUpdates.subcategoryId = data.subcategoryId;
        if (data.description !== undefined) templateUpdates.description = data.description;
        if (data.memo !== undefined) templateUpdates.memo = data.memo;
        if (data.tags !== undefined) templateUpdates.tags = data.tags;
        if (data.liabilityId !== undefined) templateUpdates.liabilityId = data.liabilityId;
        if (data.name !== undefined) templateUpdates.name = data.name;

        // Update recurring rule template
        const currentTemplate = recurringRule.templateTransaction as any;
        const newTemplate = { ...currentTemplate, ...templateUpdates };

        await prisma.recurringRule.update({
          where: { id: recurringRule.id },
          data: {
            templateTransaction: newTemplate,
            version: recurringRule.version + 1,
          },
        });

        // Clear all overrides
        await clearOverrides(recurringRule.id, 'all');

        // Sync all transactions
        await syncRecurringRule(recurringRule.id, templateUpdates, 'all');

        // Return updated transaction
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: {
            account: { select: { id: true, name: true, type: true } },
            category: {
              select: { id: true, name: true, type: true, color: true },
            },
            liability: { select: { id: true, name: true, type: true } },
            subcategory: { select: { id: true, name: true, color: true } },
          },
        });

        return normalizeTransaction(transaction!);
      } else if (updateScope === 'all_forward') {
        // Update recurring rule template and sync from this date forward
        const templateUpdates: any = {};
        if (data.amount !== undefined) templateUpdates.amount = data.amount;
        if (data.categoryId !== undefined) templateUpdates.categoryId = data.categoryId;
        if (data.subcategoryId !== undefined) templateUpdates.subcategoryId = data.subcategoryId;
        if (data.description !== undefined) templateUpdates.description = data.description;
        if (data.memo !== undefined) templateUpdates.memo = data.memo;
        if (data.tags !== undefined) templateUpdates.tags = data.tags;
        if (data.liabilityId !== undefined) templateUpdates.liabilityId = data.liabilityId;
        if (data.name !== undefined) templateUpdates.name = data.name;

        // Update recurring rule template
        const currentTemplate = recurringRule.templateTransaction as any;
        const newTemplate = { ...currentTemplate, ...templateUpdates };

        await prisma.recurringRule.update({
          where: { id: recurringRule.id },
          data: {
            templateTransaction: newTemplate,
            version: recurringRule.version + 1,
          },
        });

        // Clear overrides from this date forward
        await clearOverrides(recurringRule.id, 'from_date', existing.date);

        // Sync transactions from this date forward
        await syncRecurringRule(
          recurringRule.id,
          templateUpdates,
          'from_date',
          existing.date
        );

        // Return updated transaction
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: {
            account: { select: { id: true, name: true, type: true } },
            category: {
              select: { id: true, name: true, type: true, color: true },
            },
            liability: { select: { id: true, name: true, type: true } },
            subcategory: { select: { id: true, name: true, color: true } },
          },
        });

        return normalizeTransaction(transaction!);
      }
    }

    // Normal update (non-recurring or no updateScope specified)
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: {
          select: { id: true, name: true, type: true, color: true },
        },
        liability: { select: { id: true, name: true, type: true } },
        subcategory: { select: { id: true, name: true, color: true } },
      },
    });

    return normalizeTransaction(transaction);
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string, userId: string) {
    // Get transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return { message: 'Transaction deleted successfully' };
  },

  /**
   * Get transaction summary (totals by type)
   */
  async getTransactionSummary(userId: string, filters: TransactionFilters = {}) {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [income, expense, totalCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      income: {
        total: Number(income._sum.amount) || 0,
        count: income._count,
      },
      expense: {
        total: Number(expense._sum.amount) || 0,
        count: expense._count,
      },
      netCashFlow: (Number(income._sum.amount) || 0) - (Number(expense._sum.amount) || 0),
      totalTransactions: totalCount,
    };
  },
};
