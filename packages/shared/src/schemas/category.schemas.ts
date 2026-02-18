import { z } from 'zod';

/**
 * Category type enum
 */
export const CategoryTypeEnum = z.enum(['income', 'expense']);

/**
 * Schema for creating categories
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: CategoryTypeEnum,
  parentCategoryId: z.string().uuid('Invalid parent category ID').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6'),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Schema for updating categories
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').optional(),
  type: CategoryTypeEnum.optional(),
  parentCategoryId: z.string().uuid('Invalid parent category ID').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Type exports
 */
export type CategoryType = z.infer<typeof CategoryTypeEnum>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
