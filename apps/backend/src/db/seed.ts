import { prisma } from '../config/database';
import type { CategoryType } from '@prisma/client';

const logger = {
  info: console.log,
  error: console.error,
};

/**
 * Seed default categories
 */
async function seedCategories() {
  logger.info('Seeding default categories...');

  // Define the exact categories we want - FLAT LIST ONLY (no subcategories)
  const desiredCategories = [
    // Income categories
    { name: 'Salary', type: 'income' as CategoryType, color: '#10b981', icon: '💰', isSystemCategory: true, sortOrder: 1 },
    { name: 'Dividends', type: 'income' as CategoryType, color: '#3b82f6', icon: '📈', isSystemCategory: true, sortOrder: 2 },
    { name: 'Gifts', type: 'income' as CategoryType, color: '#8b5cf6', icon: '🎁', isSystemCategory: true, sortOrder: 3 },
    { name: 'Refunds', type: 'income' as CategoryType, color: '#06b6d4', icon: '💵', isSystemCategory: true, sortOrder: 4 },
    { name: 'Other Income', type: 'income' as CategoryType, color: '#6b7280', icon: '💸', isSystemCategory: true, sortOrder: 5 },

    // Expense categories
    { name: 'Housing', type: 'expense' as CategoryType, color: '#ef4444', icon: '🏠', isSystemCategory: true, sortOrder: 10 },
    { name: 'Transportation', type: 'expense' as CategoryType, color: '#f59e0b', icon: '🚗', isSystemCategory: true, sortOrder: 11 },
    { name: 'Food', type: 'expense' as CategoryType, color: '#84cc16', icon: '🍔', isSystemCategory: true, sortOrder: 12 },
    { name: 'Utilities', type: 'expense' as CategoryType, color: '#06b6d4', icon: '⚡', isSystemCategory: true, sortOrder: 13 },
    { name: 'Healthcare', type: 'expense' as CategoryType, color: '#ec4899', icon: '🏥', isSystemCategory: true, sortOrder: 14 },
    { name: 'Entertainment', type: 'expense' as CategoryType, color: '#8b5cf6', icon: '🎮', isSystemCategory: true, sortOrder: 15 },
    { name: 'Insurance', type: 'expense' as CategoryType, color: '#3b82f6', icon: '🛡️', isSystemCategory: true, sortOrder: 16 },
    { name: 'Debt Payments', type: 'expense' as CategoryType, color: '#dc2626', icon: '💳', isSystemCategory: true, sortOrder: 17 },
    { name: 'Savings', type: 'expense' as CategoryType, color: '#10b981', icon: '💰', isSystemCategory: true, sortOrder: 18 },
    { name: 'Other Expense', type: 'expense' as CategoryType, color: '#6b7280', icon: '📦', isSystemCategory: true, sortOrder: 19 },
  ];

  // Get all existing system categories
  const existingCategories = await prisma.category.findMany({
    where: { userId: null, parentCategoryId: null },
  });

  const desiredCategoryNames = desiredCategories.map(c => c.name);

  // Delete old system categories that are not in our desired list
  for (const existing of existingCategories) {
    if (!desiredCategoryNames.includes(existing.name)) {
      logger.info(`Removing old category: ${existing.name}`);
      // Delete subcategories first
      await prisma.category.deleteMany({
        where: { parentCategoryId: existing.id },
      });
      // Delete the category
      await prisma.category.delete({
        where: { id: existing.id },
      });
    }
  }

  // Create or update categories
  for (const category of desiredCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null, parentCategoryId: null },
    });

    if (existing) {
      // Update existing category to ensure it matches our spec
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          type: category.type,
          color: category.color,
          icon: category.icon,
          sortOrder: category.sortOrder,
          isSystemCategory: true,
        },
      });
      logger.info(`Updated category: ${category.name}`);
    } else {
      // Create new category
      await prisma.category.create({
        data: {
          ...category,
          userId: null, // System categories
        },
      });
      logger.info(`Created category: ${category.name}`);
    }
  }

  logger.info('✓ Default categories seeded successfully (flat list, no subcategories)');
}

/**
 * Main seed function
 */
async function main() {
  try {
    await seedCategories();
    logger.info('\n✓ Database seeding completed successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error seeding database');
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    logger.error({ err: error }, 'Database seeding failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
