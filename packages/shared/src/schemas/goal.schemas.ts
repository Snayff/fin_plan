import { z } from 'zod';

/**
 * Goal type enum
 */
export const GoalTypeEnum = z.enum([
  'savings',
  'debt_payoff',
  'net_worth',
  'purchase',
  'investment',
  'income',
]);

/**
 * Priority enum
 */
export const PriorityEnum = z.enum(['high', 'medium', 'low']);

/**
 * Goal status enum
 */
export const GoalStatusEnum = z.enum(['active', 'completed', 'archived']);

/**
 * Schema for creating goals
 */
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(200),
  description: z.string().max(1000).optional(),
  type: GoalTypeEnum,
  targetAmount: z.number({
    required_error: 'Target amount is required',
    invalid_type_error: 'Target amount must be a number',
  }).min(0, 'Target amount must be non-negative'),
  targetDate: z
    .string()
    .min(1)
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  priority: PriorityEnum.default('medium'),
  icon: z.string().max(50).optional(),
  metadata: z
    .object({
      milestones: z
        .array(
          z.object({
            percentage: z.number().min(0).max(100),
            label: z.string(),
            reached: z.boolean().default(false),
          })
        )
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema for updating goals
 */
export const updateGoalSchema = z.object({
  name: z.string().min(1, 'Goal name cannot be empty').max(200).optional(),
  description: z.string().max(1000).optional(),
  type: GoalTypeEnum.optional(),
  targetAmount: z.number().min(0, 'Target amount must be non-negative').optional(),
  targetDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  priority: PriorityEnum.optional(),
  status: GoalStatusEnum.optional(),
  icon: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for creating goal contributions
 */
export const createGoalContributionSchema = z.object({
  amount: z.number({
    required_error: 'Contribution amount is required',
    invalid_type_error: 'Amount must be a number',
  }).min(0.01, 'Amount must be greater than 0'),
  date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  notes: z.string().max(500).optional(),
});

/**
 * Schema for linking a transaction to a goal
 */
export const linkTransactionToGoalSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  }).min(0.01, 'Amount must be greater than 0'),
  notes: z.string().max(500).optional(),
});

/**
 * Type exports
 */
export type GoalType = z.infer<typeof GoalTypeEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
export type GoalStatus = z.infer<typeof GoalStatusEnum>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateGoalContributionInput = z.infer<typeof createGoalContributionSchema>;
export type LinkTransactionToGoalInput = z.infer<typeof linkTransactionToGoalSchema>;
