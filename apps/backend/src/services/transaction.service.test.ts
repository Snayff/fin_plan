import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildTransaction, buildAccount, buildCategory } from "../test/fixtures";

vi.mock("../config/database", () => ({
  prisma: prismaMock,
}));

import { transactionService } from "./transaction.service";
import { NotFoundError, ValidationError } from "../utils/errors";

beforeEach(() => {
  resetPrismaMocks();
  vi.clearAllMocks();
});

describe("transactionService.getTransactions", () => {
  it("returns transactions with pagination", async () => {
    const txns = [buildTransaction(), buildTransaction()];
    prismaMock.transaction.count.mockResolvedValue(2);
    prismaMock.transaction.findMany.mockResolvedValue(txns);

    const result = await transactionService.getTransactions("user-1");

    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("applies accountId filter", async () => {
    prismaMock.transaction.count.mockResolvedValue(0);
    prismaMock.transaction.findMany.mockResolvedValue([]);

    await transactionService.getTransactions("user-1", { accountId: "acc-1" });

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: "acc-1" }),
      })
    );
  });

  it("applies date range filters", async () => {
    prismaMock.transaction.count.mockResolvedValue(0);
    prismaMock.transaction.findMany.mockResolvedValue([]);

    await transactionService.getTransactions("user-1", {
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it("supports pagination options", async () => {
    prismaMock.transaction.count.mockResolvedValue(100);
    prismaMock.transaction.findMany.mockResolvedValue([]);

    const result = await transactionService.getTransactions("user-1", {}, { limit: 10, offset: 20 });

    expect(result.pagination.hasMore).toBe(true);
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
  });
});

describe("transactionService.getTransactionById", () => {
  it("returns transaction when found", async () => {
    const txn = buildTransaction();
    prismaMock.transaction.findFirst.mockResolvedValue(txn);
    const result = await transactionService.getTransactionById("tx-1", "user-1");
    expect(result).toEqual(txn);
  });

  it("throws NotFoundError when not found", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    await expect(transactionService.getTransactionById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("transactionService.createTransaction", () => {
  const validInput = {
    accountId: "acc-1",
    date: "2025-01-15",
    amount: 100,
    type: "expense" as any,
    name: "Test Transaction",
  };

  it("creates transaction for valid input", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    const txn = buildTransaction();
    prismaMock.transaction.create.mockResolvedValue(txn);

    const result = await transactionService.createTransaction("user-1", validInput);
    expect(prismaMock.transaction.create).toHaveBeenCalled();
    expect(result).toEqual(txn);
  });

  it("throws ValidationError for missing accountId", async () => {
    await expect(
      transactionService.createTransaction("user-1", { ...validInput, accountId: "" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for missing name", async () => {
    await expect(
      transactionService.createTransaction("user-1", { ...validInput, name: "" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when account not found", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(transactionService.createTransaction("user-1", validInput)).rejects.toThrow(NotFoundError);
  });

  it("verifies category exists when provided", async () => {
    prismaMock.account.findFirst.mockResolvedValue(buildAccount());
    prismaMock.category.findUnique.mockResolvedValue(null);

    await expect(
      transactionService.createTransaction("user-1", { ...validInput, categoryId: "cat-1" })
    ).rejects.toThrow("Category not found");
  });
});

describe("transactionService.deleteTransaction", () => {
  it("deletes transaction successfully", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(buildTransaction());
    const result = await transactionService.deleteTransaction("tx-1", "user-1");
    expect(prismaMock.transaction.delete).toHaveBeenCalled();
    expect(result.message).toContain("deleted");
  });

  it("throws NotFoundError when not found", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    await expect(transactionService.deleteTransaction("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("transactionService.getTransactionSummary", () => {
  it("returns correct income/expense totals", async () => {
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: 10 })  // income
      .mockResolvedValueOnce({ _sum: { amount: 3000 }, _count: 15 }); // expense
    prismaMock.transaction.count.mockResolvedValue(25);

    const result = await transactionService.getTransactionSummary("user-1");

    expect(result.income.total).toBe(5000);
    expect(result.income.count).toBe(10);
    expect(result.expense.total).toBe(3000);
    expect(result.expense.count).toBe(15);
    expect(result.netCashFlow).toBe(2000);
    expect(result.totalTransactions).toBe(25);
  });
});
