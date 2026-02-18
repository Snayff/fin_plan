import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildLiability, buildTransaction } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { liabilityService } from "./liability.service";
import { NotFoundError, ValidationError } from "../utils/errors";

beforeEach(() => {
  resetPrismaMocks();
});

describe("liabilityService", () => {
  it("creates liability with valid payload", async () => {
    prismaMock.liability.create.mockResolvedValue(buildLiability());

    const result = await liabilityService.createLiability("user-1", {
      name: "Test Mortgage",
      type: "mortgage" as any,
      currentBalance: 200000,
      interestRate: 3.5,
      interestType: "fixed" as any,
      openDate: "2020-01-01",
      termEndDate: "2055-01-01",
    });

    expect(prismaMock.liability.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("rejects invalid term range", async () => {
    await expect(
      liabilityService.createLiability("user-1", {
        name: "Bad Liability",
        type: "mortgage" as any,
        currentBalance: 100,
        interestRate: 2,
        interestType: "fixed" as any,
        openDate: "2025-01-01",
        termEndDate: "2024-01-01",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("returns forecast-enhanced liabilities", async () => {
    prismaMock.liability.findMany.mockResolvedValue([
      {
        ...buildLiability(),
        transactions: [buildTransaction({ type: "expense", amount: 300, date: new Date("2025-01-15") })],
      },
    ]);

    const result = await liabilityService.getUserLiabilitiesWithForecast("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].projectedBalanceAtTermEnd).toBeDefined();
    expect(result[0].projectedInterestAccrued).toBeDefined();
    expect(result[0].projectedTransactionImpact).toBeDefined();
  });

  it("returns projection for single liability", async () => {
    prismaMock.liability.findFirst.mockResolvedValue({
      ...buildLiability(),
      transactions: [buildTransaction({ type: "expense", amount: 200 })],
    });

    const result = await liabilityService.calculateLiabilityProjection("liab-1", "user-1");
    expect(result.liabilityId).toBe("liab-1");
    expect(result.schedule.length).toBeGreaterThan(0);
  });

  it("throws not found when calculating missing liability projection", async () => {
    prismaMock.liability.findFirst.mockResolvedValue(null);
    await expect(liabilityService.calculateLiabilityProjection("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});
