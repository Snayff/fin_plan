import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember, buildHousehold } from "../test/fixtures";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { exportService } from "./export.service";
import { AuthorizationError, NotFoundError } from "../utils/errors";
import type { ActorCtx } from "./audit.service";

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
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue(null);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.giftEvent.findMany.mockResolvedValue([]);
    prismaMock.giftAllocation.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);

    const result = await exportService.exportHousehold("household-1", "user-1");

    expect(result.schemaVersion).toBe(2);
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
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue(null);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.giftEvent.findMany.mockResolvedValue([]);
    prismaMock.giftAllocation.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);

    const result = await exportService.exportHousehold("household-1", "user-1");
    const parsed = householdExportSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("writes one EXPORT_DATA audit row after a successful export", async () => {
    const ctx: ActorCtx = {
      householdId: "household-1",
      actorId: "user-1",
      actorName: "Alice",
      ipAddress: "1.2.3.4",
      userAgent: "test-agent",
    };
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
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue(null);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.giftEvent.findMany.mockResolvedValue([]);
    prismaMock.giftAllocation.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);
    prismaMock.auditLog.create.mockResolvedValue({});

    await exportService.exportHousehold("household-1", "user-1", ctx);

    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "EXPORT_DATA",
        resource: "household",
        resourceId: "household-1",
        householdId: "household-1",
        actorId: "user-1",
        actorName: "Alice",
        metadata: expect.objectContaining({ counts: expect.any(Object) }),
      }),
    });
  });

  it("resolves owner name from memberId for income sources and inlines periods", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.household.findUnique.mockResolvedValue(buildHousehold({ name: "Test" }));
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({ id: "member-alice", name: "Alice" }),
      buildMember({ id: "member-bob", name: "Bob" }),
    ]);
    prismaMock.subcategory.findMany.mockResolvedValue([]);
    prismaMock.incomeSource.findMany.mockResolvedValue([
      {
        id: "inc-1",
        householdId: "household-1",
        subcategoryId: "sub-salary",
        name: "Day job",
        frequency: "monthly",
        incomeType: "salary",
        dueDate: new Date("2026-04-01"),
        ownerId: "member-alice",
        sortOrder: 0,
        lastReviewedAt: new Date("2026-01-01T00:00:00Z"),
        notes: null,
        subcategory: { name: "Salary" },
      },
    ]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.asset.findMany.mockResolvedValue([]);
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.purchaseItem.findMany.mockResolvedValue([]);
    prismaMock.plannerYearBudget.findMany.mockResolvedValue([]);
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue(null);
    prismaMock.giftPerson.findMany.mockResolvedValue([]);
    prismaMock.giftEvent.findMany.mockResolvedValue([]);
    prismaMock.giftAllocation.findMany.mockResolvedValue([]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([
      {
        id: "period-1",
        itemType: "income_source",
        itemId: "inc-1",
        startDate: new Date("2026-01-01"),
        endDate: null,
        amount: 3000,
        createdAt: new Date(),
      },
    ]);
    prismaMock.waterfallHistory.findMany.mockResolvedValue([]);

    const result = await exportService.exportHousehold("household-1", "user-1");

    expect(result.incomeSources).toHaveLength(1);
    expect(result.incomeSources[0]!.ownerName).toBe("Alice");
    expect(result.incomeSources[0]!.subcategoryName).toBe("Salary");
    expect(result.incomeSources[0]!.periods).toHaveLength(1);
    expect(result.incomeSources[0]!.periods[0]!.amount).toBe(3000);
  });
});
