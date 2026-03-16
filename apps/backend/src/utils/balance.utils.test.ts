import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildTransaction } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { endOfDay, calculateAccountsBalanceHistory } from "./balance.utils";

describe("endOfDay", () => {
  it("sets hours to 23:59:59.999", () => {
    const date = new Date("2025-06-15T10:30:00Z");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("does not mutate the original date", () => {
    const original = new Date("2025-06-15T10:30:00Z");
    const originalTime = original.getTime();
    endOfDay(original);
    expect(original.getTime()).toBe(originalTime);
  });

  it("handles midnight input", () => {
    const date = new Date("2025-06-15T00:00:00.000");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it("preserves the date (year, month, day)", () => {
    const date = new Date("2025-12-31T10:00:00Z");
    const result = endOfDay(date);
    expect(result.getFullYear()).toBe(date.getFullYear());
    expect(result.getMonth()).toBe(date.getMonth());
    expect(result.getDate()).toBe(date.getDate());
  });

  it("handles end of year", () => {
    const date = new Date("2025-12-31T23:59:59.000");
    const result = endOfDay(date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
    expect(result.getMilliseconds()).toBe(999);
  });
});

beforeEach(() => {
  resetPrismaMocks();
});

describe("calculateAccountsBalanceHistory", () => {
  it("returns empty map for empty accountIds", async () => {
    const result = await calculateAccountsBalanceHistory([], new Map());
    expect(result.size).toBe(0);
  });

  it("fetches all transactions in ONE query and computes weekly snapshots in memory", async () => {
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - 14); // account created 2 weeks ago

    prismaMock.transaction.findMany.mockResolvedValue([
      buildTransaction({
        accountId: "acc-1",
        amount: 1000,
        type: "income",
        date: new Date(createdAt),
      }),
      buildTransaction({
        accountId: "acc-1",
        amount: 200,
        type: "expense",
        date: new Date(createdAt),
      }),
    ]);

    const result = await calculateAccountsBalanceHistory(
      ["acc-1"],
      new Map([["acc-1", createdAt]]),
      30
    );

    // Only one findMany call regardless of snapshot count
    expect(prismaMock.transaction.findMany).toHaveBeenCalledTimes(1);

    const history = result.get("acc-1");
    expect(history).toBeDefined();
    expect(history!.length).toBeGreaterThan(0);

    // Final snapshot should reflect income - expense = 800
    const latestSnapshot = history![history!.length - 1];
    expect(latestSnapshot.balance).toBe(800);
  });

  it("does not bleed transactions between accounts", async () => {
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - 14);

    // acc-1 has income, acc-2 has expense — balances must not cross over
    prismaMock.transaction.findMany.mockResolvedValue([
      buildTransaction({ accountId: "acc-1", amount: 500, type: "income", date: new Date(createdAt) }),
      buildTransaction({ accountId: "acc-2", amount: 300, type: "expense", date: new Date(createdAt) }),
    ]);

    const creationDates = new Map([
      ["acc-1", createdAt],
      ["acc-2", createdAt],
    ]);

    const result = await calculateAccountsBalanceHistory(["acc-1", "acc-2"], creationDates, 30);

    const hist1 = result.get("acc-1")!;
    const hist2 = result.get("acc-2")!;

    const latest1 = hist1[hist1.length - 1];
    const latest2 = hist2[hist2.length - 1];

    expect(latest1.balance).toBe(500);   // acc-1: income only
    expect(latest2.balance).toBe(-300);  // acc-2: expense only
  });

  it("returns empty history for account with no creation date", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([]);
    const result = await calculateAccountsBalanceHistory(
      ["acc-1"],
      new Map(), // no creation date for acc-1
      30
    );
    const history = result.get("acc-1");
    expect(history).toEqual([]);
  });
});
