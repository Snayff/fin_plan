import { z } from 'zod';

/**
 * Liability type enum
 */
export const LiabilityTypeEnum = z.enum([
  'mortgage',
  'auto_loan',
  'student_loan',
  'credit_card',
  'personal_loan',
  'line_of_credit',
]);

/**
 * Interest type enum
 */
export const InterestTypeEnum = z.enum(['fixed', 'variable']);

/**
 * Schema for creating liabilities
 */
export const createLiabilitySchema = z
  .object({
    name: z.string().min(1, 'Liability name is required').max(200),
    type: LiabilityTypeEnum,
    currentBalance: z.number({
      required_error: 'Current balance is required',
      invalid_type_error: 'Current balance must be a number',
    }).min(0, 'Current balance must be non-negative'),
    interestRate: z.number({
      required_error: 'Interest rate is required',
      invalid_type_error: 'Interest rate must be a number',
    }).min(0, 'Interest rate must be between 0% and 100%').max(100, 'Interest rate must be between 0% and 100%'),
    interestType: InterestTypeEnum,
    openDate: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
    termEndDate: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
    metadata: z
      .object({
        lender: z.string().optional(),
        notes: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => new Date(data.termEndDate).getTime() >= new Date(data.openDate).getTime(), {
    message: 'Term end date must be on or after open date',
    path: ['termEndDate'],
  });

/**
 * Schema for updating liabilities
 */
export const updateLiabilitySchema = z.object({
  name: z.string().min(1, 'Liability name cannot be empty').max(200).optional(),
  type: LiabilityTypeEnum.optional(),
  currentBalance: z.number().min(0, 'Current balance must be non-negative').optional(),
  interestRate: z.number().min(0, 'Interest rate must be between 0% and 100%').max(100, 'Interest rate must be between 0% and 100%').optional(),
  interestType: InterestTypeEnum.optional(),
  openDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  termEndDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type exports
 */
export type LiabilityType = z.infer<typeof LiabilityTypeEnum>;
export type InterestType = z.infer<typeof InterestTypeEnum>;
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;
