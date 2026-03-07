import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildAsset, buildLiability, buildTransaction } from "../test/fixtures";

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

  it("creates liability with a linked asset", async () => {
    const linkedAsset = buildAsset();
    prismaMock.asset.findFirst.mockResolvedValue(linkedAsset);
    prismaMock.liability.findFirst.mockResolvedValue(null);
    prismaMock.liability.create.mockResolvedValue(
      buildLiability({
        linkedAssetId: linkedAsset.id,
        linkedAsset: linkedAsset,
      })
    );

    const result = await liabilityService.createLiability("household-1", {
      name: "Linked Mortgage",
      type: "mortgage" as any,
      currentBalance: 200000,
      interestRate: 3.5,
      interestType: "fixed" as any,
      openDate: "2020-01-01",
      termEndDate: "2055-01-01",
      linkedAssetId: linkedAsset.id,
    });

    expect(prismaMock.asset.findFirst).toHaveBeenCalledWith({
      where: { id: linkedAsset.id, householdId: "household-1" },
    });
    expect(prismaMock.liability.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          linkedAssetId: linkedAsset.id,
        }),
      })
    );
    expect(result.linkedAsset?.id).toBe(linkedAsset.id);
    expect(result.linkedAsset?.currentValue).toBe(linkedAsset.currentValue);
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
        linkedAsset: buildAsset(),
        transactions: [buildTransaction({ type: "expense", amount: 300, date: new Date("2025-01-15") })],
      },
    ]);

    const result = await liabilityService.getUserLiabilitiesWithForecast("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].projectedBalanceAtTermEnd).toBeDefined();
    expect(result[0].projectedInterestAccrued).toBeDefined();
    expect(result[0].projectedTransactionImpact).toBeDefined();
    expect(result[0].linkedAsset?.id).toBeDefined();
  });

  it("returns projection for single liability", async () => {
    prismaMock.liability.findFirst.mockResolvedValue({
      ...buildLiability(),
      linkedAsset: buildAsset(),
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

  it("rejects linking an asset from another household", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(null);

    await expect(
      liabilityService.createLiability("household-1", {
        name: "Bad Mortgage",
        type: "mortgage" as any,
        currentBalance: 1000,
        interestRate: 3,
        interestType: "fixed" as any,
        openDate: "2025-01-01",
        termEndDate: "2030-01-01",
        linkedAssetId: "asset-foreign",
      })
    ).rejects.toThrow("Linked asset not found");
  });

  it("rejects linking an asset already linked elsewhere", async () => {
    const linkedAsset = buildAsset();
    prismaMock.asset.findFirst.mockResolvedValue(linkedAsset);
    prismaMock.liability.findFirst.mockResolvedValueOnce({
      id: "liab-other",
      name: "Existing Mortgage",
    });

    await expect(
      liabilityService.createLiability("household-1", {
        name: "Conflict Mortgage",
        type: "mortgage" as any,
        currentBalance: 1000,
        interestRate: 3,
        interestType: "fixed" as any,
        openDate: "2025-01-01",
        termEndDate: "2030-01-01",
        linkedAssetId: linkedAsset.id,
      })
    ).rejects.toThrow('Asset is already linked to liability "Existing Mortgage"');
  });

  it("updates liability link, supports keeping same link, and supports unlinking", async () => {
    const linkedAsset = buildAsset({ id: "asset-1" });
    prismaMock.liability.findFirst.mockResolvedValueOnce(
      buildLiability({ id: "liab-1", linkedAssetId: linkedAsset.id })
    );
    prismaMock.asset.findFirst.mockResolvedValueOnce(linkedAsset);
    prismaMock.liability.findFirst.mockResolvedValueOnce(null);
    prismaMock.liability.update.mockResolvedValue(
      buildLiability({
        id: "liab-1",
        linkedAssetId: linkedAsset.id,
        linkedAsset,
      })
    );

    const keepResult = await liabilityService.updateLiability("liab-1", "household-1", {
      linkedAssetId: linkedAsset.id,
    });

    expect(keepResult.linkedAsset?.id).toBe(linkedAsset.id);

    prismaMock.liability.findFirst.mockResolvedValueOnce(
      buildLiability({ id: "liab-1", linkedAssetId: linkedAsset.id })
    );
    prismaMock.liability.update.mockResolvedValueOnce(
      buildLiability({
        id: "liab-1",
        linkedAssetId: null,
        linkedAsset: null,
      })
    );

    const unlinkResult = await liabilityService.updateLiability("liab-1", "household-1", {
      linkedAssetId: null,
    });

    expect(prismaMock.liability.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          linkedAssetId: null,
        }),
      })
    );
    expect(unlinkResult.linkedAsset).toBeNull();
  });
});
