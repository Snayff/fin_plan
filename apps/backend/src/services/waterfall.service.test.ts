import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { waterfallService } = await import("./waterfall.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("waterfallService.confirmIncome", () => {
  it("updates lastReviewedAt to current timestamp", async () => {
    const id = "inc-1";
    const householdId = "hh-1";
    const now = new Date();

    prismaMock.incomeSource.findUnique.mockResolvedValue({ id, householdId, amount: 3000 } as any);
    prismaMock.incomeSource.update.mockResolvedValue({ id, lastReviewedAt: now } as any);

    const result = await waterfallService.confirmIncome(householdId, id);

    expect(prismaMock.incomeSource.update).toHaveBeenCalledWith({
      where: { id },
      data: { lastReviewedAt: expect.any(Date) },
    });
    expect(result).toMatchObject({ id });
  });
});

describe("waterfallService.confirmBatch", () => {
  it("updates lastReviewedAt on all specified items", async () => {
    const householdId = "hh-1";
    const items = [
      { type: "income_source" as const, id: "inc-1" },
      { type: "committed_bill" as const, id: "bill-1" },
    ];

    await waterfallService.confirmBatch(householdId, { items });

    expect(prismaMock.incomeSource.updateMany).toHaveBeenCalledWith({
      where: { id: "inc-1", householdId },
      data: { lastReviewedAt: expect.any(Date) },
    });
    expect(prismaMock.committedBill.updateMany).toHaveBeenCalledWith({
      where: { id: "bill-1", householdId },
      data: { lastReviewedAt: expect.any(Date) },
    });
  });
});

describe("waterfallService.updateIncome", () => {
  it("records history when amount changes", async () => {
    const id = "inc-1";
    const householdId = "hh-1";

    prismaMock.incomeSource.findUnique.mockResolvedValue({
      id,
      householdId,
      amount: 3000,
    } as any);
    prismaMock.incomeSource.update.mockResolvedValue({ id, amount: 3500 } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    await waterfallService.updateIncome(householdId, id, { amount: 3500 });

    expect(prismaMock.waterfallHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "income_source",
        itemId: id,
        value: 3500,
      }),
    });
  });

  it("does not record history when amount is unchanged", async () => {
    const id = "inc-1";
    const householdId = "hh-1";

    prismaMock.incomeSource.findUnique.mockResolvedValue({
      id,
      householdId,
      amount: 3000,
    } as any);
    prismaMock.incomeSource.update.mockResolvedValue({ id, amount: 3000 } as any);

    await waterfallService.updateIncome(householdId, id, { name: "Salary" });

    expect(prismaMock.waterfallHistory.create).not.toHaveBeenCalled();
  });
});

describe("waterfallService.getWaterfallSummary — income.byType", () => {
  const makeSource = (overrides: object) => ({
    id: "s1",
    householdId: "hh-1",
    name: "Source",
    amount: 1000,
    frequency: "monthly" as const,
    incomeType: "other" as const,
    expectedMonth: null,
    ownerId: null,
    sortOrder: 0,
    endedAt: null,
    lastReviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    prismaMock.committedBill.findMany.mockResolvedValue([]);
    prismaMock.yearlyBill.findMany.mockResolvedValue([]);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([]);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([]);
  });

  it("groups monthly and annual sources by incomeType", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", incomeType: "salary", amount: 5000 }),
      makeSource({ id: "s2", frequency: "annual", incomeType: "dividends", amount: 12000 }),
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    const salaryGroup = summary.income.byType.find((g) => g.type === "salary");
    expect(salaryGroup).toBeDefined();
    expect(salaryGroup!.monthlyTotal).toBe(5000);
    expect(salaryGroup!.sources).toHaveLength(1);

    const divGroup = summary.income.byType.find((g) => g.type === "dividends");
    expect(divGroup).toBeDefined();
    expect(divGroup!.monthlyTotal).toBe(1000); // 12000 / 12
  });

  it("excludes one_off sources from byType", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "one_off", incomeType: "other", amount: 2000 }),
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");
    expect(summary.income.byType).toHaveLength(0);
  });

  it("uses canonical label for each type", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", incomeType: "freelance", amount: 1000 }),
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");
    expect(summary.income.byType[0]!.label).toBe("Freelance");
  });
});

describe("waterfallService.getWaterfallSummary — totals and surplus", () => {
  const makeSource = (overrides: object) => ({
    id: "s1",
    householdId: "hh-1",
    name: "Source",
    amount: 1000,
    frequency: "monthly" as const,
    incomeType: "other" as const,
    expectedMonth: null,
    ownerId: null,
    sortOrder: 0,
    endedAt: null,
    lastReviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it("counts monthly income at face value and annual income at amount/12", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 3000 }),
      makeSource({ id: "s2", frequency: "annual", amount: 24000 }),
    ] as any);
    prismaMock.committedBill.findMany.mockResolvedValue([]);
    prismaMock.yearlyBill.findMany.mockResolvedValue([]);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([]);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // 3000 (monthly) + 24000/12 (annual) = 5000
    expect(summary.income.total).toBe(5000);
  });

  it("excludes one_off sources from income total", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 2000 }),
      makeSource({ id: "s2", frequency: "one_off", amount: 5000 }),
    ] as any);
    prismaMock.committedBill.findMany.mockResolvedValue([]);
    prismaMock.yearlyBill.findMany.mockResolvedValue([]);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([]);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.income.total).toBe(2000);
    expect(summary.income.oneOff).toHaveLength(1);
  });

  it("calculates committed monthlyTotal and monthlyAvg12 correctly", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedBill.findMany.mockResolvedValue([
      { id: "b1", householdId: "hh-1", name: "Rent", amount: 1200 },
      { id: "b2", householdId: "hh-1", name: "Internet", amount: 50 },
    ] as any);
    prismaMock.yearlyBill.findMany.mockResolvedValue([
      { id: "y1", householdId: "hh-1", name: "Insurance", amount: 600, dueMonth: 3 },
    ] as any);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([]);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.committed.monthlyTotal).toBe(1250); // 1200 + 50
    expect(summary.committed.monthlyAvg12).toBe(50); // 600 / 12
  });

  it("calculates surplus amount and percentOfIncome", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 4000 }),
    ] as any);
    prismaMock.committedBill.findMany.mockResolvedValue([
      { id: "b1", householdId: "hh-1", name: "Rent", amount: 1200 },
    ] as any);
    prismaMock.yearlyBill.findMany.mockResolvedValue([
      { id: "y1", householdId: "hh-1", name: "Car tax", amount: 1200, dueMonth: 6 },
    ] as any);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([
      { id: "d1", householdId: "hh-1", name: "Groceries", monthlyBudget: 500 },
    ] as any);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([
      { id: "sv1", householdId: "hh-1", name: "Emergency fund", monthlyAmount: 200 },
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // income: 4000
    // committed: 1200 (bills) + 100 (1200/12 yearly) = 1300
    // discretionary: 500 + 200 = 700
    // surplus: 4000 - 1300 - 700 = 2000
    expect(summary.surplus.amount).toBe(2000);
    expect(summary.surplus.percentOfIncome).toBe(50); // 2000/4000 * 100
  });

  it("returns percentOfIncome of 0 when income total is 0", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedBill.findMany.mockResolvedValue([]);
    prismaMock.yearlyBill.findMany.mockResolvedValue([]);
    prismaMock.discretionaryCategory.findMany.mockResolvedValue([]);
    prismaMock.savingsAllocation.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.surplus.percentOfIncome).toBe(0);
  });
});

describe("waterfallService.getCashflow", () => {
  it("correctly calculates pot and marks shortfalls", async () => {
    prismaMock.yearlyBill.findMany.mockResolvedValue([
      { id: "bill-1", name: "Insurance", amount: 1200, dueMonth: 1 },
    ] as any);
    prismaMock.incomeSource.findMany.mockResolvedValue([]);

    const months = await waterfallService.getCashflow("hh-1", 2026);

    // Monthly contribution = 1200/12 = 100
    // Month 1: pot = 100 - 1200 = -1100 → shortfall
    expect(months[0]!.potAfter).toBe(-1100);
    expect(months[0]!.shortfall).toBe(true);

    // Month 2: pot = -1100 + 100 = -1000 (no bills)
    expect(months[1]!.potAfter).toBe(-1000);
    expect(months[1]!.shortfall).toBe(true);
  });
});
