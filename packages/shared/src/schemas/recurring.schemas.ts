import { z } from 'zod';
import { TransactionTypeEnum } from './transaction.schemas';

/**
 * Recurring frequency enum matching Prisma schema
 */
export const RecurringFrequencyEnum = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
  'custom',
]);

/**
 * Update scope for editing generated transactions
 */
export const UpdateScopeEnum = z.enum(['this_only', 'all', 'all_forward']);

/**
 * Template transaction schema
 * Represents the base transaction that will be generated on each occurrence
 */
export const templateTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  type: TransactionTypeEnum,
  amount: z.number().positive('Amount must be greater than 0'),
  name: z.string().min(1, 'Transaction name is required').max(200),
  categoryId: z
    .string()
    .uuid('Invalid category ID')
    .nullable()
    .optional(),
  subcategoryId: z
    .string()
    .uuid('Invalid subcategory ID')
    .nullable()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
  memo: z
    .string()
    .max(500, 'Memo must be 500 characters or less')
    .nullable()
    .optional(),
  tags: z.array(z.string()).optional(),
  liabilityId: z
    .string()
    .uuid('Invalid liability ID')
    .nullable()
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for creating a new recurring rule
 */
export const createRecurringRuleSchema = z
  .object({
    frequency: RecurringFrequencyEnum,
    interval: z
      .number()
      .int()
      .positive('Interval must be a positive integer')
      .default(1),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z
      .string()
      .or(z.date())
      .transform((val) => (val ? new Date(val) : null))
      .nullable()
      .optional(),
    occurrences: z
      .number()
      .int()
      .positive('Occurrences must be a positive integer')
      .nullable()
      .optional(),
    isActive: z.boolean().default(true),
    templateTransaction: templateTransactionSchema,
  })
  .refine(
    (data) => {
      // Can't have both endDate and occurrences
      return !(data.endDate && data.occurrences);
    },
    {
      message: 'Cannot specify both endDate and occurrences',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // If endDate is provided, it must be after startDate
      if (data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Schema for updating a recurring rule
 */
export const updateRecurringRuleSchema = z
  .object({
    frequency: RecurringFrequencyEnum.optional(),
    interval: z
      .number()
      .int()
      .positive('Interval must be a positive integer')
      .optional(),
    startDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
    endDate: z
      .string()
      .or(z.date())
      .transform((val) => (val ? new Date(val) : null))
      .nullable()
      .optional(),
    occurrences: z
      .number()
      .int()
      .positive('Occurrences must be a positive integer')
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
    templateTransaction: templateTransactionSchema.optional(),
  })
  .refine(
    (data) => {
      // Can't have both endDate and occurrences
      return !(data.endDate && data.occurrences);
    },
    {
      message: 'Cannot specify both endDate and occurrences',
      path: ['endDate'],
    }
  );

/**
 * Schema for previewing occurrences
 */
export const previewOccurrencesSchema = z.object({
  frequency: RecurringFrequencyEnum,
  interval: z
    .number()
    .int()
    .positive('Interval must be a positive integer')
    .default(1),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  occurrences: z
    .number()
    .int()
    .positive('Occurrences must be a positive integer')
    .nullable()
    .optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(50, 'Limit cannot exceed 50')
    .default(10),
});

/**
 * Type exports
 */
export type RecurringFrequency = z.infer<typeof RecurringFrequencyEnum>;
export type UpdateScope = z.infer<typeof UpdateScopeEnum>;
export type TemplateTransaction = z.infer<typeof templateTransactionSchema>;
export type CreateRecurringRuleInput = z.infer<typeof createRecurringRuleSchema>;
export type UpdateRecurringRuleInput = z.infer<typeof updateRecurringRuleSchema>;
export type PreviewOccurrencesInput = z.infer<typeof previewOccurrencesSchema>;
