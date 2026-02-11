import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildAsset, buildAssetValueHistory } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { assetService } from "./asset.service";
import { NotFoundError, ValidationError } from "../utils/errors";

beforeEach(() => {
  resetPrismaMocks();
});

describe("assetService.createAsset", () => {
  const validInput = {
    name: "Property",
    type: "real_estate" as any,
    currentValue: 250000,
    liquidityType: "illiquid" as any,
  };

  it("creates asset and initial value history entry via $transaction", async () => {
    const asset = buildAsset();
    prismaMock.asset.create.mockResolvedValue(asset);
    prismaMock.assetValueHistory.create.mockResolvedValue(buildAssetValueHistory());

    const result = await assetService.createAsset("user-1", validInput);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.asset.create).toHaveBeenCalled();
    expect(prismaMock.assetValueHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          value: 250000,
          source: "manual",
        }),
      })
    );
    expect(result).toEqual(asset);
  });

  it("throws ValidationError for empty name", async () => {
    await expect(assetService.createAsset("user-1", { ...validInput, name: "" })).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for negative currentValue", async () => {
    await expect(assetService.createAsset("user-1", { ...validInput, currentValue: -1 })).rejects.toThrow(
      "Current value must be non-negative"
    );
  });

  it("verifies accountId belongs to user when provided", async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);
    await expect(
      assetService.createAsset("user-1", { ...validInput, accountId: "acc-1" })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("assetService.getAssetById", () => {
  it("returns asset when found", async () => {
    const asset = buildAsset();
    prismaMock.asset.findFirst.mockResolvedValue(asset);
    const result = await assetService.getAssetById("asset-1", "user-1");
    expect(result).toEqual(asset);
  });

  it("throws NotFoundError when not found", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(null);
    await expect(assetService.getAssetById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("assetService.updateAssetValue", () => {
  it("updates value and creates history entry via $transaction", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(buildAsset());
    const updatedAsset = buildAsset({ currentValue: 300000 });
    prismaMock.asset.update.mockResolvedValue(updatedAsset);
    prismaMock.assetValueHistory.create.mockResolvedValue(buildAssetValueHistory({ value: 300000 }));

    const result = await assetService.updateAssetValue("asset-1", "user-1", 300000);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { currentValue: 300000 } })
    );
    expect(prismaMock.assetValueHistory.create).toHaveBeenCalled();
  });

  it("throws NotFoundError when asset not found", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(null);
    await expect(assetService.updateAssetValue("missing", "user-1", 300000)).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError for negative value", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(buildAsset());
    await expect(assetService.updateAssetValue("asset-1", "user-1", -100)).rejects.toThrow(
      "Value must be non-negative"
    );
  });
});

describe("assetService.deleteAsset", () => {
  it("deletes asset successfully", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(buildAsset());
    const result = await assetService.deleteAsset("asset-1", "user-1");
    expect(prismaMock.asset.delete).toHaveBeenCalled();
    expect(result.message).toContain("deleted");
  });

  it("throws NotFoundError when asset not found", async () => {
    prismaMock.asset.findFirst.mockResolvedValue(null);
    await expect(assetService.deleteAsset("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("assetService.getAssetSummary", () => {
  it("returns correct totals and gain calculations", async () => {
    prismaMock.asset.findMany.mockResolvedValue([
      buildAsset({ currentValue: 300000, purchaseValue: 200000, type: "real_estate" }),
      buildAsset({ currentValue: 50000, purchaseValue: 40000, type: "investment" }),
    ]);

    const result = await assetService.getAssetSummary("user-1");

    expect(result.totalValue).toBe(350000);
    expect(result.totalGain).toBe(110000); // (300000-200000) + (50000-40000)
    expect(result.totalGainPercent).toBeCloseTo(45.83, 1); // 110000/240000 * 100
    expect(result.byType).toHaveLength(2);
  });

  it("returns zeros when user has no assets", async () => {
    prismaMock.asset.findMany.mockResolvedValue([]);
    const result = await assetService.getAssetSummary("user-1");
    expect(result.totalValue).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.byType).toEqual([]);
  });

  it("handles assets without purchase value", async () => {
    prismaMock.asset.findMany.mockResolvedValue([
      buildAsset({ currentValue: 100000, purchaseValue: null }),
    ]);

    const result = await assetService.getAssetSummary("user-1");
    expect(result.totalValue).toBe(100000);
    expect(result.totalGain).toBe(0);
  });
});
