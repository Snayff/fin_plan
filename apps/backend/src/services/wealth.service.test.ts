import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { wealthService } = await import("./wealth.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("wealthService.confirmAccount", () => {
  it("updates lastReviewedAt to current timestamp", async () => {
    const id = "acc-1";
    const householdId = "hh-1";

    prismaMock.wealthAccount.findUnique.mockResolvedValue({ id, householdId } as any);
    prismaMock.wealthAccount.update.mockResolvedValue({ id, lastReviewedAt: new Date() } as any);

    await wealthService.confirmAccount(householdId, id);

    expect(prismaMock.wealthAccount.update).toHaveBeenCalledWith({
      where: { id },
      data: { lastReviewedAt: expect.any(Date) },
    });
  });
});

describe("wealthService.confirmBatch", () => {
  it("updates lastReviewedAt on all specified accounts", async () => {
    const householdId = "hh-1";
    const ids = ["acc-1", "acc-2"];

    prismaMock.wealthAccount.updateMany.mockResolvedValue({ count: 2 } as any);

    await wealthService.confirmBatch(householdId, { ids });

    expect(prismaMock.wealthAccount.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ids }, householdId },
      data: { lastReviewedAt: expect.any(Date) },
    });
  });
});

describe("wealthService.updateValuation", () => {
  it("updates balance, valuationDate, lastReviewedAt, and records history", async () => {
    const id = "acc-1";
    const householdId = "hh-1";
    const balance = 10000;

    prismaMock.wealthAccount.findUnique.mockResolvedValue({ id, householdId } as any);
    prismaMock.wealthAccount.update.mockResolvedValue({ id, balance } as any);
    prismaMock.wealthAccountHistory.create.mockResolvedValue({} as any);

    await wealthService.updateValuation(householdId, id, { balance });

    expect(prismaMock.wealthAccount.update).toHaveBeenCalledWith({
      where: { id },
      data: {
        balance,
        valuationDate: expect.any(Date),
        lastReviewedAt: expect.any(Date),
      },
    });

    expect(prismaMock.wealthAccountHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ wealthAccountId: id, balance }),
    });
  });
});

describe("wealthService.deleteAccount", () => {
  it("returns 409 when linked savings allocations exist", async () => {
    const id = "acc-1";
    const householdId = "hh-1";

    prismaMock.wealthAccount.findUnique.mockResolvedValue({ id, householdId } as any);
    prismaMock.savingsAllocation.count.mockResolvedValue(1 as any);

    await expect(wealthService.deleteAccount(householdId, id)).rejects.toThrow(
      "linked savings allocations"
    );
  });
});

describe("wealthService.getIsaAllowance — toGBP rounding", () => {
  it("rounds remaining to 2dp", async () => {
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      isaAnnualLimit: 20000,
      isaYearStartMonth: 4,
      isaYearStartDay: 6,
    } as any);
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "wa-1",
        householdId: "hh-1",
        isISA: true,
        ownerId: "user-1",
        isaYearContribution: 6666.67,
      },
    ] as any);
    prismaMock.user.findMany.mockResolvedValue([{ id: "user-1", name: "Alice" }] as any);

    const result = await wealthService.getIsaAllowance("hh-1");

    // remaining: 20000 - 6666.67 = 13333.33
    expect(result.byPerson[0]!.remaining).toBe(13333.33);
  });
});

describe("wealthService.getIsaAllowance — DI clock", () => {
  it("computes correct tax year when now is before April 6", async () => {
    const now = new Date("2026-03-15");

    prismaMock.householdSettings.findUnique.mockResolvedValue({
      isaAnnualLimit: 20000,
      isaYearStartMonth: 4,
      isaYearStartDay: 6,
    } as any);
    prismaMock.wealthAccount.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await wealthService.getIsaAllowance("hh-1", now);

    // Before April 6, 2026 → tax year is 2025-04-06 to 2026-04-05
    expect(result.taxYearStart).toContain("2025");
    expect(result.taxYearEnd).toContain("2026");
  });

  it("computes correct tax year when now is after April 6", async () => {
    const now = new Date("2026-05-01");

    prismaMock.householdSettings.findUnique.mockResolvedValue({
      isaAnnualLimit: 20000,
      isaYearStartMonth: 4,
      isaYearStartDay: 6,
    } as any);
    prismaMock.wealthAccount.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await wealthService.getIsaAllowance("hh-1", now);

    // After April 6, 2026 → tax year is 2026-04-06 to 2027-04-05
    expect(result.taxYearStart).toContain("2026");
    expect(result.taxYearEnd).toContain("2027");
  });
});
