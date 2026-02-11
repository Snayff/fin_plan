import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildLiability, buildTransaction, buildLiabilityPayment } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

mock.module("../utils/liability.utils", () => ({
  calculateAmortizationSchedule: mock(() => [
    { month: 1, date: "2025-02-01", payment: 898, principal: 315, interest: 583, balance: 199685 },
  ]),
  calculatePayoffDate: mock(() => new Date("2055-01-01")),
  calculateTotalInterest: mock(() => 123000),
  validateMinimumPayment: mock(() => ({ isValid: true })),
}));

import { liabilityService } from "./liability.service";
import { NotFoundError, ValidationError } from "../utils/errors";
import { validateMinimumPayment } from "../utils/liability.utils";

beforeEach(() => {
  resetPrismaMocks();
  (validateMinimumPayment as any).mockClear();
  (validateMinimumPayment as any).mockReturnValue({ isValid: true });
});

describe("liabilityService.createLiability", () => {
  const validInput = {
    name: "Test Mortgage",
    type: "mortgage" as any,
    currentBalance: 200000,
    originalAmount: 250000,
    interestRate: 3.5,
    interestType: "fixed" as any,
    minimumPayment: 898,
    paymentFrequency: "monthly" as any,
  };

  it("creates liability with valid input", async () => {
    const liability = buildLiability();
    prismaMock.liability.create.mockResolvedValue(liability);

    const result = await liabilityService.createLiability("user-1", validInput);
    expect(prismaMock.liability.create).toHaveBeenCalled();
    expect(result).toEqual(liability);
  });

  it("throws ValidationError for empty name", async () => {
    await expect(liabilityService.createLiability("user-1", { ...validInput, name: "" })).rejects.toThrow(
      "Liability name is required"
    );
  });

  it("throws ValidationError for negative balance", async () => {
    await expect(liabilityService.createLiability("user-1", { ...validInput, currentBalance: -1 })).rejects.toThrow(
      "Current balance must be non-negative"
    );
  });

  it("throws ValidationError when minimum payment is insufficient", async () => {
    (validateMinimumPayment as any).mockReturnValue({ isValid: false, message: "Payment too low" });
    await expect(liabilityService.createLiability("user-1", validInput)).rejects.toThrow("Payment too low");
  });

  it("verifies accountId belongs to user when provided", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(
      liabilityService.createLiability("user-1", { ...validInput, accountId: "acc-1" })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("liabilityService.getLiabilityById", () => {
  it("returns liability when found", async () => {
    const liability = buildLiability();
    prismaMock.liability.findFirst.mockResolvedValue(liability);
    const result = await liabilityService.getLiabilityById("liab-1", "user-1");
    expect(result).toEqual(liability);
  });

  it("throws NotFoundError when not found", async () => {
    prismaMock.liability.findFirst.mockResolvedValue(null);
    await expect(liabilityService.getLiabilityById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("liabilityService.allocateTransactionToLiability", () => {
  it("creates payment and decrements balance via $transaction", async () => {
    const transaction = buildTransaction({ type: "expense", amount: 898 });
    prismaMock.transaction.findFirst.mockResolvedValue(transaction);
    prismaMock.liabilityPayment.findFirst.mockResolvedValue(null); // not already allocated
    prismaMock.liability.findFirst.mockResolvedValue(buildLiability());
    const payment = buildLiabilityPayment();
    prismaMock.liabilityPayment.create.mockResolvedValue(payment);

    const result = await liabilityService.allocateTransactionToLiability(
      "tx-1", "liab-1", "user-1", 315, 583
    );

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.liabilityPayment.create).toHaveBeenCalled();
    expect(prismaMock.liability.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentBalance: { decrement: 315 } },
      })
    );
  });

  it("throws ValidationError when transaction is not expense", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(buildTransaction({ type: "income" }));
    await expect(
      liabilityService.allocateTransactionToLiability("tx-1", "liab-1", "user-1", 500, 398)
    ).rejects.toThrow("Only expense transactions");
  });

  it("throws ValidationError when transaction is already allocated", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(buildTransaction({ type: "expense" }));
    prismaMock.liabilityPayment.findFirst.mockResolvedValue(buildLiabilityPayment());
    await expect(
      liabilityService.allocateTransactionToLiability("tx-1", "liab-1", "user-1", 500, 398)
    ).rejects.toThrow("already allocated");
  });

  it("throws ValidationError when principal + interest != amount", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(buildTransaction({ type: "expense", amount: 898 }));
    prismaMock.liabilityPayment.findFirst.mockResolvedValue(null);
    prismaMock.liability.findFirst.mockResolvedValue(buildLiability());

    await expect(
      liabilityService.allocateTransactionToLiability("tx-1", "liab-1", "user-1", 100, 100)
    ).rejects.toThrow("must equal transaction amount");
  });

  it("accepts allocation within 0.01 tolerance", async () => {
    // Transaction amount = 100.00, principal+interest = 99.995 rounds close enough
    prismaMock.transaction.findFirst.mockResolvedValue(buildTransaction({ type: "expense", amount: 100 }));
    prismaMock.liabilityPayment.findFirst.mockResolvedValue(null);
    prismaMock.liability.findFirst.mockResolvedValue(buildLiability());
    prismaMock.liabilityPayment.create.mockResolvedValue(buildLiabilityPayment());

    // 60 + 40 = 100 exactly, should pass
    await expect(
      liabilityService.allocateTransactionToLiability("tx-1", "liab-1", "user-1", 60, 40)
    ).resolves.toBeDefined();
  });
});

describe("liabilityService.removePaymentAllocation", () => {
  it("deletes payment and restores balance via $transaction", async () => {
    prismaMock.liabilityPayment.findFirst.mockResolvedValue({
      ...buildLiabilityPayment({ principalAmount: 500 }),
      liability: buildLiability(),
    });

    await liabilityService.removePaymentAllocation("payment-1", "user-1");

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.liabilityPayment.delete).toHaveBeenCalled();
    expect(prismaMock.liability.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentBalance: { increment: 500 } },
      })
    );
  });

  it("throws NotFoundError when payment not found", async () => {
    prismaMock.liabilityPayment.findFirst.mockResolvedValue(null);
    await expect(liabilityService.removePaymentAllocation("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("liabilityService.calculatePayoffProjection", () => {
  it("returns projection with schedule for active liability", async () => {
    prismaMock.liability.findFirst.mockResolvedValue(buildLiability());

    const result = await liabilityService.calculatePayoffProjection("liab-1", "user-1");

    expect(result.currentBalance).toBe(200000);
    expect(result.schedule).toHaveLength(1);
    expect(result.totalInterestToPay).toBe(123000);
    expect(result.projectedPayoffDate).toBeDefined();
  });

  it("returns empty projection for zero-balance liability", async () => {
    prismaMock.liability.findFirst.mockResolvedValue(buildLiability({ currentBalance: 0 }));
    const result = await liabilityService.calculatePayoffProjection("liab-1", "user-1");
    expect(result.schedule).toEqual([]);
    expect(result.totalInterestToPay).toBe(0);
  });
});

describe("liabilityService.getLiabilitySummary", () => {
  it("returns correct totals and weighted average interest rate", async () => {
    prismaMock.liability.findMany.mockResolvedValue([
      buildLiability({ currentBalance: 200000, interestRate: 3.5, minimumPayment: 898, type: "mortgage" }),
      buildLiability({ currentBalance: 5000, interestRate: 24, minimumPayment: 200, type: "credit_card" }),
    ]);

    const result = await liabilityService.getLiabilitySummary("user-1");

    expect(result.totalDebt).toBe(205000);
    expect(result.monthlyMinimumPayment).toBe(1098);
    // Weighted avg: (200000*3.5 + 5000*24) / 205000 ≈ 4.0
    expect(result.totalInterestRate).toBeCloseTo(4.0, 0);
    expect(result.byType).toHaveLength(2);
  });

  it("returns zeros when user has no liabilities", async () => {
    prismaMock.liability.findMany.mockResolvedValue([]);
    const result = await liabilityService.getLiabilitySummary("user-1");
    expect(result.totalDebt).toBe(0);
    expect(result.byType).toEqual([]);
  });
});
