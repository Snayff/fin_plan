import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../config/database.js";
import { createTestHousehold } from "../test/helpers/test-db.js";

describe("schema: DiscretionaryItem.linkedAccountId + HouseholdSettings asset rates", () => {
  let householdId: string;
  let subcategoryId: string;
  let accountId: string;

  beforeAll(async () => {
    const hh = await createTestHousehold();
    householdId = hh.id;
    const sub = await prisma.subcategory.create({
      data: { householdId, tier: "discretionary", name: "Savings", sortOrder: 0, isLocked: true },
    });
    subcategoryId = sub.id;
    const acc = await prisma.account.create({
      data: { householdId, name: "My ISA", type: "Savings" },
    });
    accountId = acc.id;
  });

  afterAll(async () => {
    await prisma.household.delete({ where: { id: householdId } });
  });

  it("allows setting linkedAccountId on a DiscretionaryItem", async () => {
    const item = await prisma.discretionaryItem.create({
      data: { householdId, subcategoryId, name: "ISA top-up", linkedAccountId: accountId },
    });
    expect(item.linkedAccountId).toBe(accountId);
  });

  it("sets linkedAccountId to null when the target Account is deleted (ON DELETE SET NULL)", async () => {
    const acc2 = await prisma.account.create({
      data: { householdId, name: "Temp", type: "Savings" },
    });
    const item = await prisma.discretionaryItem.create({
      data: { householdId, subcategoryId, name: "Temp link", linkedAccountId: acc2.id },
    });
    await prisma.account.delete({ where: { id: acc2.id } });
    const reloaded = await prisma.discretionaryItem.findUnique({ where: { id: item.id } });
    expect(reloaded?.linkedAccountId).toBeNull();
  });

  it("does not carry Account.monthlyContribution any more", async () => {
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    expect((acc as any).monthlyContribution).toBeUndefined();
  });

  it("HouseholdSettings has propertyRatePct / vehicleRatePct / otherAssetRatePct defaults", async () => {
    const settings = await prisma.householdSettings.create({
      data: { householdId: (await createTestHousehold()).id },
    });
    expect(settings.propertyRatePct).toBe(3.5);
    expect(settings.vehicleRatePct).toBe(-15);
    expect(settings.otherAssetRatePct).toBe(0);
  });
});
