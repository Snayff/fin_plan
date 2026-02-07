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
  accountId: z.string().min(1, 'Account is required').uuid('Invalid account ID'),
  date: z.string().min(1, 'Transaction date is required').or(z.date()),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  }).positive('Amount must be greater than 0'),
  type: TransactionTypeEnum,
  categoryId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid category ID',
    }),
  subcategoryId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid subcategory ID',
    }),
  name: z.string().min(1, 'Transaction name is required').max(200, 'Transaction name must be 200 characters or less'),
  description: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  memo: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringRuleId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid recurring rule ID',
    }),
  recurrence: RecurrenceTypeEnum.optional(),
  recurrence_end_date: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for updating transactions
 */
export const updateTransactionSchema = z.object({
  accountId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid account ID',
    }),
  date: z.string().or(z.date()).optional(),
  amount: z
    .number({
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .optional(),
  type: TransactionTypeEnum.optional(),
  categoryId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid category ID',
    }),
  subcategoryId: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || z.string().uuid().safeParse(val).success, {
      message: 'Invalid subcategory ID',
    }),
  name: z.string().min(1, 'Transaction name cannot be empty').max(200, 'Transaction name must be 200 characters or less').optional(),
  description: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  memo: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  tags: z.array(z.string()).optional(),
  recurrence: RecurrenceTypeEnum.optional(),
  recurrence_end_date: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type exports
 */
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type RecurrenceType = z.infer<typeof RecurrenceTypeEnum>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
