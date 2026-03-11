import { z } from 'zod';
import { RecurringFrequencyEnum } from './recurring.schemas';

/**
 * Budget period enum matching Prisma schema
 */
export const BudgetPeriodEnum = z.enum(['monthly', 'quarterly', 'annual', 'custom']);

/**
 * Budget item type enum distinguishing committed vs discretionary spending
 */
export const BudgetItemTypeEnum = z.enum(['committed', 'discretionary']);

/**
 * Schema for creating a new budget
 */
export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(200),
  period: BudgetPeriodEnum,
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
});

/**
 * Schema for updating an existing budget
 */
export const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name cannot be empty').max(200).optional(),
  period: BudgetPeriodEnum.optional(),
  startDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  endDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  isActive: z.boolean().optional(),
});

/**
 * Schema for adding a single item to a budget
 */
export const addBudgetItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  allocatedAmount: z.number({
    required_error: 'Allocated amount is required',
    invalid_type_error: 'Allocated amount must be a number',
  }).min(0, 'Allocated amount must be non-negative'),
  notes: z.string().max(500).optional(),
  itemType: BudgetItemTypeEnum.optional().default('committed'),
  recurringRuleId: z.string().uuid().nullable().optional(),
  entryFrequency: RecurringFrequencyEnum.nullable().optional(),
  entryAmount: z.number().positive().nullable().optional(),
});

/**
 * Schema for updating an existing budget item
 */
export const updateBudgetItemSchema = z.object({
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative').optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema for adding multiple budget items in a single batch request
 */
export const addBudgetItemsBatchSchema = z.object({
  items: z.array(addBudgetItemSchema).min(1, 'At least one item required').max(50, 'Maximum 50 items per batch'),
});

/**
 * Type exports
 */
export type BudgetPeriod = z.infer<typeof BudgetPeriodEnum>;
export type BudgetItemType = z.infer<typeof BudgetItemTypeEnum>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type AddBudgetItemInput = z.infer<typeof addBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type AddBudgetItemsBatchInput = z.infer<typeof addBudgetItemsBatchSchema>;
