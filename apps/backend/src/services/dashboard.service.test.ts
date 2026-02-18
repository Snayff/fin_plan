import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildAccount, buildTransaction } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

mock.module("../utils/balance.utils", () => ({
  calculateAccountBalances: mock(() => Promise.resolve(new Map([["acc-1", 5000], ["acc-2", 3000]]))),
}));

import { dashboardService } from "./dashboard.service";

beforeEach(() => {
  resetPrismaMocks();
});

describe("dashboardService.getDashboardSummary", () => {
  it("returns net worth as cash + assets - liabilities", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      buildAccount({ id: "acc-1" }),
      buildAccount({ id: "acc-2" }),
    ]);

    // Income and expense aggregates
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 6000 }, _count: 5 })   // income
      .mockResolvedValueOnce({ _sum: { amount: 4000 }, _count: 10 }); // expense

    prismaMock.transaction.findMany.mockResolvedValue([]);

    prismaMock.transaction.groupBy.mockResolvedValue([]);

    // Assets: total value 100000
    prismaMock.asset.aggregate.mockResolvedValue({ _sum: { currentValue: 100000 }, _count: 2 });

    // Liabilities: total balance 50000
    prismaMock.liability.aggregate.mockResolvedValue({ _sum: { currentBalance: 50000 }, _count: 1 });

    const result = await dashboardService.getDashboardSummary("user-1");

    // totalCash = 5000 + 3000 = 8000
    expect(result.summary.totalBalance).toBe(8000);
    expect(result.summary.totalCash).toBe(8000);
    expect(result.summary.totalAssets).toBe(100000);
    expect(result.summary.totalLiabilities).toBe(50000);
    // netWorth = cash + assets - liabilities = 8000 + 100000 - 50000 = 58000
    expect(result.summary.netWorth).toBe(58000);
    expect(result.summary.netWorth).toBe(
      result.summary.totalCash + result.summary.totalAssets - result.summary.totalLiabilities
    );
  });

  it("calculates savings rate correctly", async () => {
    prismaMock.account.findMany.mockResolvedValue([buildAccount({ id: "acc-1" })]);
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 10000 }, _count: 5 })   // income
      .mockResolvedValueOnce({ _sum: { amount: 7000 }, _count: 10 });  // expense
    prismaMock.transaction.findMany.mockResolvedValue([]);
    prismaMock.transaction.groupBy.mockResolvedValue([]);
    prismaMock.asset.aggregate.mockResolvedValue({ _sum: { currentValue: 0 }, _count: 0 });
    prismaMock.liability.aggregate.mockResolvedValue({ _sum: { currentBalance: 0 }, _count: 0 });

    const result = await dashboardService.getDashboardSummary("user-1");

    // savingsRate = (10000 - 7000) / 10000 * 100 = 30%
    expect(result.summary.savingsRate).toBe("30.00");
  });

  it("returns savingsRate of 0 when no income", async () => {
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 })
      .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 });
    prismaMock.transaction.findMany.mockResolvedValue([]);
    prismaMock.transaction.groupBy.mockResolvedValue([]);
    prismaMock.asset.aggregate.mockResolvedValue({ _sum: { currentValue: null }, _count: 0 });
    prismaMock.liability.aggregate.mockResolvedValue({ _sum: { currentBalance: null }, _count: 0 });

    const result = await dashboardService.getDashboardSummary("user-1");
    expect(result.summary.savingsRate).toBe(0);
  });

  it("includes recent transactions and top categories", async () => {
    prismaMock.account.findMany.mockResolvedValue([buildAccount({ id: "acc-1" })]);
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: 3 })
      .mockResolvedValueOnce({ _sum: { amount: 3000 }, _count: 5 });

    const recentTxns = [buildTransaction(), buildTransaction()];
    prismaMock.transaction.findMany.mockResolvedValue(recentTxns);
    prismaMock.transaction.groupBy.mockResolvedValue([]);
    prismaMock.asset.aggregate.mockResolvedValue({ _sum: { currentValue: 0 }, _count: 0 });
    prismaMock.liability.aggregate.mockResolvedValue({ _sum: { currentBalance: 0 }, _count: 0 });

    const result = await dashboardService.getDashboardSummary("user-1");

    expect(result.recentTransactions).toHaveLength(2);
    expect(result.topCategories).toBeDefined();
  });
});

describe("dashboardService.getNetWorthTrend", () => {
  it("returns empty array when user has no accounts", async () => {
    prismaMock.account.findMany.mockResolvedValue([]);
    const result = await dashboardService.getNetWorthTrend("user-1");
    expect(result).toEqual([]);
  });

  it("returns monthly data points with correct structure", async () => {
    prismaMock.account.findMany.mockResolvedValue([buildAccount({ id: "acc-1" })]);

    const { calculateAccountBalances } = await import("../utils/balance.utils");
    (calculateAccountBalances as any).mockResolvedValue(new Map([["acc-1", 5000]]));

    prismaMock.asset.aggregate.mockResolvedValue({ _sum: { currentValue: 100000 } });
    prismaMock.liability.aggregate.mockResolvedValue({ _sum: { currentBalance: 50000 } });

    const result = await dashboardService.getNetWorthTrend("user-1", 3);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("cash");
    expect(result[0]).toHaveProperty("balance");
    expect(result[0]).toHaveProperty("assets");
    expect(result[0]).toHaveProperty("liabilities");
    expect(result[0]).toHaveProperty("netWorth");
    expect(result[0].netWorth).toBe((result[0].cash || 0) + (result[0].assets || 0) - (result[0].liabilities || 0));
  });
});

describe("dashboardService.getIncomeExpenseTrend", () => {
  it("groups transactions by month", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([
      buildTransaction({ date: new Date("2025-01-15"), amount: 1000, type: "income" }),
      buildTransaction({ date: new Date("2025-01-20"), amount: 500, type: "expense" }),
      buildTransaction({ date: new Date("2025-02-10"), amount: 2000, type: "income" }),
    ]);

    const result = await dashboardService.getIncomeExpenseTrend("user-1", 6);

    expect(result.length).toBeGreaterThanOrEqual(2);
    const jan = result.find((d) => d.month === "2025-01");
    expect(jan).toBeDefined();
    expect(jan!.income).toBe(1000);
    expect(jan!.expense).toBe(500);
    expect(jan!.net).toBe(500);
  });
});
