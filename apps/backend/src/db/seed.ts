import { prisma } from '../config/database';
import type { CategoryType } from '@prisma/client';

/**
 * Seed default categories
 */
async function seedCategories() {
  console.log('Seeding default categories...');

  const categories = [
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
    { name: 'Savings', type: 'expense' as CategoryType, color: '#10b981', icon: '🐷', isSystemCategory: true, sortOrder: 18 },
    { name: 'Other Expenses', type: 'expense' as CategoryType, color: '#6b7280', icon: '📦', isSystemCategory: true, sortOrder: 19 },
  ];

  // Create categories if they don't exist
  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          userId: null, // System categories
        },
      });
    }
  }

  // Create subcategories for Housing
  const housing = await prisma.category.findFirst({
    where: { name: 'Housing', userId: null },
  });

  if (housing) {
    const housingSubcategories = [
      { name: 'Rent', color: '#ef4444', icon: '🏘️' },
      { name: 'Mortgage', color: '#dc2626', icon: '🏡' },
      { name: 'Property Tax', color: '#b91c1c', icon: '📋' },
      { name: 'Home Insurance', color: '#991b1b', icon: '🏠' },
      { name: 'Repairs & Maintenance', color: '#7f1d1d', icon: '🔧' },
    ];

    let sortOrder = 1;
    for (const sub of housingSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { name: sub.name, userId: null },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            type: 'expense' as CategoryType,
            parentCategoryId: housing.id,
            isSystemCategory: true,
            sortOrder: sortOrder++,
            userId: null,
          },
        });
      }
    }
  }

  // Create subcategories for Transportation
  const transportation = await prisma.category.findFirst({
    where: { name: 'Transportation', userId: null },
  });

  if (transportation) {
    const transportationSubcategories = [
      { name: 'Fuel', color: '#f59e0b', icon: '⛽' },
      { name: 'Auto Insurance', color: '#d97706', icon: '🚙' },
      { name: 'Maintenance', color: '#b45309', icon: '🔧' },
      { name: 'Public Transport', color: '#92400e', icon: '🚌' },
      { name: 'Parking', color: '#78350f', icon: '🅿️' },
    ];

    let sortOrder = 1;
    for (const sub of transportationSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { name: sub.name, userId: null },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            type: 'expense' as CategoryType,
            parentCategoryId: transportation.id,
            isSystemCategory: true,
            sortOrder: sortOrder++,
            userId: null,
          },
        });
      }
    }
  }

  // Create subcategories for Food
  const food = await prisma.category.findFirst({
    where: { name: 'Food', userId: null },
  });

  if (food) {
    const foodSubcategories = [
      { name: 'Groceries', color: '#84cc16', icon: '🛒' },
      { name: 'Dining Out', color: '#65a30d', icon: '🍽️' },
      { name: 'Coffee & Snacks', color: '#4d7c0f', icon: '☕' },
    ];

    let sortOrder = 1;
    for (const sub of foodSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { name: sub.name, userId: null },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            type: 'expense' as CategoryType,
            parentCategoryId: food.id,
            isSystemCategory: true,
            sortOrder: sortOrder++,
            userId: null,
          },
        });
      }
    }
  }

  console.log('✓ Default categories seeded successfully');
}

/**
 * Main seed function
 */
async function main() {
  try {
    await seedCategories();
    console.log('\n✓ Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
