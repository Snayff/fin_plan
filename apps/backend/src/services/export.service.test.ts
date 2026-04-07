import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember, buildHousehold } from "../test/fixtures";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { exportService } from "./export.service";
import { AuthorizationError, NotFoundError } from "../utils/errors";

beforeEach(() => resetPrismaMocks());

describe("exportService.exportHousehold", () => {
  it("rejects non-owners", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "member" }));
    await expect(exportService.exportHousehold("household-1", "user-1")).rejects.toThrow(
      AuthorizationError
    );
  });

  it("rejects when household not found", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.household.findUnique.mockResolvedValue(null);
    await expect(exportService.exportHousehold("missing", "user-1")).rejects.toThrow(NotFoundError);
  });

  it("returns a valid export envelope for an empty household", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.household.findUnique.mockResolvedValue(buildHousehold({ name: "Test Household" }));
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.member.findMany.mockResolvedValue([]);
    prismaMock.subcategory.findMany.mockResolvedValue([]);
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.asset.findMany.mockResolvedValue([]);
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.purchaseItem.findMany.mockResolvedValue([]);
    prismaMock.plannerYearBudget.findMany.mockResolvedValue([]);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);

    const result = await exportService.exportHousehold("household-1", "user-1");

    expect(result.schemaVersion).toBe(1);
    expect(result.household.name).toBe("Test Household");
    expect(result.members).toEqual([]);
    expect(result.subcategories).toEqual([]);
    expect(result.incomeSources).toEqual([]);
    expect(result.exportedAt).toMatch(/T/);
  });

  it("validates against householdExportSchema", async () => {
    const { householdExportSchema } = await import("@finplan/shared");
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.household.findUnique.mockResolvedValue(buildHousehold({ name: "Test" }));
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.member.findMany.mockResolvedValue([]);
    prismaMock.subcategory.findMany.mockResolvedValue([]);
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.asset.findMany.mockResolvedValue([]);
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.purchaseItem.findMany.mockResolvedValue([]);
    prismaMock.plannerYearBudget.findMany.mockResolvedValue([]);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);

    const result = await exportService.exportHousehold("household-1", "user-1");
    const parsed = householdExportSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
