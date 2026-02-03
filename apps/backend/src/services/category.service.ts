import { prisma } from '../config/database';
import { CategoryType } from '@prisma/client';

export const categoryService = {
  /**
   * Get all categories for a user (including system categories)
   * Returns hierarchical structure with subcategories
   */
  async getUserCategories(userId: string) {
    // Get system categories (no userId) and user's custom categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null, isSystemCategory: true }, // System categories
          { userId }, // User's custom categories
        ],
      },
      orderBy: [
        { type: 'asc' }, // Group by type (income/expense)
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Build hierarchical structure
    const parentCategories = categories.filter((cat) => !cat.parentCategoryId);
    const subcategories = categories.filter((cat) => cat.parentCategoryId);

    // Attach subcategories to their parents
    const categoriesWithSubcategories = parentCategories.map((parent) => ({
      ...parent,
      subcategories: subcategories.filter((sub) => sub.parentCategoryId === parent.id),
    }));

    return categoriesWithSubcategories;
  },

  /**
   * Get categories by type (income or expense)
   */
  async getCategoriesByType(userId: string, type: CategoryType) {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null, isSystemCategory: true, type },
          { userId, type },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build hierarchical structure
    const parentCategories = categories.filter((cat) => !cat.parentCategoryId);
    const subcategories = categories.filter((cat) => cat.parentCategoryId);

    const categoriesWithSubcategories = parentCategories.map((parent) => ({
      ...parent,
      subcategories: subcategories.filter((sub) => sub.parentCategoryId === parent.id),
    }));

    return categoriesWithSubcategories;
  },
};
