import { describe, it, expect } from "bun:test";
import { forecastContribution, type ForecastInput } from "../isa-forecast.js";

const today = new Date("2026-08-01"); // mid-tax-year, ~248 days to 5 Apr 2027
const end = new Date("2027-04-05");

describe("forecastContribution", () => {
  it("monthly with dueDate counts occurrences in window", () => {
    const result = forecastContribution(
      [{ amount: 500, spendType: "monthly", dueDate: new Date("2026-08-15") }],
      today,
      end
    );
    // Aug 15 through Mar 15 inclusive = 8 occurrences
    expect(result.amount).toBeCloseTo(500 * 8, 5);
    expect(result.estimated).toBe(false);
  });

  it("yearly with dueDate inside window includes full amount", () => {
    const result = forecastContribution(
      [{ amount: 3000, spendType: "yearly", dueDate: new Date("2027-03-30") }],
      today,
      end
    );
    expect(result.amount).toBe(3000);
    expect(result.estimated).toBe(false);
  });

  it("yearly with dueDate outside window contributes 0", () => {
    const result = forecastContribution(
      [{ amount: 3000, spendType: "yearly", dueDate: new Date("2027-05-01") }],
      today,
      end
    );
    expect(result.amount).toBe(0);
    expect(result.estimated).toBe(false);
  });

  it("one_off with dueDate in window includes full amount", () => {
    const result = forecastContribution(
      [{ amount: 1000, spendType: "one_off", dueDate: new Date("2026-12-01") }],
      today,
      end
    );
    expect(result.amount).toBe(1000);
  });

  it("monthly without dueDate pro-rates and flags estimated", () => {
    const result = forecastContribution(
      [{ amount: 200, spendType: "monthly", dueDate: null }],
      today,
      end
    );
    // 8 whole months from Aug to Apr — implementation may use floor or round; assert range.
    expect(result.amount).toBeGreaterThanOrEqual(200 * 7);
    expect(result.amount).toBeLessThanOrEqual(200 * 9);
    expect(result.estimated).toBe(true);
  });

  it("yearly without dueDate contributes 0 and is not estimated", () => {
    const result = forecastContribution(
      [{ amount: 3000, spendType: "yearly", dueDate: null }],
      today,
      end
    );
    expect(result.amount).toBe(0);
    expect(result.estimated).toBe(false);
  });

  it("aggregates multiple items", () => {
    const result = forecastContribution(
      [
        { amount: 500, spendType: "monthly", dueDate: new Date("2026-08-15") },
        { amount: 3000, spendType: "yearly", dueDate: new Date("2027-03-30") },
      ],
      today,
      end
    );
    expect(result.amount).toBeCloseTo(500 * 8 + 3000, 5);
  });

  // ── weekly ────────────────────────────────────────────────────────────────
  it("weekly with dueDate counts every 7 days in the window", () => {
    // 4-week window, anchor inside it → 5 occurrences (day 0,7,14,21,28).
    const start = new Date("2026-08-01");
    const windowEnd = new Date("2026-08-29");
    const result = forecastContribution(
      [{ amount: 10, spendType: "weekly", dueDate: new Date("2026-08-01") }],
      start,
      windowEnd
    );
    expect(result.amount).toBe(10 * 5);
    expect(result.estimated).toBe(false);
  });

  it("weekly anchored before the window rolls forward to the first occurrence", () => {
    // Anchor two weeks before start; first in-window hit is start itself.
    const start = new Date("2026-08-15");
    const windowEnd = new Date("2026-08-28"); // two weeks → 2 occurrences
    const result = forecastContribution(
      [{ amount: 4, spendType: "weekly", dueDate: new Date("2026-08-01") }],
      start,
      windowEnd
    );
    expect(result.amount).toBe(4 * 2);
  });

  it("weekly without dueDate pro-rates by days/7 and flags estimated", () => {
    const start = new Date("2026-08-01");
    const windowEnd = new Date("2026-08-29"); // 28 days → 4 weeks
    const result = forecastContribution(
      [{ amount: 10, spendType: "weekly", dueDate: null }],
      start,
      windowEnd
    );
    expect(result.amount).toBeCloseTo(10 * (28 / 7), 5);
    expect(result.estimated).toBe(true);
  });

  // ── quarterly ─────────────────────────────────────────────────────────────
  it("quarterly with dueDate counts 3-month steps in the window", () => {
    const result = forecastContribution(
      [{ amount: 100, spendType: "quarterly", dueDate: new Date("2026-08-15") }],
      today,
      end
    );
    // Aug, Nov, Feb fall in [Aug 2026, Apr 2027] → 3 occurrences.
    expect(result.amount).toBe(100 * 3);
    expect(result.estimated).toBe(false);
  });

  it("quarterly without dueDate pro-rates and flags estimated", () => {
    const result = forecastContribution(
      [{ amount: 90, spendType: "quarterly", dueDate: null }],
      today,
      end
    );
    expect(result.estimated).toBe(true);
    expect(result.amount).toBeGreaterThan(0);
  });

  // ── edge cases ──────────────────────────────────────────────────────────────
  it("ignores items with a non-positive amount", () => {
    const result = forecastContribution(
      [
        { amount: 0, spendType: "monthly", dueDate: new Date("2026-08-15") },
        { amount: -50, spendType: "weekly", dueDate: new Date("2026-08-15") },
      ],
      today,
      end
    );
    expect(result.amount).toBe(0);
    expect(result.estimated).toBe(false);
  });

  it("returns 0 when the window is empty (end before start)", () => {
    const result = forecastContribution(
      [{ amount: 100, spendType: "weekly", dueDate: new Date("2026-08-15") }],
      new Date("2026-08-29"),
      new Date("2026-08-01")
    );
    expect(result.amount).toBe(0);
  });

  it("returns an empty, non-estimated result for no items", () => {
    const result = forecastContribution([], today, end);
    expect(result).toEqual({ amount: 0, estimated: false });
  });
});
