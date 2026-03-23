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
