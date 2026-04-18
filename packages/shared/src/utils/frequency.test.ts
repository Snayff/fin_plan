import { describe, it, expect } from "bun:test";
import {
  toMonthlyAmount,
  toYearlyAmount,
  isRecurring,
  WEEKS_PER_YEAR,
  MONTHS_PER_YEAR,
} from "./frequency";

describe("toMonthlyAmount", () => {
  it("monthly returns amount unchanged", () => {
    expect(toMonthlyAmount(100, "monthly")).toBe(100);
  });

  it("weekly converts amount * 52 / 12", () => {
    expect(toMonthlyAmount(520, "weekly")).toBeCloseTo(
      (520 * WEEKS_PER_YEAR) / MONTHS_PER_YEAR,
    );
  });

  it("quarterly divides by 3", () => {
    expect(toMonthlyAmount(300, "quarterly")).toBe(100);
  });

  it("annual divides by 12", () => {
    expect(toMonthlyAmount(1200, "annual")).toBe(100);
  });

  it("yearly divides by 12", () => {
    expect(toMonthlyAmount(1200, "yearly")).toBe(100);
  });

  it("one_off returns 0", () => {
    expect(toMonthlyAmount(500, "one_off")).toBe(0);
  });
});

describe("toYearlyAmount", () => {
  it("monthly multiplies by 12", () => {
    expect(toYearlyAmount(100, "monthly")).toBe(1200);
  });

  it("weekly multiplies by 52", () => {
    expect(toYearlyAmount(10, "weekly")).toBe(520);
  });

  it("quarterly multiplies by 4", () => {
    expect(toYearlyAmount(300, "quarterly")).toBe(1200);
  });

  it("annual returns amount unchanged", () => {
    expect(toYearlyAmount(1200, "annual")).toBe(1200);
  });

  it("yearly returns amount unchanged", () => {
    expect(toYearlyAmount(1200, "yearly")).toBe(1200);
  });

  it("one_off returns 0", () => {
    expect(toYearlyAmount(500, "one_off")).toBe(0);
  });
});

describe("isRecurring", () => {
  it("returns true for monthly", () => {
    expect(isRecurring("monthly")).toBe(true);
  });

  it("returns true for weekly", () => {
    expect(isRecurring("weekly")).toBe(true);
  });

  it("returns true for quarterly", () => {
    expect(isRecurring("quarterly")).toBe(true);
  });

  it("returns true for annual", () => {
    expect(isRecurring("annual")).toBe(true);
  });

  it("returns true for yearly", () => {
    expect(isRecurring("yearly")).toBe(true);
  });

  it("returns false for one_off", () => {
    expect(isRecurring("one_off")).toBe(false);
  });
});

describe("toMonthlyAmount floating point", () => {
  it("weekly 520 ≈ 520 * 52 / 12", () => {
    expect(toMonthlyAmount(520, "weekly")).toBeCloseTo(
      (520 * WEEKS_PER_YEAR) / MONTHS_PER_YEAR,
    );
  });
});
