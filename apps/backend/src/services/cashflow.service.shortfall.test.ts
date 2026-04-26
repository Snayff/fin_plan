import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { cashflowService } = await import("./cashflow.service.js");

beforeEach(() => resetPrismaMocks());

function todayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

describe("cashflowService.getShortfallItems", () => {
  it("returns empty items + zero counts when household has no linked accounts", async () => {
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.asset.findMany.mockResolvedValue([]);
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);

    const result = await cashflowService.getShortfallItems("hh-1", { windowDays: 30 });

    expect(result.items).toEqual([]);
    expect(result.linkedAccountCount).toBe(0);
    expect(result.balanceToday).toBe(0);
  });

  it("returns no shortfall items when balance comfortably covers all events in window", async () => {
    const today = todayUtc();
    const due = new Date(today);
    due.setUTCDate(due.getUTCDate() + 5);

    prismaMock.account.findMany.mockResolvedValue([
      {
        id: "a1",
        type: "Current",
        isCashflowLinked: true,
        balances: [{ value: 5000, date: today, createdAt: today }],
      } as any,
    ]);
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "c1", name: "Mortgage", spendType: "monthly", dueDate: due } as any,
    ]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([
      {
        itemType: "committed_item",
        itemId: "c1",
        startDate: new Date("2020-01-01"),
        endDate: null,
        amount: 1200,
      } as any,
    ]);
    prismaMock.asset.findMany.mockResolvedValue([]);
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);

    const result = await cashflowService.getShortfallItems("hh-1", { windowDays: 30 });

    expect(result.items).toEqual([]);
    expect(result.linkedAccountCount).toBe(1);
    expect(result.balanceToday).toBe(5000);
  });
});
