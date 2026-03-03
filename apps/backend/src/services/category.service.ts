import { prisma } from '../config/database';
import { CategoryType } from '@prisma/client';

export const categoryService = {
  /**
   * Get all categories for a household (including system categories)
   * Returns flat list of categories (no subcategories)
   */
  async getUserCategories(householdId: string) {
    // Get system categories (no userId) and household's custom categories
    // Only return top-level categories (no parentCategoryId)
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { householdId: null, isSystemCategory: true }, // System categories
          { householdId }, // Household's custom categories
        ],
        parentCategoryId: null, // Only top-level categories
      },
      orderBy: [
        { type: 'asc' }, // Group by type (income/expense)
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories;
  },

  /**
   * Get categories by type (income or expense)
   * Returns flat list of categories (no subcategories)
   */
  async getCategoriesByType(householdId: string, type: CategoryType) {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { householdId: null, isSystemCategory: true, type },
          { householdId, type },
        ],
        parentCategoryId: null, // Only top-level categories
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  },
};
