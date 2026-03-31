import { describe, it, expect, beforeEach, mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

const waterfallServiceMock = {
  getWaterfallSummary: mock(() => Promise.resolve({ surplus: { amount: 1000 } })),
};

mock.module("../config/database.js", () => ({ prisma: prismaMock }));
mock.module("./waterfall.service.js", () => ({ waterfallService: waterfallServiceMock }));

const { forecastService } = await import("./forecast.service.js");

beforeEach(() => {
  resetPrismaMocks();
  waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
    surplus: { amount: 1000 },
  } as any);
});

describe("forecastService.getProjections — net worth", () => {
  it("year 0 net worth equals sum of non-pension account balances", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: null,
      },
      {
        id: "a2",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 50000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-1",
      },
      {
        id: "a3",
        householdId: "hh-1",
        assetClass: "stocksAndShares",
        balance: 5000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 0: savings (10000) + stocksAndShares (5000) = 15000 (pension excluded)
    expect(result.netWorth[0]!.nominal).toBe(15000);
    expect(result.netWorth[0]!.real).toBe(15000);
  });

  it("applies annual growth rate with monthly contributions after year 1", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 100,
        growthRatePct: null,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 10000 * 1.04 + (100 * 12) = 10400 + 1200 = 11600
    expect(result.netWorth[1]!.nominal).toBe(11600);
  });

  it("uses per-account growthRatePct override when set", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: 10,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 with 10% override: 10000 * 1.10 = 11000
    expect(result.netWorth[1]!.nominal).toBe(11000);
  });

  it("real value deflates nominal by inflation rate", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: 0,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 0,
      investmentRatePct: 0,
      pensionRatePct: 0,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 nominal = 10000 (no growth), real = 10000 / 1.025 ≈ 9756
    expect(result.netWorth[1]!.real).toBe(9756);
  });
});

describe("forecastService.getProjections — surplus", () => {
  it("year 0 surplus is 0, year N is monthlySurplus * 12 * N", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);
    waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
      surplus: { amount: 500 },
    } as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.surplus[0]!.cumulative).toBe(0);
    expect(result.surplus[1]!.cumulative).toBe(6000); // 500 * 12 * 1
    expect(result.surplus[3]!.cumulative).toBe(18000); // 500 * 12 * 3
  });
});

describe("forecastService.getProjections — retirement", () => {
  it("retirement series includes only pension accounts assigned to the member", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "p1",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 20000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-1",
      },
      {
        id: "p2",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 30000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-2",
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
      {
        householdId: "hh-1",
        userId: "user-2",
        retirementYear: 2060,
        user: { id: "user-2", name: "Bob" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    const alice = result.retirement.find((m) => m.memberId === "user-1")!;
    const bob = result.retirement.find((m) => m.memberId === "user-2")!;

    // Alice's year 0 pension = 20000, Bob's = 30000
    expect(alice.series[0]!.pension).toBe(20000);
    expect(bob.series[0]!.pension).toBe(30000);
  });

  it("passes through null retirementYear when member has none set", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: null,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    expect(result.retirement[0]!.retirementYear).toBeNull();
  });

  it("returns empty arrays when no accounts exist", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);
    waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
      surplus: { amount: 0 },
    } as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.netWorth.every((p) => p.nominal === 0)).toBe(true);
    expect(result.surplus.every((p) => p.cumulative === 0)).toBe(true);
    expect(result.retirement).toHaveLength(0);
  });
});
