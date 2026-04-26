import { describe, it, expect, beforeEach, mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma.js";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));
mock.module("./audit.service.js", () => ({
  audited: mock(({ mutation }: { mutation: (tx: typeof prismaMock) => unknown }) =>
    mutation(prismaMock)
  ),
}));

const { assetsService } = await import("./assets.service.js");

const HOUSEHOLD_ID = "hh-1";
const USER_ID = "user-1";
const MEMBER_ID = "member-1";
const ASSET_ID = "asset-1";
const ACCOUNT_ID = "account-1";

const mockCtx = {
  householdId: HOUSEHOLD_ID,
  actorId: USER_ID,
  actorName: "Test User",
  ipAddress: "127.0.0.1",
  userAgent: "test",
};

beforeEach(() => resetPrismaMocks());

// ── Assets ──────────────────────────────────────────────────────────────────

describe("assetsService.getSummary", () => {
  it("returns totals per type for both groups", async () => {
    prismaMock.asset.findMany.mockResolvedValue([
      {
        type: "Property",
        balances: [{ value: 100000, date: new Date("2026-01-01"), createdAt: new Date() }],
      },
      {
        type: "Vehicle",
        balances: [{ value: 9000, date: new Date("2026-01-01"), createdAt: new Date() }],
      },
    ] as any);
    prismaMock.account.findMany.mockResolvedValue([
      {
        type: "Savings",
        balances: [{ value: 5000, date: new Date("2026-01-01"), createdAt: new Date() }],
      },
    ] as any);

    const result = await assetsService.getSummary(HOUSEHOLD_ID);

    expect(result.assetTotals.Property).toBe(100000);
    expect(result.assetTotals.Vehicle).toBe(9000);
    expect(result.assetTotals.Other).toBe(0);
    expect(result.accountTotals.Savings).toBe(5000);
    expect(result.accountTotals.Pension).toBe(0);
    expect(result.grandTotal).toBe(114000);
  });
});

describe("assetsService.listAssetsByType", () => {
  it("returns assets with latest balance for given type", async () => {
    const mockAssets = [
      {
        id: ASSET_ID,
        name: "My House",
        type: "Property",
        householdId: HOUSEHOLD_ID,
        memberId: null,
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        balances: [
          {
            id: "b1",
            value: 185000,
            date: new Date("2026-03-01"),
            createdAt: new Date(),
            assetId: ASSET_ID,
            note: null,
          },
          {
            id: "b2",
            value: 180000,
            date: new Date("2026-01-01"),
            createdAt: new Date(),
            assetId: ASSET_ID,
            note: null,
          },
        ],
      },
    ];
    prismaMock.asset.findMany.mockResolvedValue(mockAssets as any);

    const result = await assetsService.listAssetsByType(HOUSEHOLD_ID, "Property");

    expect(result).toHaveLength(1);
    expect(result[0]!.currentBalance).toBe(185000);
    expect(result[0]!.currentBalanceDate).toEqual(new Date("2026-03-01"));
  });
});

describe("assetsService.createAsset", () => {
  it("creates asset with valid memberId", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: MEMBER_ID,
      householdId: HOUSEHOLD_ID,
    } as any);
    prismaMock.asset.create.mockResolvedValue({
      id: ASSET_ID,
      name: "Test House",
      type: "Property",
      householdId: HOUSEHOLD_ID,
      memberId: MEMBER_ID,
      lastReviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await assetsService.createAsset(
      HOUSEHOLD_ID,
      { name: "Test House", type: "Property", memberId: MEMBER_ID },
      mockCtx
    );

    expect(result.name).toBe("Test House");
    expect(prismaMock.member.findUnique).toHaveBeenCalledWith({
      where: { id: MEMBER_ID },
      select: { id: true, householdId: true },
    });
  });

  it("throws ValidationError when memberId is from another household", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "foreign-member",
      householdId: "other-household",
    } as any);

    await expect(
      assetsService.createAsset(
        HOUSEHOLD_ID,
        { name: "Test House", type: "Property", memberId: "foreign-member" },
        mockCtx
      )
    ).rejects.toThrow("Member not found in household");
  });
});

describe("assetsService.recordAssetBalance", () => {
  it("appends balance entry and updates lastReviewedAt", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      householdId: HOUSEHOLD_ID,
    } as any);
    prismaMock.assetBalance.create.mockResolvedValue({
      id: "bal-1",
      assetId: ASSET_ID,
      value: 190000,
      date: new Date("2026-03-30"),
      note: null,
      createdAt: new Date(),
    } as any);
    prismaMock.asset.update.mockResolvedValue({} as any);

    const result = await assetsService.recordAssetBalance(
      HOUSEHOLD_ID,
      ASSET_ID,
      { value: 190000, date: "2026-03-30", note: null },
      mockCtx
    );

    expect(result.value).toBe(190000);
    expect(prismaMock.asset.update).toHaveBeenCalledWith({
      where: { id: ASSET_ID },
      data: expect.objectContaining({ lastReviewedAt: expect.any(Date) }),
    });
  });

  it("throws NotFoundError when asset belongs to another household", async () => {
    prismaMock.asset.findUnique.mockResolvedValue(null);

    await expect(
      assetsService.recordAssetBalance(
        HOUSEHOLD_ID,
        "other-asset",
        { value: 100, date: "2026-03-30" },
        mockCtx
      )
    ).rejects.toThrow();
  });
});

// ── Accounts ─────────────────────────────────────────────────────────────────

describe("assetsService.listAccountsByType", () => {
  it("returns accounts with latest balance for given type", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      {
        id: ACCOUNT_ID,
        name: "SIPP",
        type: "Pension",
        householdId: HOUSEHOLD_ID,
        memberId: USER_ID,
        growthRatePct: null,
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedItems: [],
        balances: [
          {
            id: "b1",
            value: 42100,
            date: new Date("2026-03-12"),
            createdAt: new Date(),
            accountId: ACCOUNT_ID,
            note: null,
          },
        ],
      },
    ] as any);

    const result = await assetsService.listAccountsByType(HOUSEHOLD_ID, "Pension");

    expect(result[0]!.currentBalance).toBe(42100);
    expect(result[0]!.balances).toHaveLength(1);
    expect(result[0]!.monthlyContribution).toBe(0);
    expect(result[0]!.linkedItems).toEqual([]);
  });

  it("derives monthlyContribution from active ItemAmountPeriods of linked items", async () => {
    const ITEM_ID_1 = "item-1";
    const ITEM_ID_2 = "item-2";

    prismaMock.account.findMany.mockResolvedValue([
      {
        id: ACCOUNT_ID,
        name: "ISA",
        type: "Savings",
        householdId: HOUSEHOLD_ID,
        memberId: null,
        growthRatePct: null,
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedItems: [
          { id: ITEM_ID_1, name: "ISA monthly", spendType: "monthly" },
          { id: ITEM_ID_2, name: "ISA yearly top-up", spendType: "yearly" },
        ],
        balances: [],
      },
    ] as any);

    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([
      {
        id: "p1",
        itemType: "discretionary_item",
        itemId: ITEM_ID_1,
        startDate: new Date("2026-01-01"),
        endDate: null,
        amount: 300,
        createdAt: new Date(),
      },
      {
        id: "p2",
        itemType: "discretionary_item",
        itemId: ITEM_ID_2,
        startDate: new Date("2026-01-01"),
        endDate: null,
        amount: 1200,
        createdAt: new Date(),
      },
    ] as any);

    const result = await assetsService.listAccountsByType(HOUSEHOLD_ID, "Savings");

    // 300 monthly + 1200/12 yearly = 300 + 100 = 400
    expect(result[0]!.monthlyContribution).toBe(400);
    expect(result[0]!.linkedItems).toHaveLength(2);
    expect(result[0]!.linkedItems[0]!.amount).toBe(300);
    expect(result[0]!.linkedItems[1]!.amount).toBe(1200);
  });

  it("returns monthlyContribution 0 and does not query periods when no linked items", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      {
        id: ACCOUNT_ID,
        name: "Current",
        type: "Current",
        householdId: HOUSEHOLD_ID,
        memberId: null,
        growthRatePct: null,
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedItems: [],
        balances: [],
      },
    ] as any);

    const result = await assetsService.listAccountsByType(HOUSEHOLD_ID, "Current");

    expect(result[0]!.monthlyContribution).toBe(0);
    expect(prismaMock.itemAmountPeriod.findMany).not.toHaveBeenCalled();
  });
});

describe("assetsService.createAccount", () => {
  it("creates account and persists initialValue as opening balance", async () => {
    prismaMock.account.create.mockResolvedValue({
      id: ACCOUNT_ID,
      name: "HSBC Current",
      type: "Current",
      householdId: HOUSEHOLD_ID,
      memberId: null,
      growthRatePct: null,
      isCashflowLinked: false,
      lastReviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    prismaMock.accountBalance.create.mockResolvedValue({
      id: "bal-1",
      accountId: ACCOUNT_ID,
      value: 1500,
      date: new Date(),
      note: null,
      createdAt: new Date(),
    } as any);

    await assetsService.createAccount(
      HOUSEHOLD_ID,
      { name: "HSBC Current", type: "Current", initialValue: 1500 },
      mockCtx
    );

    expect(prismaMock.account.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: HOUSEHOLD_ID,
        name: "HSBC Current",
        type: "Current",
      }),
    });
    expect(prismaMock.accountBalance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: ACCOUNT_ID,
        value: 1500,
      }),
    });
    // initialValue must NOT be passed to account.create — it's not a column
    const accountCreateCall = prismaMock.account.create.mock.calls[0]?.[0] as { data: object };
    expect(accountCreateCall.data).not.toHaveProperty("initialValue");
  });

  it("creates account without initialValue and skips balance insert", async () => {
    prismaMock.account.create.mockResolvedValue({
      id: ACCOUNT_ID,
      name: "Empty Savings",
      type: "Savings",
      householdId: HOUSEHOLD_ID,
    } as any);

    await assetsService.createAccount(
      HOUSEHOLD_ID,
      { name: "Empty Savings", type: "Savings" },
      mockCtx
    );

    expect(prismaMock.account.create).toHaveBeenCalled();
    expect(prismaMock.accountBalance.create).not.toHaveBeenCalled();
  });
});

describe("assetsService.deleteAccount", () => {
  it("deletes account owned by household", async () => {
    prismaMock.account.findUnique.mockResolvedValue({
      id: ACCOUNT_ID,
      householdId: HOUSEHOLD_ID,
    } as any);
    prismaMock.account.delete.mockResolvedValue({} as any);

    await assetsService.deleteAccount(HOUSEHOLD_ID, ACCOUNT_ID, mockCtx);

    expect(prismaMock.account.delete).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID },
    });
  });
});

describe("assetsService.createAccount — monthlyContributionLimit guard", () => {
  it("rejects a non-null limit on a non-Savings account", async () => {
    await expect(
      assetsService.createAccount(
        HOUSEHOLD_ID,
        { name: "Halifax", type: "Current", monthlyContributionLimit: 200 } as any,
        mockCtx
      )
    ).rejects.toThrow(/Savings/);
  });

  it("accepts a non-null limit on a Savings account", async () => {
    prismaMock.account.create.mockResolvedValue({ id: "a-1" } as any);
    await expect(
      assetsService.createAccount(
        HOUSEHOLD_ID,
        { name: "Marcus", type: "Savings", monthlyContributionLimit: 200 } as any,
        mockCtx
      )
    ).resolves.toBeDefined();
  });
});

describe("assetsService.updateAccount — monthlyContributionLimit guard", () => {
  it("nulls the limit when type changes away from Savings", async () => {
    prismaMock.account.findUnique.mockResolvedValue({
      id: ACCOUNT_ID,
      householdId: HOUSEHOLD_ID,
      type: "Savings",
      monthlyContributionLimit: 200,
    } as any);
    prismaMock.account.update.mockResolvedValue({ id: ACCOUNT_ID } as any);
    await assetsService.updateAccount(HOUSEHOLD_ID, ACCOUNT_ID, { type: "Other" } as any, mockCtx);
    const call = prismaMock.account.update.mock.calls.at(-1)?.[0];
    expect(call?.data.monthlyContributionLimit).toBe(null);
  });

  it("rejects setting a non-null limit on a non-Savings account", async () => {
    prismaMock.account.findUnique.mockResolvedValue({
      id: ACCOUNT_ID,
      householdId: HOUSEHOLD_ID,
      type: "Current",
    } as any);
    await expect(
      assetsService.updateAccount(
        HOUSEHOLD_ID,
        ACCOUNT_ID,
        { monthlyContributionLimit: 200 } as any,
        mockCtx
      )
    ).rejects.toThrow(/Savings/);
  });
});
