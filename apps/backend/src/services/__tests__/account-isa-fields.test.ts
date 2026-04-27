import { describe, it, expect, beforeEach } from "bun:test";
import { prisma } from "../../config/database.js";
import { createTestHousehold, truncateAllTables } from "../../test/helpers/test-db.js";

describe("Account ISA fields", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("persists isISA and isaYearContribution", async () => {
    const household = await createTestHousehold();
    const member = await prisma.member.create({
      data: { householdId: household.id, name: "Alice" },
    });
    const account = await prisma.account.create({
      data: {
        householdId: household.id,
        memberId: member.id,
        name: "Cash ISA",
        type: "Savings",
        isISA: true,
        isaYearContribution: 12400,
      },
    });
    expect(account.isISA).toBe(true);
    expect(account.isaYearContribution).toBe(12400);
  });

  it("defaults isISA to false and isaYearContribution to null", async () => {
    const household = await createTestHousehold();
    const account = await prisma.account.create({
      data: { householdId: household.id, name: "Current", type: "Current" },
    });
    expect(account.isISA).toBe(false);
    expect(account.isaYearContribution).toBeNull();
  });
});
