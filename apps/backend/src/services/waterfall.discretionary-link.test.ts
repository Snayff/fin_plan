import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { prisma } from "../config/database.js";
import { waterfallService } from "./waterfall.service.js";
import { createTestHousehold } from "../test/helpers/test-db.js";

describe("waterfallService — linkedAccountId", () => {
  let householdId: string;
  let savingsSubId: string;
  let otherSubId: string;
  let savingsAccountId: string;
  let currentAccountId: string;

  beforeEach(async () => {
    const hh = await createTestHousehold();
    householdId = hh.id;
    savingsSubId = (
      await prisma.subcategory.create({
        data: { householdId, tier: "discretionary", name: "Savings", sortOrder: 0, isLocked: true },
      })
    ).id;
    otherSubId = (
      await prisma.subcategory.create({
        data: { householdId, tier: "discretionary", name: "Other", sortOrder: 1 },
      })
    ).id;
    savingsAccountId = (
      await prisma.account.create({
        data: { householdId, name: "ISA", type: "Savings" },
      })
    ).id;
    currentAccountId = (
      await prisma.account.create({
        data: { householdId, name: "Current", type: "Current" },
      })
    ).id;
  });

  afterEach(async () => {
    await prisma.household.delete({ where: { id: householdId } });
  });

  it("accepts linkedAccountId when item is in Savings subcategory and account is Savings/S&S/Pension", async () => {
    const item = await waterfallService.createDiscretionary(householdId, {
      name: "ISA top-up",
      amount: 250,
      subcategoryId: savingsSubId,
      spendType: "monthly",
      linkedAccountId: savingsAccountId,
    } as any);
    expect((item as any).linkedAccountId).toBe(savingsAccountId);
  });

  it("rejects linking when subcategory is not Savings", async () => {
    await expect(
      waterfallService.createDiscretionary(householdId, {
        name: "Not savings",
        amount: 50,
        subcategoryId: otherSubId,
        spendType: "monthly",
        linkedAccountId: savingsAccountId,
      } as any)
    ).rejects.toThrow(/Savings subcategory/);
  });

  it("rejects linking to a Current account", async () => {
    await expect(
      waterfallService.createDiscretionary(householdId, {
        name: "x",
        amount: 10,
        subcategoryId: savingsSubId,
        spendType: "monthly",
        linkedAccountId: currentAccountId,
      } as any)
    ).rejects.toThrow(/Savings, StocksAndShares, or Pension/);
  });

  it("rejects linking to an account in a different household", async () => {
    const otherHh = await createTestHousehold();
    const crossAcc = await prisma.account.create({
      data: { householdId: otherHh.id, name: "Other HH ISA", type: "Savings" },
    });
    await expect(
      waterfallService.createDiscretionary(householdId, {
        name: "x",
        amount: 10,
        subcategoryId: savingsSubId,
        spendType: "monthly",
        linkedAccountId: crossAcc.id,
      } as any)
    ).rejects.toThrow(/not found/i);
    await prisma.household.delete({ where: { id: otherHh.id } });
  });

  it("rejects linking on a planner-owned item (update)", async () => {
    const plannerItem = await prisma.discretionaryItem.create({
      data: { householdId, subcategoryId: savingsSubId, name: "Gift plan", isPlannerOwned: true },
    });
    await expect(
      waterfallService.updateDiscretionary(householdId, plannerItem.id, {
        linkedAccountId: savingsAccountId,
      } as any)
    ).rejects.toThrow(/planner/i);
  });

  it("auto-nulls linkedAccountId when an item is moved out of Savings", async () => {
    const item = await waterfallService.createDiscretionary(householdId, {
      name: "x",
      amount: 100,
      subcategoryId: savingsSubId,
      spendType: "monthly",
      linkedAccountId: savingsAccountId,
    } as any);
    const updated = await waterfallService.updateDiscretionary(householdId, (item as any).id, {
      subcategoryId: otherSubId,
    } as any);
    expect((updated as any).linkedAccountId).toBeNull();
  });
});
