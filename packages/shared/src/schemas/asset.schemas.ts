import { z } from 'zod';

/**
 * Asset type enum
 */
export const AssetTypeEnum = z.enum([
  'housing',
  'investment',
  'vehicle',
  'business',
  'personal_property',
  'crypto',
]);

/**
 * Liquidity type enum
 */
export const LiquidityTypeEnum = z.enum(['liquid', 'semi_liquid', 'illiquid']);

/**
 * Value source enum
 */
export const ValueSourceEnum = z.enum(['manual', 'automatic', 'calculated']);

/**
 * Schema for creating assets
 */
export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(200),
  type: AssetTypeEnum,
  currentValue: z.number({
    required_error: 'Current value is required',
    invalid_type_error: 'Current value must be a number',
  }).min(0, 'Current value must be non-negative'),
  purchaseValue: z.number().min(0, 'Purchase value must be non-negative').optional(),
  purchaseDate: z
    .string()
    .min(1)
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  expectedGrowthRate: z
    .number()
    .min(-100, 'Growth rate cannot be less than -100%')
    .max(1000, 'Growth rate cannot exceed 1000%')
    .default(0),
  metadata: z
    .object({
      location: z.string().optional(),
      ticker: z.string().optional(),
      registrationNumber: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema for updating assets
 */
export const updateAssetSchema = z.object({
  name: z.string().min(1, 'Asset name cannot be empty').max(200).optional(),
  type: AssetTypeEnum.optional(),
  purchaseValue: z.number().min(0, 'Purchase value must be non-negative').optional(),
  purchaseDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  expectedGrowthRate: z
    .number()
    .min(-100, 'Growth rate cannot be less than -100%')
    .max(1000, 'Growth rate cannot exceed 1000%')
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for updating asset value (creates history entry)
 */
export const updateAssetValueSchema = z.object({
  newValue: z.number({
    required_error: 'New value is required',
    invalid_type_error: 'New value must be a number',
  }).min(0, 'Value must be non-negative'),
  source: ValueSourceEnum.default('manual'),
  date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
});

/**
 * Type exports
 */
export type AssetType = z.infer<typeof AssetTypeEnum>;
export type LiquidityType = z.infer<typeof LiquidityTypeEnum>;
export type ValueSource = z.infer<typeof ValueSourceEnum>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type UpdateAssetValueInput = z.infer<typeof updateAssetValueSchema>;
