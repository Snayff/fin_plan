import { describe, it, expect } from "bun:test";
import { FinancialSummarySchema } from "./snapshot.schemas";

describe("FinancialSummarySchema", () => {
  it("accepts a valid summary with null net worth", () => {
    const result = FinancialSummarySchema.safeParse({
      current: { netWorth: null, income: 5000, committed: 1200, discretionary: 800, surplus: 3000 },
      sparklines: { netWorth: [], income: [], committed: [], discretionary: [], surplus: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a summary with sparkline data points", () => {
    const result = FinancialSummarySchema.safeParse({
      current: {
        netWorth: 45000,
        income: 5000,
        committed: 1200,
        discretionary: 800,
        surplus: 3000,
      },
      sparklines: {
        netWorth: [{ date: "2026-01-15", value: 44000 }],
        income: [{ date: "2026-01-01", value: 4800 }],
        committed: [],
        discretionary: [],
        surplus: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sparklines section", () => {
    const result = FinancialSummarySchema.safeParse({
      current: { netWorth: null, income: 5000, committed: 1200, discretionary: 800, surplus: 3000 },
    });
    expect(result.success).toBe(false);
  });
});
