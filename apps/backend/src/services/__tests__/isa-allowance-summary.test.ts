import { describe, it, expect, beforeEach } from "bun:test";
import { prisma } from "../../config/database.js";
import { assetsService } from "../assets.service.js";
import { createTestHousehold, truncateAllTables } from "../../test/helpers/test-db.js";

async function makeMember(householdId: string, name: string) {
  return prisma.member.create({ data: { householdId, name } });
}

describe("getIsaAllowanceSummary", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("returns empty byMember when household has no ISA accounts", async () => {
    const household = await createTestHousehold();
    const summary = await assetsService.getIsaAllowanceSummary(
      household.id,
      new Date("2026-08-01")
    );
    expect(summary.byMember).toEqual([]);
    expect(summary.annualLimit).toBe(20000);
  });

  it("groups ISA accounts by member, alphabetical by name", async () => {
    const household = await createTestHousehold();
    const alice = await makeMember(household.id, "Alice");
    const bob = await makeMember(household.id, "Bob");

    await prisma.account.create({
      data: {
        householdId: household.id,
        memberId: alice.id,
        name: "Alice ISA",
        type: "Savings",
        isISA: true,
        isaYearContribution: 12400,
      },
    });
    await prisma.account.create({
      data: {
        householdId: household.id,
        memberId: bob.id,
        name: "Bob ISA",
        type: "Savings",
        isISA: true,
        isaYearContribution: 14000,
      },
    });

    const summary = await assetsService.getIsaAllowanceSummary(
      household.id,
      new Date("2026-08-01")
    );
    expect(summary.byMember).toHaveLength(2);
    expect(summary.byMember[0]?.name).toBe("Alice");
    expect(summary.byMember[0]?.used).toBe(12400);
    expect(summary.byMember[1]?.name).toBe("Bob");
    expect(summary.byMember[1]?.used).toBe(14000);
  });

  it("excludes non-ISA accounts and members with no ISAs", async () => {
    const household = await createTestHousehold();
    const member = await makeMember(household.id, "Solo");
    await prisma.account.create({
      data: {
        householdId: household.id,
        memberId: member.id,
        name: "Plain Savings",
        type: "Savings",
        isISA: false,
      },
    });
    const summary = await assetsService.getIsaAllowanceSummary(
      household.id,
      new Date("2026-08-01")
    );
    expect(summary.byMember).toEqual([]);
  });
});
