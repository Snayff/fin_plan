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
 * Payment frequency enum
 */
export const PaymentFrequencyEnum = z.enum(['monthly', 'biweekly', 'weekly']);

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
    originalAmount: z.number({
      required_error: 'Original amount is required',
      invalid_type_error: 'Original amount must be a number',
    }).min(0, 'Original amount must be non-negative'),
    interestRate: z.number({
      required_error: 'Interest rate is required',
      invalid_type_error: 'Interest rate must be a number',
    }).min(0, 'Interest rate must be between 0% and 100%').max(100, 'Interest rate must be between 0% and 100%'),
    interestType: InterestTypeEnum,
    minimumPayment: z.number({
      required_error: 'Minimum payment is required',
      invalid_type_error: 'Minimum payment must be a number',
    }).min(0, 'Minimum payment must be non-negative'),
    paymentFrequency: PaymentFrequencyEnum,
    payoffDate: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
    accountId: z
      .string()
      .uuid('Invalid account ID')
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    metadata: z
      .object({
        lender: z.string().optional(),
        accountNumber: z.string().optional(),
        notes: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => data.minimumPayment > 0 || data.currentBalance === 0, {
    message: 'Minimum payment must be greater than 0 for active liabilities',
    path: ['minimumPayment'],
  });

/**
 * Schema for updating liabilities
 */
export const updateLiabilitySchema = z.object({
  name: z.string().min(1, 'Liability name cannot be empty').max(200).optional(),
  type: LiabilityTypeEnum.optional(),
  currentBalance: z.number().min(0, 'Current balance must be non-negative').optional(),
  originalAmount: z.number().min(0, 'Original amount must be non-negative').optional(),
  interestRate: z.number().min(0, 'Interest rate must be between 0% and 100%').max(100, 'Interest rate must be between 0% and 100%').optional(),
  interestType: InterestTypeEnum.optional(),
  minimumPayment: z.number().min(0, 'Minimum payment must be non-negative').optional(),
  paymentFrequency: PaymentFrequencyEnum.optional(),
  payoffDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for allocating a transaction to a liability payment
 */
export const allocatePaymentSchema = z
  .object({
    transactionId: z.string().uuid('Invalid transaction ID'),
    liabilityId: z.string().uuid('Invalid liability ID'),
    principalAmount: z.number({
      required_error: 'Principal amount is required',
      invalid_type_error: 'Principal amount must be a number',
    }).min(0, 'Principal must be non-negative'),
    interestAmount: z.number({
      required_error: 'Interest amount is required',
      invalid_type_error: 'Interest amount must be a number',
    }).min(0, 'Interest must be non-negative'),
  })
  .refine((data) => data.principalAmount + data.interestAmount > 0, {
    message: 'Total payment (principal + interest) must be greater than 0',
    path: ['principalAmount'],
  });

/**
 * Type exports
 */
export type LiabilityType = z.infer<typeof LiabilityTypeEnum>;
export type InterestType = z.infer<typeof InterestTypeEnum>;
export type PaymentFrequency = z.infer<typeof PaymentFrequencyEnum>;
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;
export type AllocatePaymentInput = z.infer<typeof allocatePaymentSchema>;
