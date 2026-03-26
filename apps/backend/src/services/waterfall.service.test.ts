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
      { type: "committed_item" as const, id: "bill-1" },
    ];

    await waterfallService.confirmBatch(householdId, { items });

    expect(prismaMock.incomeSource.updateMany).toHaveBeenCalledWith({
      where: { id: "inc-1", householdId },
      data: { lastReviewedAt: expect.any(Date) },
    });
    expect(prismaMock.committedItem.updateMany).toHaveBeenCalledWith({
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
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
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
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // 3000 (monthly) + 24000/12 (annual) = 5000
    expect(summary.income.total).toBe(5000);
  });

  it("excludes one_off sources from income total", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 2000 }),
      makeSource({ id: "s2", frequency: "one_off", amount: 5000 }),
    ] as any);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.income.total).toBe(2000);
    expect(summary.income.oneOff).toHaveLength(1);
  });

  it("calculates committed monthlyTotal and monthlyAvg12 correctly", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "b1", householdId: "hh-1", name: "Rent", amount: 1200, spendType: "monthly" },
      { id: "b2", householdId: "hh-1", name: "Internet", amount: 50, spendType: "monthly" },
      {
        id: "y1",
        householdId: "hh-1",
        name: "Insurance",
        amount: 600,
        spendType: "yearly",
        dueMonth: 3,
      },
    ] as any);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.committed.monthlyTotal).toBe(1250); // 1200 + 50
    expect(summary.committed.monthlyAvg12).toBe(50); // 600 / 12
  });

  it("calculates surplus amount and percentOfIncome", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 4000 }),
    ] as any);
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "b1", householdId: "hh-1", name: "Rent", amount: 1200, spendType: "monthly" },
      {
        id: "y1",
        householdId: "hh-1",
        name: "Car tax",
        amount: 1200,
        spendType: "yearly",
        dueMonth: 6,
      },
    ] as any);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([
      {
        id: "d1",
        householdId: "hh-1",
        name: "Groceries",
        amount: 500,
        spendType: "monthly",
        wealthAccountId: null,
      },
      {
        id: "sv1",
        householdId: "hh-1",
        name: "Emergency fund",
        amount: 200,
        spendType: "monthly",
        wealthAccountId: "wa-1",
      },
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // income: 4000
    // committed: 1200 (monthly) + 100 (1200/12 yearly) = 1300
    // discretionary: 500 + 200 = 700
    // surplus: 4000 - 1300 - 700 = 2000
    expect(summary.surplus.amount).toBe(2000);
    expect(summary.surplus.percentOfIncome).toBe(50); // 2000/4000 * 100
  });

  it("returns percentOfIncome of 0 when income total is 0", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.surplus.percentOfIncome).toBe(0);
  });
});

describe("waterfallService.getWaterfallSummary — toGBP rounding", () => {
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

  it("rounds surplus amount to 2dp", async () => {
    // 1000/3 = 333.333... per month — surplus should be rounded
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "annual", amount: 1000 }),
    ] as any);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // income: 1000/12 = 83.333... → toGBP → 83.33
    expect(summary.income.total).toBe(83.33);
    expect(summary.surplus.amount).toBe(83.33);
  });

  it("rounds percentOfIncome to 2dp", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 3000 }),
    ] as any);
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "b1", householdId: "hh-1", name: "Rent", amount: 1000, spendType: "monthly" },
      {
        id: "y1",
        householdId: "hh-1",
        name: "Insurance",
        amount: 1000,
        spendType: "yearly",
        dueMonth: 3,
      },
    ] as any);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // income: 3000
    // committed: 1000 bills + 1000/12 yearly = 1083.33
    // surplus: 3000 - 1083.33 = 1916.67
    // percent: (1916.67 / 3000) * 100 = 63.89
    expect(summary.surplus.amount).toBe(1916.67);
    expect(summary.surplus.percentOfIncome).toBe(63.89);
  });
});

describe("waterfallService.getCashflow", () => {
  it("correctly calculates pot and marks shortfalls", async () => {
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "bill-1", name: "Insurance", amount: 1200, spendType: "yearly", dueMonth: 1 },
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

describe("waterfallService.getWaterfallSummary — fixture scenarios", () => {
  it("returns zeroed summary for emptyHousehold", async () => {
    const { emptyHousehold } = await import("../test/fixtures/scenarios.js");

    prismaMock.incomeSource.findMany.mockResolvedValue(emptyHousehold.incomeSources);
    prismaMock.committedItem.findMany.mockResolvedValue(emptyHousehold.committedItems);
    prismaMock.discretionaryItem.findMany.mockResolvedValue(emptyHousehold.discretionaryItems);

    const summary = await waterfallService.getWaterfallSummary("hh-empty");

    expect(summary.income.total).toBe(0);
    expect(summary.surplus.amount).toBe(0);
  });

  it("computes correct totals for dualIncomeHousehold", async () => {
    const { dualIncomeHousehold } = await import("../test/fixtures/scenarios.js");

    prismaMock.incomeSource.findMany.mockResolvedValue(dualIncomeHousehold.incomeSources as any);
    prismaMock.committedItem.findMany.mockResolvedValue(dualIncomeHousehold.committedItems as any);
    prismaMock.discretionaryItem.findMany.mockResolvedValue(
      dualIncomeHousehold.discretionaryItems as any
    );

    const summary = await waterfallService.getWaterfallSummary("hh-dual");

    // 2 salaries: 3500 + 2800 = 6300
    expect(summary.income.total).toBe(6300);
    // committed monthly: 1200 + 45 = 1245, yearly avg: 600/12 = 50
    // discretionary: 500 + 150 + 200 = 850
    // surplus: 6300 - 1245 - 50 - 850 = 4155
    expect(summary.surplus.amount).toBe(4155);
  });
});
