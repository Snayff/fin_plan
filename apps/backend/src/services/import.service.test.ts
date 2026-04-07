import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember } from "../test/fixtures";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { importService } from "./import.service";
import { AuthorizationError, ValidationError } from "../utils/errors";

beforeEach(() => resetPrismaMocks());

const minimalExport = {
  schemaVersion: 1,
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
  giftPersons: [],
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
    const result = importService.validateImportData({ ...minimalExport, schemaVersion: 2 });
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
        { ...minimalExport, schemaVersion: 2 },
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
});
