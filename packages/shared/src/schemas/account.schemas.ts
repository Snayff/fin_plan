import { z } from 'zod';

/**
 * Account type enum - matches Prisma AccountType enum
 */
export const AccountTypeEnum = z.enum([
  'current',
  'savings',
  'isa',
  'stocks_and_shares_isa',
  'credit',
  'investment',
  'loan',
  'asset',
  'liability',
]);

/**
 * Schema for creating accounts
 */
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: AccountTypeEnum,
  subtype: z.string().optional(),
  openingBalance: z.number().optional().default(0),
  currency: z.string().min(1, 'Currency is required').default('GBP'),
  description: z.string().optional(),
  metadata: z
    .object({
      institution: z.string().optional(),
      accountNumber: z.string().optional(),
      interestRate: z.number().optional(),
      creditLimit: z.number().optional(),
    })
    .optional(),
});

/**
 * Schema for updating accounts
 */
export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name cannot be empty').optional(),
  type: AccountTypeEnum.optional(),
  subtype: z.string().optional(),
  currency: z.string().min(1, 'Currency cannot be empty').optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  metadata: z
    .object({
      institution: z.string().optional(),
      accountNumber: z.string().optional(),
      interestRate: z.number().optional(),
      creditLimit: z.number().optional(),
    })
    .optional(),
});

/**
 * Type exports
 */
export type AccountType = z.infer<typeof AccountTypeEnum>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
