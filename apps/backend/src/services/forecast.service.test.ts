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

// Helper to build a mock account with a latest balance
function mockAccount(overrides: {
  id?: string;
  type: "Current" | "Savings" | "Pension" | "StocksAndShares" | "Other";
  balance: number;
  monthlyContribution?: number;
  growthRatePct?: number | null;
  memberId?: string | null;
}) {
  return {
    id: overrides.id ?? "acc-1",
    householdId: "hh-1",
    type: overrides.type,
    growthRatePct: overrides.growthRatePct ?? null,
    monthlyContribution: overrides.monthlyContribution ?? 0,
    memberId: overrides.memberId ?? null,
    balances: [{ value: overrides.balance, date: new Date("2026-01-01") }],
  };
}

// Helper to build a mock asset with a latest balance
function mockAsset(overrides: {
  id?: string;
  type: "Property" | "Vehicle" | "Other";
  balance: number;
  growthRatePct?: number | null;
}) {
  return {
    id: overrides.id ?? "asset-1",
    householdId: "hh-1",
    type: overrides.type,
    growthRatePct: overrides.growthRatePct ?? null,
    balances: [{ value: overrides.balance, date: new Date("2026-01-01") }],
  };
}

const defaultSettings = {
  currentRatePct: 0,
  savingsRatePct: 4,
  investmentRatePct: 7,
  pensionRatePct: 6,
  inflationRatePct: 2.5,
};

describe("forecastService.getProjections — net worth", () => {
  it("year 0 net worth = sum of non-pension account balances + all asset balances", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Savings", balance: 10000 }),
      mockAccount({ id: "acc-2", type: "Pension", balance: 50000, memberId: "m-1" }),
      mockAccount({ id: "acc-3", type: "StocksAndShares", balance: 5000 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([
      mockAsset({ type: "Property", balance: 200000 }),
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: "m-1",
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 0: Savings (10000) + StocksAndShares (5000) + Property (200000) = 215000
    // Pension (50000) excluded
    expect(result.netWorth[0]!.nominal).toBe(215000);
    expect(result.netWorth[0]!.real).toBe(215000);
  });

  it("applies account growth rate with monthly contributions after year 1", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Savings", balance: 10000, monthlyContribution: 100 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 10000 * 1.04 + (100 * 12) = 10400 + 1200 = 11600
    expect(result.netWorth[1]!.nominal).toBe(11600);
  });

  it("applies asset growth rate (no contributions)", async () => {
    prismaMock.account.findMany.mockResolvedValue([] as any);
    prismaMock.asset.findMany.mockResolvedValue([
      mockAsset({ type: "Property", balance: 200000, growthRatePct: 3 }),
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 200000 * 1.03 = 206000
    expect(result.netWorth[1]!.nominal).toBe(206000);
  });

  it("applies depreciation (negative growthRatePct) on assets", async () => {
    prismaMock.account.findMany.mockResolvedValue([] as any);
    prismaMock.asset.findMany.mockResolvedValue([
      mockAsset({ type: "Vehicle", balance: 20000, growthRatePct: -15 }),
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 20000 * 0.85 = 17000
    expect(result.netWorth[1]!.nominal).toBe(17000);
  });

  it("Current accounts use currentRatePct as default growth rate", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Current", balance: 5000 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      ...defaultSettings,
      currentRatePct: 2,
    } as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 5000 * 1.02 (currentRatePct) = 5100
    expect(result.netWorth[1]!.nominal).toBe(5100);
  });

  it("Current account growthRatePct override takes precedence over currentRatePct", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Current", balance: 5000, growthRatePct: 1 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      ...defaultSettings,
      currentRatePct: 2,
    } as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 with 1% override: 5000 * 1.01 = 5050
    expect(result.netWorth[1]!.nominal).toBe(5050);
  });

  it("Current and Savings accounts use independent default rates", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ id: "c-1", type: "Current", balance: 1000 }),
      mockAccount({ id: "s-1", type: "Savings", balance: 1000 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      ...defaultSettings,
      currentRatePct: 1,
      savingsRatePct: 5,
    } as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Current: 1000 * 1.01 = 1010; Savings: 1000 * 1.05 = 1050; total = 2060
    expect(result.netWorth[1]!.nominal).toBe(2060);
  });

  it("uses per-account growthRatePct override over household default", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Savings", balance: 10000, growthRatePct: 10 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 with 10% override: 10000 * 1.10 = 11000
    expect(result.netWorth[1]!.nominal).toBe(11000);
  });

  it("real value deflates nominal by inflation", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Savings", balance: 10000, growthRatePct: 0 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      ...defaultSettings,
      currentRatePct: 0,
      savingsRatePct: 0,
      investmentRatePct: 0,
      pensionRatePct: 0,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 nominal = 10000 (no growth), real = 10000 / 1.025 ≈ 9756
    expect(result.netWorth[1]!.real).toBe(9756);
  });

  it("falls back to DEFAULT_SETTINGS when householdSettings is null", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ type: "Savings", balance: 10000 }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.member.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // DEFAULT_SETTINGS: savingsRatePct: 4 → year 1: 10000 * 1.04 = 10400
    expect(result.netWorth[1]!.nominal).toBe(10400);
  });
});

describe("forecastService.getProjections — surplus", () => {
  it("year 0 surplus is 0, year N is monthlySurplus * 12 * N", async () => {
    prismaMock.account.findMany.mockResolvedValue([] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);
    waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
      surplus: { amount: 500 },
    } as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.surplus[0]!.cumulative).toBe(0);
    expect(result.surplus[1]!.cumulative).toBe(6000);
    expect(result.surplus[3]!.cumulative).toBe(18000);
  });
});

describe("forecastService.getProjections — retirement", () => {
  it("pension series includes only pension accounts assigned to the member", async () => {
    prismaMock.account.findMany.mockResolvedValue([
      mockAccount({ id: "p1", type: "Pension", balance: 20000, memberId: "m-1" }),
      mockAccount({ id: "p2", type: "Pension", balance: 30000, memberId: "m-2" }),
    ] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: "m-1",
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
      {
        id: "m-2",
        householdId: "hh-1",
        userId: "user-2",
        retirementYear: 2060,
        user: { id: "user-2", name: "Bob" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    const alice = result.retirement.find((m) => m.memberId === "m-1")!;
    const bob = result.retirement.find((m) => m.memberId === "m-2")!;

    expect(alice.series[0]!.pension).toBe(20000);
    expect(bob.series[0]!.pension).toBe(30000);
  });

  it("passes through null retirementYear", async () => {
    prismaMock.account.findMany.mockResolvedValue([] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: "m-1",
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: null,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    expect(result.retirement[0]!.retirementYear).toBeNull();
  });

  it("returns all-zero series when no accounts or assets exist", async () => {
    prismaMock.account.findMany.mockResolvedValue([] as any);
    prismaMock.asset.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue(defaultSettings as any);
    prismaMock.member.findMany.mockResolvedValue([] as any);
    waterfallServiceMock.getWaterfallSummary.mockResolvedValue({ surplus: { amount: 0 } } as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.netWorth.every((p) => p.nominal === 0)).toBe(true);
    expect(result.surplus.every((p) => p.cumulative === 0)).toBe(true);
    expect(result.retirement).toHaveLength(0);
  });
});
