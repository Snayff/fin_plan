import { z } from 'zod';

/**
 * Budget period enum
 */
export const BudgetPeriodEnum = z.enum(['monthly', 'quarterly', 'annual', 'custom']);

/**
 * Schema for creating a budget (items are added separately on the detail page)
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
 * Schema for updating a budget
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
 * Schema for adding a line item to a budget
 */
export const addBudgetItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  allocatedAmount: z.number({
    required_error: 'Allocated amount is required',
    invalid_type_error: 'Allocated amount must be a number',
  }).min(0, 'Allocated amount must be non-negative'),
  notes: z.string().max(500).optional(),
});

/**
 * Schema for updating a budget line item
 */
export const updateBudgetItemSchema = z.object({
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative').optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Type exports
 */
export type BudgetPeriod = z.infer<typeof BudgetPeriodEnum>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type AddBudgetItemInput = z.infer<typeof addBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
