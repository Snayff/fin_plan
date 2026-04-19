import { describe, it, expect } from "bun:test";
import {
  ForecastQuerySchema,
  ForecastProjectionSchema,
  ForecastHorizonSchema,
} from "./forecast.schemas";

describe("ForecastHorizonSchema", () => {
  it("accepts valid horizon values", () => {
    for (const v of [1, 3, 10, 20, 30]) {
      expect(ForecastHorizonSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects invalid horizon values", () => {
    expect(ForecastHorizonSchema.safeParse(5).success).toBe(false);
    expect(ForecastHorizonSchema.safeParse(0).success).toBe(false);
    expect(ForecastHorizonSchema.safeParse(100).success).toBe(false);
  });
});

describe("ForecastQuerySchema", () => {
  it("coerces string horizonYears to number and validates", () => {
    const result = ForecastQuerySchema.safeParse({ horizonYears: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.horizonYears).toBe(10);
  });

  it("rejects invalid horizon via coercion", () => {
    expect(ForecastQuerySchema.safeParse({ horizonYears: "7" }).success).toBe(false);
  });
});

describe("ForecastProjectionSchema", () => {
  it("accepts a well-formed projection", () => {
    const projection = {
      netWorth: [
        { year: 2026, nominal: 50000, real: 50000 },
        { year: 2027, nominal: 53000, real: 51960 },
      ],
      surplus: [
        { year: 2026, cumulative: 0 },
        { year: 2027, cumulative: 12000 },
      ],
      retirement: [
        {
          memberId: "user-1",
          memberName: "Alice",
          retirementYear: 2055,
          series: [{ year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 }],
        },
      ],
      monthlyContributionsByScope: { netWorth: 300, retirement: 600 },
    };
    expect(ForecastProjectionSchema.safeParse(projection).success).toBe(true);
  });

  it("accepts null retirementYear", () => {
    const projection = {
      netWorth: [],
      surplus: [],
      retirement: [
        {
          memberId: "user-1",
          memberName: "Alice",
          retirementYear: null,
          series: [],
        },
      ],
      monthlyContributionsByScope: { netWorth: 0, retirement: 0 },
    };
    expect(ForecastProjectionSchema.safeParse(projection).success).toBe(true);
  });
});
