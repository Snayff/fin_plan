import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildCategory } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { categoryService } from "./category.service";

beforeEach(() => {
  resetPrismaMocks();
});

// ─── getUserCategories ────────────────────────────────────────────────────────

describe("categoryService.getUserCategories", () => {
  it("returns categories for the given householdId", async () => {
    const systemCat = buildCategory({ householdId: null, isSystemCategory: true });
    const customCat = buildCategory({ householdId: "household-1", isSystemCategory: false });
    prismaMock.category.findMany.mockResolvedValue([systemCat, customCat]);

    const result = await categoryService.getUserCategories("household-1");

    expect(result).toHaveLength(2);
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          parentCategoryId: null,
        }),
      })
    );
  });

  it("queries system categories (householdId null, isSystemCategory true) as one OR branch", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getUserCategories("household-42");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    const orBranches = callArg.where.OR;

    expect(orBranches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ householdId: null, isSystemCategory: true }),
        expect.objectContaining({ householdId: "household-42" }),
      ])
    );
  });

  it("only fetches top-level categories (parentCategoryId null)", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getUserCategories("household-1");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    expect(callArg.where.parentCategoryId).toBeNull();
  });

  it("returns an empty array when no categories exist", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    const result = await categoryService.getUserCategories("household-empty");

    expect(result).toEqual([]);
  });

  it("returns categories ordered by type, sortOrder, and name", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getUserCategories("household-1");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual([
      { type: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ]);
  });

  it('propagates database errors', async () => {
    prismaMock.category.findMany.mockRejectedValue(new Error('DB connection lost'));
    await expect(categoryService.getUserCategories('household-1')).rejects.toThrow('DB connection lost');
  });
});

// ─── getCategoriesByType ──────────────────────────────────────────────────────

describe("categoryService.getCategoriesByType", () => {
  it("returns only expense categories when type is 'expense'", async () => {
    const expenseCat = buildCategory({ type: "expense", householdId: "household-1" });
    prismaMock.category.findMany.mockResolvedValue([expenseCat]);

    const result = await categoryService.getCategoriesByType("household-1", "expense");

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("expense");
  });

  it("returns only income categories when type is 'income'", async () => {
    const incomeCat = buildCategory({ type: "income", householdId: "household-1" });
    prismaMock.category.findMany.mockResolvedValue([incomeCat]);

    const result = await categoryService.getCategoriesByType("household-1", "income");

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("income");
  });

  it("passes the type filter into both OR branches", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getCategoriesByType("household-1", "expense");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    const orBranches = callArg.where.OR;

    expect(orBranches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ householdId: null, isSystemCategory: true, type: "expense" }),
        expect.objectContaining({ householdId: "household-1", type: "expense" }),
      ])
    );
  });

  it("only fetches top-level categories (parentCategoryId null)", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getCategoriesByType("household-1", "expense");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    expect(callArg.where.parentCategoryId).toBeNull();
  });

  it("returns categories ordered by sortOrder and name", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await categoryService.getCategoriesByType("household-1", "expense");

    const callArg = prismaMock.category.findMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual([{ sortOrder: "asc" }, { name: "asc" }]);
  });

  it("returns an empty array when no matching categories exist", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    const result = await categoryService.getCategoriesByType("household-no-cats", "income");

    expect(result).toEqual([]);
  });

  it('propagates database errors', async () => {
    prismaMock.category.findMany.mockRejectedValue(new Error('DB connection lost'));
    await expect(categoryService.getCategoriesByType('household-1', 'expense')).rejects.toThrow('DB connection lost');
  });
});
