import { describe, it, expect, beforeEach } from "bun:test";
import { prisma } from "../../config/database.js";
import { assetsService } from "../assets.service.js";
import type { ActorCtx } from "../audit.service.js";
import { createTestHousehold, truncateAllTables } from "../../test/helpers/test-db.js";

const baseCtx: Omit<ActorCtx, "householdId"> = {
  actorId: "user-1",
  actorName: "Tester",
  ipAddress: "1.2.3.4",
  userAgent: "bun:test",
};

describe("Account ISA mutations", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("createAccount persists isISA and isaYearContribution", async () => {
    const household = await createTestHousehold();
    const member = await prisma.member.create({
      data: { householdId: household.id, name: "Alice" },
    });
    const acc = await assetsService.createAccount(
      household.id,
      {
        name: "Cash ISA",
        type: "Savings",
        memberId: member.id,
        isISA: true,
        isaYearContribution: 5000,
      },
      { ...baseCtx, householdId: household.id }
    );
    expect(acc.isISA).toBe(true);
    expect(acc.isaYearContribution).toBe(5000);
  });

  it("updateAccount can zero isaYearContribution", async () => {
    const household = await createTestHousehold();
    const member = await prisma.member.create({
      data: { householdId: household.id, name: "Alice" },
    });
    const created = await prisma.account.create({
      data: {
        householdId: household.id,
        memberId: member.id,
        name: "ISA",
        type: "Savings",
        isISA: true,
        isaYearContribution: 8000,
      },
    });
    const updated = await assetsService.updateAccount(
      household.id,
      created.id,
      { isaYearContribution: 0 },
      { ...baseCtx, householdId: household.id }
    );
    expect(updated.isaYearContribution).toBe(0);
  });
});
