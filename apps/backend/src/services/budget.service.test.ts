import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { budgetService } from "./budget.service";
import { NotFoundError, ValidationError } from "../utils/errors";
import { buildBudget, buildBudgetItem, buildCategory } from "../test/fixtures";

beforeEach(() => {
  resetPrismaMocks();
});

describe("budgetService.createBudget", () => {
  it("deactivates existing active budgets and creates new one", async () => {
    const mockBudget = buildBudget();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    prismaMock.budget.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.budget.create.mockResolvedValue(mockBudget as any);

    const result = await budgetService.createBudget("user-1", {
      name: "Monthly Budget",
      period: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.budget.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isActive: true },
      data: { isActive: false },
    });
    expect(prismaMock.budget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          name: "Monthly Budget",
          period: "monthly",
          isActive: true,
        }),
      })
    );
    expect(result.id).toBe(mockBudget.id);
  });

  it("throws ValidationError when endDate is before startDate", async () => {
    await expect(
      budgetService.createBudget("user-1", {
        name: "Invalid Budget",
        period: "monthly",
        startDate: "2025-01-31",
        endDate: "2025-01-01",
      })
    ).rejects.toThrow("End date must be after start date");
  });

  it("throws ValidationError when endDate equals startDate", async () => {
    await expect(
      budgetService.createBudget("user-1", {
        name: "Invalid Budget",
        period: "monthly",
        startDate: "2025-01-15",
        endDate: "2025-01-15",
      })
    ).rejects.toThrow("End date must be after start date");
  });
});

describe("budgetService.getUserBudgets", () => {
  it("returns empty array when no budgets", async () => {
    prismaMock.budget.findMany.mockResolvedValue([]);
    const result = await budgetService.getUserBudgets("user-1");
    expect(result).toEqual([]);
  });

  it("returns budgets ordered by createdAt desc with summary data", async () => {
    const budget1 = buildBudget({
      id: "budget-1",
      name: "January",
      createdAt: new Date("2025-01-01"),
    });
    const budget2 = buildBudget({
      id: "budget-2",
      name: "February",
      createdAt: new Date("2025-02-01"),
    });

    prismaMock.budget.findMany.mockResolvedValue([
      {
        ...budget2,
        budgetItems: [
          { allocatedAmount: 500 },
          { allocatedAmount: 1000 },
        ],
      },
      {
        ...budget1,
        budgetItems: [
          { allocatedAmount: 750 },
        ],
      },
    ] as any);

    const result = await budgetService.getUserBudgets("user-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("budget-2"); // Most recent first
    expect(result[0].totalAllocated).toBe(1500);
    expect(result[0].itemCount).toBe(2);
    expect(result[1].id).toBe("budget-1");
    expect(result[1].totalAllocated).toBe(750);
    expect(result[1].itemCount).toBe(1);
  });

  it("converts Decimal allocatedAmount to numbers", async () => {
    const budget = buildBudget();
    prismaMock.budget.findMany.mockResolvedValue([
      {
        ...budget,
        budgetItems: [
          { allocatedAmount: 123.45 },
        ],
      },
    ] as any);

    const result = await budgetService.getUserBudgets("user-1");
    expect(result[0].totalAllocated).toBe(123.45);
    expect(typeof result[0].totalAllocated).toBe("number");
  });
});

describe("budgetService.getBudgetWithTracking", () => {
  it("throws NotFoundError when budget not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(
      budgetService.getBudgetWithTracking("budget-1", "user-1")
    ).rejects.toThrow(NotFoundError);
  });

  it("returns enhanced budget with tracking data", async () => {
    const category1 = buildCategory({ id: "cat-1", name: "Housing", type: "expense" });
    const category2 = buildCategory({ id: "cat-2", name: "Food", type: "expense" });

    const budget = buildBudget({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31T23:59:59Z"),
    });

    prismaMock.budget.findFirst.mockResolvedValue({
      ...budget,
      budgetItems: [
        {
          ...buildBudgetItem({ id: "item-1", categoryId: "cat-1", allocatedAmount: 1500, notes: "Rent" }),
          category: { id: "cat-1", name: "Housing", color: "#FF0000", icon: "home" },
        },
        {
          ...buildBudgetItem({ id: "item-2", categoryId: "cat-1", allocatedAmount: 200, notes: "Utilities" }),
          category: { id: "cat-1", name: "Housing", color: "#FF0000", icon: "home" },
        },
        {
          ...buildBudgetItem({ id: "item-3", categoryId: "cat-2", allocatedAmount: 600, notes: "Groceries" }),
          category: { id: "cat-2", name: "Food", color: "#00FF00", icon: "utensils" },
        },
      ],
    } as any);

    // Mock expense transactions
    prismaMock.transaction.findMany.mockResolvedValue([
      { categoryId: "cat-1", amount: 1400 }, // Housing spent
      { categoryId: "cat-1", amount: 180 },
      { categoryId: "cat-2", amount: 500 }, // Food spent
    ] as any);

    // Mock income aggregate
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: 5000 },
    } as any);

    const result = await budgetService.getBudgetWithTracking("budget-1", "user-1");

    expect(result.id).toBe(budget.id);
    expect(result.expectedIncome).toBe(5000);
    expect(result.totalAllocated).toBe(2300); // 1500 + 200 + 600
    expect(result.totalSpent).toBe(2080); // 1400 + 180 + 500
    expect(result.totalRemaining).toBe(220); // 2300 - 2080
    expect(result.unallocated).toBe(2700); // 5000 - 2300

    expect(result.categoryGroups).toHaveLength(2);

    const housingGroup = result.categoryGroups.find(g => g.categoryId === "cat-1");
    expect(housingGroup).toBeDefined();
    expect(housingGroup!.categoryName).toBe("Housing");
    expect(housingGroup!.items).toHaveLength(2); // Rent + Utilities
    expect(housingGroup!.allocated).toBe(1700); // 1500 + 200
    expect(housingGroup!.spent).toBe(1580); // 1400 + 180
    expect(housingGroup!.remaining).toBe(120);
    expect(housingGroup!.isOverBudget).toBe(false);

    const foodGroup = result.categoryGroups.find(g => g.categoryId === "cat-2");
    expect(foodGroup).toBeDefined();
    expect(foodGroup!.allocated).toBe(600);
    expect(foodGroup!.spent).toBe(500);
    expect(foodGroup!.remaining).toBe(100);
  });

  it("handles over-budget categories", async () => {
    const budget = buildBudget({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31T23:59:59Z"),
    });

    prismaMock.budget.findFirst.mockResolvedValue({
      ...budget,
      budgetItems: [
        {
          ...buildBudgetItem({ categoryId: "cat-1", allocatedAmount: 500 }),
          category: { id: "cat-1", name: "Dining", color: "#00FF00", icon: "utensils" },
        },
      ],
    } as any);

    // Spent more than allocated
    prismaMock.transaction.findMany.mockResolvedValue([
      { categoryId: "cat-1", amount: 600 },
    ] as any);

    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: 2000 },
    } as any);

    const result = await budgetService.getBudgetWithTracking("budget-1", "user-1");

    const group = result.categoryGroups[0];
    expect(group.allocated).toBe(500);
    expect(group.spent).toBe(600);
    expect(group.remaining).toBe(-100);
    expect(group.isOverBudget).toBe(true);
    expect(group.percentUsed).toBe(100); // Capped at 100 for display
  });

  it("handles categories with no spending", async () => {
    const budget = buildBudget();

    prismaMock.budget.findFirst.mockResolvedValue({
      ...budget,
      budgetItems: [
        {
          ...buildBudgetItem({ categoryId: "cat-1", allocatedAmount: 500 }),
          category: { id: "cat-1", name: "Savings", color: "#0000FF", icon: "piggy-bank" },
        },
      ],
    } as any);

    prismaMock.transaction.findMany.mockResolvedValue([]); // No transactions
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: 3000 },
    } as any);

    const result = await budgetService.getBudgetWithTracking("budget-1", "user-1");

    const group = result.categoryGroups[0];
    expect(group.spent).toBe(0);
    expect(group.remaining).toBe(500);
    expect(group.percentUsed).toBe(0);
    expect(group.isOverBudget).toBe(false);
  });
});

describe("budgetService.updateBudget", () => {
  it("updates budget fields", async () => {
    const existingBudget = buildBudget();
    prismaMock.budget.findFirst.mockResolvedValue(existingBudget as any);
    prismaMock.budget.update.mockResolvedValue({
      ...existingBudget,
      name: "Updated Budget",
    } as any);

    const result = await budgetService.updateBudget("budget-1", "user-1", {
      name: "Updated Budget",
      period: "quarterly",
    });

    expect(prismaMock.budget.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "budget-1" },
        data: expect.objectContaining({
          name: "Updated Budget",
          period: "quarterly",
        }),
      })
    );
  });

  it("throws NotFoundError when budget not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(
      budgetService.updateBudget("missing", "user-1", { name: "X" })
    ).rejects.toThrow(NotFoundError);
  });

  it("validates dates when updating", async () => {
    const existingBudget = buildBudget({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
    });
    prismaMock.budget.findFirst.mockResolvedValue(existingBudget as any);

    await expect(
      budgetService.updateBudget("budget-1", "user-1", {
        startDate: "2025-02-01",
        endDate: "2025-01-01", // Before start
      })
    ).rejects.toThrow("End date must be after start date");
  });
});

describe("budgetService.deleteBudget", () => {
  it("deletes budget when found", async () => {
    const budget = buildBudget();
    prismaMock.budget.findFirst.mockResolvedValue(budget as any);
    prismaMock.budget.delete.mockResolvedValue(budget as any);

    const result = await budgetService.deleteBudget("budget-1", "user-1");

    expect(prismaMock.budget.delete).toHaveBeenCalledWith({ where: { id: "budget-1" } });
    expect(result.message).toBe("Budget deleted successfully");
  });

  it("throws NotFoundError when budget not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(budgetService.deleteBudget("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("budgetService.addBudgetItem", () => {
  it("adds item to budget for expense category", async () => {
    const budget = buildBudget();
    const category = buildCategory({ id: "cat-1", type: "expense" });
    const item = buildBudgetItem({ categoryId: "cat-1", allocatedAmount: 500, notes: "Rent" });

    prismaMock.budget.findFirst.mockResolvedValue(budget as any);
    prismaMock.category.findUnique.mockResolvedValue(category as any);
    prismaMock.budgetItem.create.mockResolvedValue({
      ...item,
      category: { id: "cat-1", name: "Housing", color: "#FF0000", icon: "home" },
    } as any);

    const result = await budgetService.addBudgetItem("budget-1", "user-1", {
      categoryId: "cat-1",
      allocatedAmount: 500,
      notes: "Rent",
    });

    expect(prismaMock.budgetItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          budgetId: "budget-1",
          categoryId: "cat-1",
          allocatedAmount: 500,
          notes: "Rent",
        }),
      })
    );
    expect(result.allocatedAmount).toBe(500);
  });

  it("throws NotFoundError when budget not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(
      budgetService.addBudgetItem("missing", "user-1", {
        categoryId: "cat-1",
        allocatedAmount: 500,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when category not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(buildBudget() as any);
    prismaMock.category.findUnique.mockResolvedValue(null);

    await expect(
      budgetService.addBudgetItem("budget-1", "user-1", {
        categoryId: "missing",
        allocatedAmount: 500,
      })
    ).rejects.toThrow("Category not found");
  });

  it("throws ValidationError when category is not expense type", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(buildBudget() as any);
    prismaMock.category.findUnique.mockResolvedValue(
      buildCategory({ type: "income" }) as any
    );

    await expect(
      budgetService.addBudgetItem("budget-1", "user-1", {
        categoryId: "cat-1",
        allocatedAmount: 500,
      })
    ).rejects.toThrow("Budget items must be expense categories");
  });
});

describe("budgetService.updateBudgetItem", () => {
  it("updates budget item", async () => {
    const item = buildBudgetItem({ allocatedAmount: 500 });
    prismaMock.budgetItem.findUnique.mockResolvedValue({
      ...item,
      budget: { userId: "user-1" },
    } as any);
    prismaMock.budgetItem.update.mockResolvedValue({
      ...item,
      allocatedAmount: 750,
      category: { id: "cat-1", name: "Housing", color: "#FF0000", icon: "home" },
    } as any);

    const result = await budgetService.updateBudgetItem("item-1", "user-1", {
      allocatedAmount: 750,
      notes: "Updated rent",
    });

    expect(prismaMock.budgetItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1" },
        data: expect.objectContaining({
          allocatedAmount: 750,
          notes: "Updated rent",
        }),
      })
    );
  });

  it("throws NotFoundError when item not found", async () => {
    prismaMock.budgetItem.findUnique.mockResolvedValue(null);
    await expect(
      budgetService.updateBudgetItem("missing", "user-1", { allocatedAmount: 100 })
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when user does not own budget", async () => {
    prismaMock.budgetItem.findUnique.mockResolvedValue({
      ...buildBudgetItem(),
      budget: { userId: "other-user" },
    } as any);

    await expect(
      budgetService.updateBudgetItem("item-1", "user-1", { allocatedAmount: 100 })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("budgetService.deleteBudgetItem", () => {
  it("deletes budget item", async () => {
    const item = buildBudgetItem();
    prismaMock.budgetItem.findUnique.mockResolvedValue({
      ...item,
      budget: { userId: "user-1" },
    } as any);
    prismaMock.budgetItem.delete.mockResolvedValue(item as any);

    const result = await budgetService.deleteBudgetItem("item-1", "user-1");

    expect(prismaMock.budgetItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    expect(result.message).toBe("Budget item deleted successfully");
  });

  it("throws NotFoundError when item not found", async () => {
    prismaMock.budgetItem.findUnique.mockResolvedValue(null);
    await expect(budgetService.deleteBudgetItem("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("budgetService.removeCategoryFromBudget", () => {
  it("removes all items for category from budget", async () => {
    const budget = buildBudget();
    prismaMock.budget.findFirst.mockResolvedValue(budget as any);
    prismaMock.budgetItem.deleteMany.mockResolvedValue({ count: 3 } as any);

    const result = await budgetService.removeCategoryFromBudget("budget-1", "user-1", "cat-1");

    expect(prismaMock.budgetItem.deleteMany).toHaveBeenCalledWith({
      where: {
        budgetId: "budget-1",
        categoryId: "cat-1",
      },
    });
    expect(result.message).toBe("Removed 3 item(s) from budget");
  });

  it("throws NotFoundError when budget not found", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(
      budgetService.removeCategoryFromBudget("missing", "user-1", "cat-1")
    ).rejects.toThrow(NotFoundError);
  });
});
