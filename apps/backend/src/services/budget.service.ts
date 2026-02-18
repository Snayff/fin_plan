import { prisma } from '../config/database';
import { BudgetPeriod } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface CreateBudgetInput {
  name: string;
  period: BudgetPeriod;
  startDate: string | Date;
  endDate: string | Date;
}

export interface UpdateBudgetInput {
  name?: string;
  period?: BudgetPeriod;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export interface AddBudgetItemInput {
  categoryId: string;
  allocatedAmount: number;
  notes?: string;
}

export interface UpdateBudgetItemInput {
  allocatedAmount?: number;
  notes?: string;
}

export const budgetService = {
  /**
   * Create a new budget (deactivates any existing active budgets)
   */
  async createBudget(userId: string, data: CreateBudgetInput) {
    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new ValidationError('End date must be after start date');
    }

    // Use transaction to deactivate old budgets and create new one atomically
    return prisma.$transaction(async (tx) => {
      // Deactivate all active budgets for this user
      await tx.budget.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // Create new budget
      const budget = await tx.budget.create({
        data: {
          userId,
          name: data.name.trim(),
          period: data.period,
          startDate,
          endDate,
          isActive: true,
        },
      });

      return budget;
    });
  },

  /**
   * Get all budgets for a user with summary data
   */
  async getUserBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        budgetItems: {
          select: {
            allocatedAmount: true,
          },
        },
      },
    });

    // Add summary data to each budget
    return budgets.map((budget) => {
      const totalAllocated = budget.budgetItems.reduce(
        (sum, item) => sum + Number(item.allocatedAmount),
        0
      );

      return {
        id: budget.id,
        name: budget.name,
        period: budget.period,
        startDate: budget.startDate.toISOString(),
        endDate: budget.endDate.toISOString(),
        isActive: budget.isActive,
        totalAllocated,
        itemCount: budget.budgetItems.length,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
      };
    });
  },

  /**
   * Get a budget by ID with full tracking data
   */
  async getBudgetWithTracking(budgetId: string, userId: string) {
    // Fetch budget with items and categories
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        budgetItems: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    // Get all expense transactions in the budget period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Calculate spent per category
    const spentByCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.categoryId) {
        const current = spentByCategory.get(tx.categoryId) || 0;
        spentByCategory.set(tx.categoryId, current + Number(tx.amount));
      }
    }

    // Calculate expected income for the period
    const incomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'income',
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const expectedIncome = Number(incomeResult._sum.amount || 0);

    // Group items by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryColor: string | null;
        categoryIcon: string | null;
        items: Array<{
          id: string;
          budgetId: string;
          categoryId: string;
          allocatedAmount: number;
          carryover: boolean;
          rolloverAmount: number | null;
          notes: string | null;
          category: {
            id: string;
            name: string;
            color: string | null;
            icon: string | null;
          };
        }>;
      }
    >();

    for (const item of budget.budgetItems) {
      const categoryId = item.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: item.category.name,
          categoryColor: item.category.color,
          categoryIcon: item.category.icon,
          items: [],
        });
      }
      categoryMap.get(categoryId)!.items.push({
        ...item,
        allocatedAmount: Number(item.allocatedAmount),
        rolloverAmount: item.rolloverAmount ? Number(item.rolloverAmount) : null,
      });
    }

    // Build category groups with spending data
    const categoryGroups = Array.from(categoryMap.values()).map((group) => {
      const allocated = group.items.reduce((sum, item) => sum + item.allocatedAmount, 0);
      const spent = spentByCategory.get(group.categoryId) || 0;
      const remaining = allocated - spent;
      const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

      return {
        ...group,
        allocated,
        spent,
        remaining,
        percentUsed: Math.min(percentUsed, 100),
        isOverBudget: spent > allocated,
      };
    });

    const totalAllocated = categoryGroups.reduce((sum, g) => sum + g.allocated, 0);
    const totalSpent = categoryGroups.reduce((sum, g) => sum + g.spent, 0);

    return {
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate.toISOString(),
      isActive: budget.isActive,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      categoryGroups,
      expectedIncome,
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      unallocated: expectedIncome - totalAllocated,
    };
  },

  /**
   * Update a budget's basic fields
   */
  async updateBudget(budgetId: string, userId: string, data: UpdateBudgetInput) {
    // Verify ownership
    const existing = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Budget not found');
    }

    // Validate dates if provided
    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

    if (endDate <= startDate) {
      throw new ValidationError('End date must be after start date');
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.period && { period: data.period }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return budget;
  },

  /**
   * Delete a budget (cascades to budget items)
   */
  async deleteBudget(budgetId: string, userId: string) {
    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return { message: 'Budget deleted successfully' };
  },

  /**
   * Add a line item to a budget
   */
  async addBudgetItem(budgetId: string, userId: string, data: AddBudgetItemInput) {
    // Verify budget ownership
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    // Verify category is an expense category
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ValidationError('Category not found');
    }

    if (category.type !== 'expense') {
      throw new ValidationError('Budget items must be expense categories');
    }

    // Create the budget item
    const item = await prisma.budgetItem.create({
      data: {
        budgetId,
        categoryId: data.categoryId,
        allocatedAmount: data.allocatedAmount,
        notes: data.notes,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return {
      ...item,
      allocatedAmount: Number(item.allocatedAmount),
      rolloverAmount: item.rolloverAmount ? Number(item.rolloverAmount) : null,
    };
  },

  /**
   * Update a budget line item
   */
  async updateBudgetItem(itemId: string, userId: string, data: UpdateBudgetItemInput) {
    // Verify ownership via budget
    const item = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: {
        budget: {
          select: { userId: true },
        },
      },
    });

    if (!item || item.budget.userId !== userId) {
      throw new NotFoundError('Budget item not found');
    }

    const updatedItem = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        ...(data.allocatedAmount !== undefined && { allocatedAmount: data.allocatedAmount }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return {
      ...updatedItem,
      allocatedAmount: Number(updatedItem.allocatedAmount),
      rolloverAmount: updatedItem.rolloverAmount ? Number(updatedItem.rolloverAmount) : null,
    };
  },

  /**
   * Delete a budget line item
   */
  async deleteBudgetItem(itemId: string, userId: string) {
    // Verify ownership via budget
    const item = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: {
        budget: {
          select: { userId: true },
        },
      },
    });

    if (!item || item.budget.userId !== userId) {
      throw new NotFoundError('Budget item not found');
    }

    await prisma.budgetItem.delete({
      where: { id: itemId },
    });

    return { message: 'Budget item deleted successfully' };
  },

  /**
   * Remove all line items for a category from a budget
   */
  async removeCategoryFromBudget(budgetId: string, userId: string, categoryId: string) {
    // Verify budget ownership
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    // Delete all items for this category in this budget
    const result = await prisma.budgetItem.deleteMany({
      where: {
        budgetId,
        categoryId,
      },
    });

    return { message: `Removed ${result.count} item(s) from budget` };
  },
};
