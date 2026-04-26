import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember } from "../test/fixtures";
import type { ActorCtx } from "./audit.service";

mock.module("../config/database", () => ({ prisma: prismaMock }));
mock.module("./export.service", () => ({
  exportService: {
    exportHousehold: mock(() =>
      Promise.resolve({
        schemaVersion: 2,
        exportedAt: "2026-01-01T00:00:00.000Z",
        household: { name: "Backup" },
        settings: {},
        members: [],
        subcategories: [],
        incomeSources: [],
        committedItems: [],
        discretionaryItems: [],
        itemAmountPeriods: [],
        waterfallHistory: [],
        assets: [],
        accounts: [],
        purchaseItems: [],
        plannerYearBudgets: [],
        gifts: {
          settings: { mode: "synced", syncedDiscretionaryItemId: null },
          people: [],
          events: [],
          allocations: [],
        },
      })
    ),
  },
}));

import { importService } from "./import.service";
import { AuthorizationError, ValidationError } from "../utils/errors";

beforeEach(() => resetPrismaMocks());

const minimalExport = {
  schemaVersion: 2,
  exportedAt: "2026-01-01T00:00:00.000Z",
  household: { name: "Imported Household" },
  settings: {},
  members: [],
  subcategories: [],
  incomeSources: [],
  committedItems: [],
  discretionaryItems: [],
  itemAmountPeriods: [],
  waterfallHistory: [],
  assets: [],
  accounts: [],
  purchaseItems: [],
  plannerYearBudgets: [],
  gifts: {
    settings: { mode: "synced", syncedDiscretionaryItemId: null },
    people: [],
    events: [],
    allocations: [],
  },
};

describe("importService.validateImportData", () => {
  it("accepts a minimal valid export", () => {
    const result = importService.validateImportData(minimalExport);
    expect(result.valid).toBe(true);
  });

  it("rejects garbage", () => {
    const result = importService.validateImportData({ foo: "bar" });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("rejects unsupported future schema version", () => {
    const result = importService.validateImportData({ ...minimalExport, schemaVersion: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors?.join(" ")).toMatch(/schema version/i);
  });
});

describe("importService.importHousehold", () => {
  it("rejects invalid data", async () => {
    await expect(
      importService.importHousehold("h1", "u1", { not: "valid" }, "create_new")
    ).rejects.toThrow(ValidationError);
  });

  it("rejects unsupported schemaVersion", async () => {
    await expect(
      importService.importHousehold(
        "h1",
        "u1",
        { ...minimalExport, schemaVersion: 3 },
        "create_new"
      )
    ).rejects.toThrow(ValidationError);
  });

  it("rejects overwrite when caller is not owner of target household", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "member" }));
    await expect(
      importService.importHousehold("h1", "u1", minimalExport, "overwrite")
    ).rejects.toThrow(AuthorizationError);
  });

  it("rejects overwrite when caller is not a member at all", async () => {
    prismaMock.member.findFirst.mockResolvedValue(null);
    await expect(
      importService.importHousehold("h1", "u1", minimalExport, "overwrite")
    ).rejects.toThrow(AuthorizationError);
  });

  it("create_new happy path creates a new household owned by caller", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ name: "Alice" });
    prismaMock.household.create.mockResolvedValue({ id: "new-hh-id", name: "Imported Household" });
    prismaMock.member.create.mockResolvedValue(
      buildMember({
        id: "m1",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Alice",
        role: "owner",
      })
    );
    prismaMock.householdSettings.upsert.mockResolvedValue({});
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({
        id: "m1",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Alice",
        role: "owner",
      }),
    ]);

    const result = await importService.importHousehold(
      "ignored",
      "u1",
      minimalExport,
      "create_new"
    );

    expect(result.success).toBe(true);
    expect(result.householdId).toBe("new-hh-id");
    expect(prismaMock.household.create).toHaveBeenCalledWith({
      data: { name: "Imported Household" },
    });
    expect(prismaMock.member.create).toHaveBeenCalled();
  });

  it("rolls back on error inside transaction", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ name: "Alice" });
    prismaMock.household.create.mockRejectedValue(new Error("db exploded"));

    await expect(
      importService.importHousehold("ignored", "u1", minimalExport, "create_new")
    ).rejects.toThrow("db exploded");
  });

  it("create_new happy path writes subcategories, items, periods and maps owner name to memberId", async () => {
    const envelope = {
      ...minimalExport,
      members: [
        {
          name: "Alice",
          role: "member" as const,
          dateOfBirth: null,
          retirementYear: null,
        },
      ],
      subcategories: [
        {
          tier: "committed" as const,
          name: "Rent",
          sortOrder: 0,
          isLocked: false,
          isDefault: true,
        },
      ],
      committedItems: [
        {
          subcategoryName: "Rent",
          name: "Flat rent",
          spendType: "monthly" as const,
          notes: null,
          ownerName: "Alice",
          dueDate: new Date("2026-04-01"),
          sortOrder: 0,
          lastReviewedAt: "2026-01-01T00:00:00.000Z",
          periods: [
            {
              startDate: "2026-01-01",
              endDate: null,
              amount: 1200,
            },
          ],
        },
      ],
    };

    prismaMock.user.findUnique.mockResolvedValue({ name: "Bob" });
    prismaMock.household.create.mockResolvedValue({
      id: "new-hh-id",
      name: "Imported Household",
    });
    // Owner member create (Bob) then non-caller member create (Alice)
    prismaMock.member.create
      .mockResolvedValueOnce(
        buildMember({
          id: "member-bob",
          householdId: "new-hh-id",
          userId: "u1",
          name: "Bob",
          role: "owner",
        })
      )
      .mockResolvedValueOnce(
        buildMember({
          id: "member-alice",
          householdId: "new-hh-id",
          userId: null,
          name: "Alice",
          role: "member",
        })
      );
    prismaMock.householdSettings.upsert.mockResolvedValue({});
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({
        id: "member-bob",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Bob",
        role: "owner",
      }),
      buildMember({
        id: "member-alice",
        householdId: "new-hh-id",
        userId: null,
        name: "Alice",
        role: "member",
      }),
    ]);
    prismaMock.subcategory.create.mockResolvedValue({
      id: "sub-rent",
      householdId: "new-hh-id",
      tier: "committed",
      name: "Rent",
    });
    prismaMock.committedItem.create.mockResolvedValue({
      id: "committed-1",
      householdId: "new-hh-id",
      subcategoryId: "sub-rent",
      name: "Flat rent",
    });
    prismaMock.itemAmountPeriod.create.mockResolvedValue({ id: "period-1" });

    const result = await importService.importHousehold("ignored", "u1", envelope, "create_new");

    expect(result.success).toBe(true);
    expect(result.householdId).toBe("new-hh-id");

    // Subcategory create received the right tier and name
    expect(prismaMock.subcategory.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.subcategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "new-hh-id",
        tier: "committed",
        name: "Rent",
      }),
    });

    // Committed item resolved subcategoryId and mapped ownerName -> Alice's memberId
    expect(prismaMock.committedItem.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.committedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "new-hh-id",
        subcategoryId: "sub-rent",
        name: "Flat rent",
        memberId: "member-alice",
      }),
    });

    // One period created for the committed item
    expect(prismaMock.itemAmountPeriod.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.itemAmountPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "committed_item",
        itemId: "committed-1",
        amount: 1200,
      }),
    });
  });

  it("overwrite preserves caller's Member record and only creates non-caller members", async () => {
    const envelope = {
      ...minimalExport,
      members: [
        // Matches caller's user name — should be skipped
        { name: "Bob", role: "owner" as const, dateOfBirth: null, retirementYear: null },
        // New member — should be created
        { name: "Alice", role: "member" as const, dateOfBirth: null, retirementYear: null },
      ],
    };

    // Owner-check passes: caller is owner of household-1
    prismaMock.member.findFirst.mockResolvedValue(
      buildMember({
        id: "member-bob",
        householdId: "household-1",
        userId: "u1",
        name: "Bob",
        role: "owner",
      })
    );
    prismaMock.user.findUnique.mockResolvedValue({ name: "Bob" });

    // Auto-backup mocks (exportService is already mocked at module level)
    prismaMock.importBackup.create.mockResolvedValue({ id: "backup-1" });
    prismaMock.importBackup.deleteMany.mockResolvedValue({ count: 0 });

    // household.update returns the updated household
    prismaMock.household.update.mockResolvedValue({
      id: "household-1",
      name: "Imported Household",
    });

    // Export service needs household.findUnique for backup
    prismaMock.household.findUnique.mockResolvedValue({
      id: "household-1",
      name: "Imported Household",
    });

    // All the cleanup queries: return empty collections / zero counts
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);

    const deleteManyResult = { count: 0 };
    prismaMock.auditLog.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.snapshot.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.householdInvite.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.reviewSession.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.itemAmountPeriod.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.waterfallHistory.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.incomeSource.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.committedItem.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.discretionaryItem.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.asset.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.account.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.purchaseItem.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.plannerYearBudget.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.giftAllocation.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.giftEvent.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.giftPerson.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.giftPlannerSettings.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.subcategory.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.householdSettings.deleteMany.mockResolvedValue(deleteManyResult);
    prismaMock.member.deleteMany.mockResolvedValue(deleteManyResult);

    // member.create should only be called once — for Alice
    prismaMock.member.create.mockResolvedValue(
      buildMember({
        id: "member-alice",
        householdId: "household-1",
        userId: null,
        name: "Alice",
        role: "member",
      })
    );

    prismaMock.householdSettings.upsert.mockResolvedValue({});
    prismaMock.giftPlannerSettings.upsert.mockResolvedValue({});
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({
        id: "member-bob",
        householdId: "household-1",
        userId: "u1",
        name: "Bob",
        role: "owner",
      }),
      buildMember({
        id: "member-alice",
        householdId: "household-1",
        userId: null,
        name: "Alice",
        role: "member",
      }),
    ]);

    const result = await importService.importHousehold("household-1", "u1", envelope, "overwrite");

    expect(result.success).toBe(true);
    expect(result.householdId).toBe("household-1");
    expect(result.backupId).toBe("backup-1");

    // Caller's Member record is preserved: non-caller members are deleted
    expect(prismaMock.member.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "household-1", NOT: { userId: "u1" } },
    });

    // Only Alice is created — Bob is skipped because his name matches caller
    expect(prismaMock.member.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.member.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "household-1",
        userId: null,
        name: "Alice",
      }),
    });

    // Historical household-scoped tables are purged
    expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
    });
    expect(prismaMock.snapshot.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
    });
    expect(prismaMock.householdInvite.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
    });
    expect(prismaMock.reviewSession.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
    });
  });

  it("does not reference waterfallSetupSession during import wipe", async () => {
    const { prismaMock } = await import("../test/mocks/prisma");
    // @ts-expect-error — asserting model is removed from the mock
    expect(prismaMock.waterfallSetupSession).toBeUndefined();
  });

  it("writes one IMPORT_DATA audit row with counts metadata on create_new", async () => {
    const ctx: ActorCtx = {
      householdId: "new-hh-id",
      actorId: "u1",
      actorName: "Alice",
      ipAddress: "1.2.3.4",
      userAgent: "test-agent",
    };
    prismaMock.user.findUnique.mockResolvedValue({ name: "Alice" });
    prismaMock.household.create.mockResolvedValue({ id: "new-hh-id", name: "Imported Household" });
    prismaMock.member.create.mockResolvedValue(
      buildMember({
        id: "m1",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Alice",
        role: "owner",
      })
    );
    prismaMock.householdSettings.upsert.mockResolvedValue({});
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({
        id: "m1",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Alice",
        role: "owner",
      }),
    ]);
    prismaMock.auditLog.create.mockResolvedValue({});

    await importService.importHousehold("ignored", "u1", minimalExport, "create_new", ctx);

    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "IMPORT_DATA",
        resource: "household",
        householdId: "new-hh-id",
        actorId: "u1",
        actorName: "Alice",
        metadata: expect.objectContaining({
          counts: expect.objectContaining({ incomeSources: expect.any(Number) }),
        }),
      }),
    });
  });

  it("throws ValidationError and rolls back when an income source references an unknown subcategory", async () => {
    const envelope = {
      ...minimalExport,
      // No subcategories...
      subcategories: [],
      // ...but an income source that references one
      incomeSources: [
        {
          subcategoryName: "Salary",
          name: "Day job",
          frequency: "monthly" as const,
          incomeType: "salary" as const,
          dueDate: new Date("2026-04-01"),
          ownerName: null,
          sortOrder: 0,
          lastReviewedAt: "2026-01-01T00:00:00.000Z",
          notes: null,
          periods: [],
        },
      ],
    };

    prismaMock.user.findUnique.mockResolvedValue({ name: "Bob" });
    prismaMock.household.create.mockResolvedValue({
      id: "new-hh-id",
      name: "Imported Household",
    });
    prismaMock.member.create.mockResolvedValue(
      buildMember({
        id: "member-bob",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Bob",
        role: "owner",
      })
    );
    prismaMock.householdSettings.upsert.mockResolvedValue({});
    prismaMock.member.findMany.mockResolvedValue([
      buildMember({
        id: "member-bob",
        householdId: "new-hh-id",
        userId: "u1",
        name: "Bob",
        role: "owner",
      }),
    ]);

    await expect(
      importService.importHousehold("ignored", "u1", envelope, "create_new")
    ).rejects.toThrow(ValidationError);

    // The income source create should never have fired — the lookup throws first
    expect(prismaMock.incomeSource.create).not.toHaveBeenCalled();
  });
});
