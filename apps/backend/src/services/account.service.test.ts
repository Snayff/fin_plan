import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildAccount, buildTransaction, buildCategory } from "../test/fixtures";

vi.mock("../config/database", () => ({
  prisma: prismaMock,
}));

vi.mock("../utils/balance.utils", () => ({
  calculateAccountBalance: vi.fn().mockResolvedValue(1000),
  calculateAccountBalances: vi.fn().mockResolvedValue(new Map([["acc-1", 1000]])),
  calculateAccountsBalanceHistory: vi.fn().mockResolvedValue(new Map()),
  calculateAccountsMonthlyFlow: vi.fn().mockResolvedValue(new Map()),
}));

import { accountService } from "./account.service";
import { NotFoundError, ValidationError } from "../utils/errors";

beforeEach(() => {
  resetPrismaMocks();
  vi.clearAllMocks();
});

describe("accountService.getUserAccounts", () => {
  it("returns accounts with calculated balances", async () => {
    const account = buildAccount({ id: "acc-1" });
    prismaMock.account.findMany.mockResolvedValue([account]);

    const result = await accountService.getUserAccounts("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe(1000);
  });

  it("returns empty array when user has no accounts", async () => {
    prismaMock.account.findMany.mockResolvedValue([]);
    const result = await accountService.getUserAccounts("user-1");
    expect(result).toEqual([]);
  });
});

describe("accountService.getAccountById", () => {
  it("returns account with balance", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    const result = await accountService.getAccountById("acc-1", "user-1");
    expect(result).toHaveProperty("balance");
  });

  it("throws NotFoundError when account not found", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(accountService.getAccountById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("accountService.createAccount", () => {
  it("creates account and opening balance transaction via $transaction", async () => {
    const category = buildCategory({ id: "cat-1", name: "Opening Balance", isSystemCategory: true });
    prismaMock.category.findFirst.mockResolvedValue(category);
    const newAccount = buildAccount({ id: "new-acc" });
    prismaMock.account.create.mockResolvedValue(newAccount);
    prismaMock.transaction.create.mockResolvedValue(buildTransaction());

    const result = await accountService.createAccount("user-1", {
      name: "New Account",
      type: "current" as any,
      currency: "GBP",
      openingBalance: 500,
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toHaveProperty("balance");
  });

  it("skips opening balance transaction when openingBalance is 0", async () => {
    const category = buildCategory({ id: "cat-1", name: "Opening Balance", isSystemCategory: true });
    prismaMock.category.findFirst.mockResolvedValue(category);
    const newAccount = buildAccount();
    prismaMock.account.create.mockResolvedValue(newAccount);

    await accountService.createAccount("user-1", {
      name: "New Account",
      type: "current" as any,
      currency: "GBP",
      openingBalance: 0,
    });

    // Transaction.create should not be called inside the $transaction callback
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it("throws ValidationError for empty name", async () => {
    await expect(
      accountService.createAccount("user-1", { name: "", type: "current" as any, currency: "GBP" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for empty currency", async () => {
    await expect(
      accountService.createAccount("user-1", { name: "Test", type: "current" as any, currency: "" })
    ).rejects.toThrow(ValidationError);
  });
});

describe("accountService.updateAccount", () => {
  it("updates account and returns with balance", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount({ metadata: {} }));
    prismaMock.account.update.mockResolvedValue(buildAccount({ name: "Updated" }));

    const result = await accountService.updateAccount("acc-1", "user-1", { name: "Updated" });
    expect(result).toHaveProperty("balance");
    expect(prismaMock.account.update).toHaveBeenCalled();
  });

  it("throws NotFoundError when account not found", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(accountService.updateAccount("missing", "user-1", { name: "X" })).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError for empty name", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    await expect(accountService.updateAccount("acc-1", "user-1", { name: "" })).rejects.toThrow(ValidationError);
  });
});

describe("accountService.deleteAccount", () => {
  it("soft-deletes when account has transactions", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    prismaMock.transaction.count.mockResolvedValue(5);
    prismaMock.account.update.mockResolvedValue(buildAccount({ isActive: false }));

    const result = await accountService.deleteAccount("acc-1", "user-1");

    expect(result.soft).toBe(true);
    expect(prismaMock.account.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    expect(prismaMock.account.delete).not.toHaveBeenCalled();
  });

  it("hard-deletes when account has no transactions", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    prismaMock.transaction.count.mockResolvedValue(0);

    const result = await accountService.deleteAccount("acc-1", "user-1");

    expect(result.soft).toBe(false);
    expect(prismaMock.account.delete).toHaveBeenCalled();
  });

  it("throws NotFoundError when account not found", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(accountService.deleteAccount("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("accountService.getAccountSummary", () => {
  it("returns summary with transaction count and recent transactions", async () => {
    prismaMock.account.findFirst.mockResolvedValue({
      ...buildAccount(),
      _count: { transactions: 10 },
    });
    prismaMock.transaction.findMany.mockResolvedValue([buildTransaction()]);

    const result = await accountService.getAccountSummary("acc-1", "user-1");

    expect(result.transactionCount).toBe(10);
    expect(result.recentTransactions).toHaveLength(1);
    expect(result.account).toHaveProperty("balance");
  });

  it("throws NotFoundError when account not found", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(accountService.getAccountSummary("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});
