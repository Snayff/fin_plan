import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { subcategoryService } = await import("./subcategory.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("subcategoryService.seedDefaults", () => {
  it("creates default subcategories for all three tiers", async () => {
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.seedDefaults("hh-1");

    expect(prismaMock.subcategory.createMany).toHaveBeenCalledTimes(1);
    const call = prismaMock.subcategory.createMany.mock.calls[0]![0] as any;
    const data = call.data as any[];

    // Income: Salary, Dividends, Other = 3
    const incomeRows = data.filter((r: any) => r.tier === "income");
    expect(incomeRows).toHaveLength(3);
    expect(incomeRows.map((r: any) => r.name)).toEqual(["Salary", "Dividends", "Other"]);

    // Committed: Housing, Utilities, Services, Other = 4
    const committedRows = data.filter((r: any) => r.tier === "committed");
    expect(committedRows).toHaveLength(4);

    // Discretionary: Food, Fun, Clothes, Gifts (locked), Savings, Other = 6
    const discRows = data.filter((r: any) => r.tier === "discretionary");
    expect(discRows).toHaveLength(6);
    const giftsRow = discRows.find((r: any) => r.name === "Gifts");
    expect(giftsRow.isLocked).toBe(true);
  });

  it("sets correct sortOrder per tier", async () => {
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.seedDefaults("hh-1");

    const call = prismaMock.subcategory.createMany.mock.calls[0]![0] as any;
    const data = call.data as any[];
    const incomeRows = data.filter((r: any) => r.tier === "income");
    expect(incomeRows[0].sortOrder).toBe(0);
    expect(incomeRows[1].sortOrder).toBe(1);
    expect(incomeRows[2].sortOrder).toBe(2);
  });
});

describe("subcategoryService.ensureSubcategories", () => {
  it("seeds defaults when no subcategories exist", async () => {
    prismaMock.subcategory.count.mockResolvedValue(0);
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.ensureSubcategories("hh-1");

    expect(prismaMock.subcategory.createMany).toHaveBeenCalledTimes(1);
  });

  it("does nothing when subcategories already exist", async () => {
    prismaMock.subcategory.count.mockResolvedValue(12);

    await subcategoryService.ensureSubcategories("hh-1");

    expect(prismaMock.subcategory.createMany).not.toHaveBeenCalled();
  });
});

describe("subcategoryService.listByTier", () => {
  it("returns subcategories for the specified tier", async () => {
    const subs = [
      { id: "sub-1", householdId: "hh-1", tier: "income", name: "Salary", sortOrder: 0 },
      { id: "sub-2", householdId: "hh-1", tier: "income", name: "Dividends", sortOrder: 1 },
    ];
    prismaMock.subcategory.findMany.mockResolvedValue(subs as any);

    const result = await subcategoryService.listByTier("hh-1", "income");

    expect(prismaMock.subcategory.findMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1", tier: "income" },
      orderBy: { sortOrder: "asc" },
    });
    expect(result).toHaveLength(2);
  });
});

describe("subcategoryService.getDefaultSubcategoryId", () => {
  it("returns the 'Other' subcategory id for the tier", async () => {
    prismaMock.subcategory.findFirst.mockResolvedValue({
      id: "sub-other",
      name: "Other",
      tier: "committed",
    } as any);

    const id = await subcategoryService.getDefaultSubcategoryId("hh-1", "committed");
    expect(id).toBe("sub-other");
  });
});
