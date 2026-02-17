import { prisma } from '../config/database';
import { RecurringFrequency, Prisma } from '@prisma/client';
import { RRule, Frequency } from 'rrule';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Recurring Transaction Service
 *
 * Handles on-demand generation, override tracking, and syncing of recurring transactions.
 *
 * Key concepts:
 * - Historical transactions (≤ today): Persisted in database, editable
 * - Forecast transactions (> today): Generated on-demand, cached, read-only
 * - Overrides: Track field-level changes to individual transactions
 * - Sync: Update all non-overridden transactions when RecurringRule changes
 */

// ========================================
// Types & Interfaces
// ========================================

interface TemplateTransaction {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  description?: string | null;
  memo?: string | null;
  tags?: string[];
  liabilityId?: string | null;
  metadata?: Record<string, any>;
}

export interface CreateRecurringRuleInput {
  frequency: RecurringFrequency;
  interval?: number;
  startDate: Date | string;
  endDate?: Date | string | null;
  occurrences?: number | null;
  isActive?: boolean;
  templateTransaction: TemplateTransaction;
}

export interface UpdateRecurringRuleInput {
  frequency?: RecurringFrequency;
  interval?: number;
  startDate?: Date | string;
  endDate?: Date | string | null;
  occurrences?: number | null;
  isActive?: boolean;
  templateTransaction?: TemplateTransaction;
}

export type UpdateScope = 'this_only' | 'all' | 'all_forward';

// Overridable fields that can be changed on individual transactions
const OVERRIDABLE_FIELDS = ['amount', 'date', 'categoryId', 'subcategoryId', 'description', 'memo', 'tags', 'liabilityId'];

// ========================================
// Frequency Mapping
// ========================================

/**
 * Map Prisma RecurringFrequency enum to rrule Frequency
 */
function mapFrequencyToRRule(frequency: RecurringFrequency): Frequency {
  const mapping: Record<RecurringFrequency, Frequency> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    biweekly: RRule.WEEKLY, // Handle via interval
    monthly: RRule.MONTHLY,
    quarterly: RRule.MONTHLY, // Handle via interval
    annually: RRule.YEARLY,
    custom: RRule.DAILY, // Default, customize with interval
  };
  return mapping[frequency];
}

/**
 * Get interval for frequency
 */
function getInterval(frequency: RecurringFrequency, interval: number = 1): number {
  if (frequency === 'biweekly') return 2;
  if (frequency === 'quarterly') return 3;
  return interval;
}

// ========================================
// Date Generation
// ========================================

/**
 * Generate occurrence dates using rrule library
 */
export function generateOccurrences(
  frequency: RecurringFrequency,
  interval: number,
  startDate: Date,
  endDate: Date | null,
  occurrences: number | null
): Date[] {
  const rruleFreq = mapFrequencyToRRule(frequency);
  const actualInterval = getInterval(frequency, interval);

  // Build rrule options
  const options: any = {
    freq: rruleFreq,
    interval: actualInterval,
    dtstart: new Date(startDate),
  };

  // Set either endDate or occurrences count (not both)
  if (occurrences) {
    options.count = occurrences;
  } else if (endDate) {
    options.until = new Date(endDate);
  } else {
    // Default: generate for 1 year
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    options.until = oneYearFromNow;
  }

  const rule = new RRule(options);
  return rule.all();
}

// ========================================
// Transaction Generation
// ========================================

/**
 * Generate transaction objects from recurring rule within date range
 * Does NOT persist to database - returns plain objects
 */
export async function generateTransactions(
  recurringRuleId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<Prisma.TransactionCreateInput>[]> {
  const rule = await prisma.recurringRule.findUnique({
    where: { id: recurringRuleId },
  });

  if (!rule) {
    throw new NotFoundError('Recurring rule not found');
  }

  if (!rule.isActive) {
    return [];
  }

  // Generate all occurrence dates
  const occurrences = generateOccurrences(
    rule.frequency,
    rule.interval,
    rule.startDate,
    rule.endDate,
    rule.occurrences
  );

  // Filter to date range
  const filtered = occurrences.filter(
    (date) => date >= startDate && date <= endDate
  );

  // Parse template
  const template = rule.templateTransaction as unknown as TemplateTransaction;

  // Create transaction objects
  const transactions = filtered.map((date) => ({
    userId: rule.userId,
    accountId: template.accountId,
    type: template.type,
    amount: template.amount,
    name: template.name,
    date: date,
    categoryId: template.categoryId || null,
    subcategoryId: template.subcategoryId || null,
    description: template.description || null,
    memo: template.memo || null,
    tags: template.tags || [],
    liabilityId: template.liabilityId || null,
    metadata: template.metadata || {},
    recurringRuleId: rule.id,
    isGenerated: true,
    isRecurring: true,
    overriddenFields: [],
    generatedAt: new Date(),
  }));

  return transactions;
}

/**
 * Materialize historical transactions (≤ today) into database
 * Skips dates that already have generated transactions
 */
export async function materializeHistoricalTransactions(
  recurringRuleId: string
): Promise<number> {
  const rule = await prisma.recurringRule.findUnique({
    where: { id: recurringRuleId },
  });

  if (!rule) {
    throw new NotFoundError('Recurring rule not found');
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  // Get existing generated transactions
  const existing = await prisma.transaction.findMany({
    where: {
      recurringRuleId: rule.id,
      isGenerated: true,
      date: { lte: today },
    },
    select: { date: true },
  });

  const existingDates = new Set(existing.map((t) => t.date.toISOString()));

  // Generate transactions from rule start to today
  const transactions = await generateTransactions(
    rule.id,
    rule.startDate,
    today
  );

  // Filter out dates that already exist
  const toCreate = transactions.filter(
    (t) => !existingDates.has(new Date(t.date!).toISOString())
  );

  if (toCreate.length === 0) {
    return 0;
  }

  // Create transactions
  await prisma.transaction.createMany({
    data: toCreate as any,
    skipDuplicates: true,
  });

  // Update lastGeneratedDate
  await prisma.recurringRule.update({
    where: { id: rule.id },
    data: { lastGeneratedDate: today },
  });

  return toCreate.length;
}

/**
 * Get forecast transactions (> today)
 * Generated on-demand, not persisted
 */
export async function getForecastTransactions(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const forecastStart = startDate && startDate > today ? startDate : new Date(today.getTime() + 1);

  // Default: forecast until 1 year from today
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
  const forecastEnd = endDate || defaultEndDate;

  // Get all active recurring rules for user
  const rules = await prisma.recurringRule.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  // Generate transactions for each rule
  const allTransactions: any[] = [];
  for (const rule of rules) {
    // Determine rule-specific end date
    let ruleEndDate = forecastEnd;
    if (rule.endDate && rule.endDate < forecastEnd) {
      ruleEndDate = rule.endDate;
    }

    const transactions = await generateTransactions(
      rule.id,
      forecastStart,
      ruleEndDate
    );

    allTransactions.push(...transactions);
  }

  return allTransactions;
}

// ========================================
// Override Tracking
// ========================================

/**
 * Track override when a generated transaction is edited
 */
export async function trackOverride(
  transactionId: string,
  fieldName: string,
  originalValue: any,
  newValue: any
): Promise<void> {
  // Add field to overriddenFields array if not already present
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { overriddenFields: true },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  const overriddenFields = transaction.overriddenFields || [];
  if (!overriddenFields.includes(fieldName)) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        overriddenFields: [...overriddenFields, fieldName],
      },
    });
  }

  // Store detailed override
  await prisma.transactionOverride.upsert({
    where: {
      transactionId_fieldName: {
        transactionId,
        fieldName,
      },
    },
    update: {
      overriddenValue: newValue,
    },
    create: {
      transactionId,
      fieldName,
      originalValue,
      overriddenValue: newValue,
    },
  });
}

/**
 * Determine which fields were overridden by comparing with template
 */
export async function detectOverrides(
  transactionId: string,
  updates: Record<string, any>
): Promise<string[]> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { recurringRule: true },
  });

  if (!transaction || !transaction.recurringRule) {
    return [];
  }

  const template = transaction.recurringRule.templateTransaction as unknown as TemplateTransaction;
  const overriddenFields: string[] = [];

  for (const field of OVERRIDABLE_FIELDS) {
    if (field in updates) {
      const templateValue = (template as any)[field];
      const newValue = updates[field];

      // Compare values (handle nulls and undefined)
      if (JSON.stringify(templateValue) !== JSON.stringify(newValue)) {
        overriddenFields.push(field);
      }
    }
  }

  return overriddenFields;
}

// ========================================
// Sync Logic
// ========================================

/**
 * Sync recurring transactions when RecurringRule is updated
 * Respects field-level overrides
 */
export async function syncRecurringRule(
  recurringRuleId: string,
  templateUpdates: Partial<TemplateTransaction>,
  scope: 'all' | 'from_date' = 'all',
  fromDate?: Date
): Promise<number> {
  const rule = await prisma.recurringRule.findUnique({
    where: { id: recurringRuleId },
  });

  if (!rule) {
    throw new NotFoundError('Recurring rule not found');
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    recurringRuleId: rule.id,
    isGenerated: true,
    date: { lte: today }, // Only sync historical transactions
  };

  if (scope === 'from_date' && fromDate) {
    where.date = { gte: fromDate, lte: today };
  }

  // Fetch all transactions to sync
  const transactions = await prisma.transaction.findMany({
    where,
  });

  let syncCount = 0;

  for (const transaction of transactions) {
    const overriddenFields = new Set(transaction.overriddenFields);
    const fieldsToUpdate: Record<string, any> = {};

    // Only update fields that haven't been overridden
    for (const [field, value] of Object.entries(templateUpdates)) {
      if (OVERRIDABLE_FIELDS.includes(field) && !overriddenFields.has(field)) {
        fieldsToUpdate[field] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: fieldsToUpdate,
      });
      syncCount++;
    }
  }

  return syncCount;
}

/**
 * Clear overrides on transactions
 * Used when applying "all transactions" update scope
 */
export async function clearOverrides(
  recurringRuleId: string,
  scope: 'all' | 'from_date' = 'all',
  fromDate?: Date
): Promise<void> {
  const where: Prisma.TransactionWhereInput = {
    recurringRuleId,
    isGenerated: true,
  };

  if (scope === 'from_date' && fromDate) {
    where.date = { gte: fromDate };
  }

  // Clear overriddenFields array
  await prisma.transaction.updateMany({
    where,
    data: { overriddenFields: [] },
  });

  // Delete override records
  const transactions = await prisma.transaction.findMany({
    where,
    select: { id: true },
  });

  const transactionIds = transactions.map((t) => t.id);

  await prisma.transactionOverride.deleteMany({
    where: {
      transactionId: { in: transactionIds },
    },
  });
}

// ========================================
// CRUD Operations
// ========================================

export const recurringService = {
  /**
   * Create a new recurring rule and materialize historical transactions
   */
  async createRecurringRule(userId: string, data: CreateRecurringRuleInput) {
    // Validate template
    if (!data.templateTransaction.accountId) {
      throw new ValidationError('Template transaction must have an accountId');
    }

    // Create recurring rule
    const rule = await prisma.recurringRule.create({
      data: {
        userId,
        frequency: data.frequency,
        interval: data.interval || 1,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        occurrences: data.occurrences || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        templateTransaction: data.templateTransaction as any,
        version: 1,
      },
    });

    // Materialize historical transactions
    await materializeHistoricalTransactions(rule.id);

    return rule;
  },

  /**
   * Get all recurring rules for a user
   */
  async getRecurringRules(userId: string) {
    return await prisma.recurringRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get a single recurring rule
   */
  async getRecurringRuleById(ruleId: string, userId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundError('Recurring rule not found');
    }

    return rule;
  },

  /**
   * Update a recurring rule and sync transactions
   */
  async updateRecurringRule(
    ruleId: string,
    userId: string,
    data: UpdateRecurringRuleInput
  ) {
    const existing = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Recurring rule not found');
    }

    // Build update data
    const updateData: any = {
      version: existing.version + 1,
    };

    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.occurrences !== undefined) updateData.occurrences = data.occurrences;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.templateTransaction !== undefined) {
      updateData.templateTransaction = data.templateTransaction;
    }

    // Update rule
    const updated = await prisma.recurringRule.update({
      where: { id: ruleId },
      data: updateData,
    });

    // Sync transactions if template changed
    if (data.templateTransaction) {
      await syncRecurringRule(ruleId, data.templateTransaction);
    }

    // If frequency/dates changed, regenerate future transactions
    if (data.frequency || data.startDate || data.endDate || data.occurrences) {
      // For now, we'll materialize on next query
      // Could implement eager regeneration here
    }

    return updated;
  },

  /**
   * Delete a recurring rule (keeps generated transactions)
   */
  async deleteRecurringRule(ruleId: string, userId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundError('Recurring rule not found');
    }

    // Delete the rule
    // Generated transactions will have recurringRuleId set to null via CASCADE
    await prisma.recurringRule.delete({
      where: { id: ruleId },
    });

    return { message: 'Recurring rule deleted successfully' };
  },

  /**
   * Preview generated dates for a recurring rule (without persisting)
   */
  async previewOccurrences(
    frequency: RecurringFrequency,
    interval: number,
    startDate: Date | string,
    endDate: Date | string | null,
    occurrences: number | null,
    limit: number = 10
  ): Promise<Date[]> {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    // Generate occurrences
    const dates = generateOccurrences(frequency, interval, start, end, occurrences);

    // Return first N dates
    return dates.slice(0, limit);
  },

  /**
   * Materialize today's transactions for all active recurring rules
   * Should be called on first query of the day
   */
  async materializeAllToday(userId: string): Promise<number> {
    const rules = await prisma.recurringRule.findMany({
      where: { userId, isActive: true },
    });

    let totalCreated = 0;
    for (const rule of rules) {
      const created = await materializeHistoricalTransactions(rule.id);
      totalCreated += created;
    }

    return totalCreated;
  },

  // Export helper functions for use in transaction service
  generateTransactions,
  materializeHistoricalTransactions,
  getForecastTransactions,
  trackOverride,
  detectOverrides,
  syncRecurringRule,
  clearOverrides,
};
