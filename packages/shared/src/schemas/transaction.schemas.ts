import { z } from 'zod';

/**
 * Enums matching Prisma schema
 */
export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer']);
export const RecurrenceTypeEnum = z.enum(['none', 'weekly', 'monthly', 'yearly']);

/**
 * Base transaction schema for creation
 */
export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  date: z.string().or(z.date()),
  amount: z.number().positive('Amount must be positive'),
  type: TransactionTypeEnum,
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  name: z.string().min(1, 'Transaction name is required'),
  description: z.string().optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringRuleId: z.string().uuid('Invalid recurring rule ID').optional(),
  recurrence: RecurrenceTypeEnum.optional(),
  recurrence_end_date: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for updating transactions
 */
export const updateTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID').optional(),
  date: z.string().or(z.date()).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  type: TransactionTypeEnum.optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  name: z.string().min(1, 'Transaction name cannot be empty').optional(),
  description: z.string().optional(),
  memo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: RecurrenceTypeEnum.optional(),
  recurrence_end_date: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type exports
 */
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type RecurrenceType = z.infer<typeof RecurrenceTypeEnum>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
