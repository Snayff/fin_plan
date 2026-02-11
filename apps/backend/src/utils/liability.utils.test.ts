import { describe, it, expect } from "bun:test";
import {
  calculateMonthlyInterest,
  calculatePayoffDate,
  calculateAmortizationSchedule,
  calculateTotalInterest,
  calculateMonthlyInterestBreakdown,
  validateMinimumPayment,
} from "./liability.utils";
import { addMonths } from "date-fns";

describe("calculateMonthlyInterest", () => {
  it("returns 0 for zero balance", () => {
    expect(calculateMonthlyInterest(0, 5)).toBe(0);
  });

  it("returns 0 for zero interest rate", () => {
    expect(calculateMonthlyInterest(10000, 0)).toBe(0);
  });

  it("returns 0 for negative balance", () => {
    expect(calculateMonthlyInterest(-5000, 5)).toBe(0);
  });

  it("returns 0 for negative interest rate", () => {
    expect(calculateMonthlyInterest(10000, -3)).toBe(0);
  });

  it("calculates correctly for standard scenario (10000 @ 5%)", () => {
    // 10000 * 0.05 / 12 = 41.6667
    const result = calculateMonthlyInterest(10000, 5);
    expect(result).toBeCloseTo(41.67, 2);
  });

  it("calculates correctly for credit card scenario (5000 @ 24%)", () => {
    // 5000 * 0.24 / 12 = 100
    expect(calculateMonthlyInterest(5000, 24)).toBe(100);
  });

  it("handles very small balances", () => {
    // 0.01 * 0.05 / 12 ≈ 0.0000417
    const result = calculateMonthlyInterest(0.01, 5);
    expect(result).toBeCloseTo(0.0000417, 6);
  });

  it("handles high interest rates", () => {
    // 10000 * 0.9999 / 12 = 833.25
    const result = calculateMonthlyInterest(10000, 99.99);
    expect(result).toBeCloseTo(833.25, 1);
  });
});

describe("calculatePayoffDate", () => {
  const startDate = new Date("2025-01-01T00:00:00Z");

  it("returns startDate for zero balance", () => {
    const result = calculatePayoffDate(0, 5, 500, startDate);
    expect(result).toEqual(startDate);
  });

  it("returns null for zero payment", () => {
    expect(calculatePayoffDate(10000, 5, 0, startDate)).toBeNull();
  });

  it("returns null for negative payment", () => {
    expect(calculatePayoffDate(10000, 5, -100, startDate)).toBeNull();
  });

  it("returns null when payment equals monthly interest (debt trap)", () => {
    // Monthly interest = 10000 * 0.12 / 12 = 100
    expect(calculatePayoffDate(10000, 12, 100, startDate)).toBeNull();
  });

  it("returns null when payment is less than monthly interest", () => {
    // Monthly interest = 10000 * 0.12 / 12 = 100
    expect(calculatePayoffDate(10000, 12, 50, startDate)).toBeNull();
  });

  it("calculates correctly for 0% interest (simple division)", () => {
    // 10000 / 500 = 20 months
    const result = calculatePayoffDate(10000, 0, 500, startDate);
    expect(result).toEqual(addMonths(startDate, 20));
  });

  it("calculates correctly for 0% interest with remainder", () => {
    // 10000 / 300 = 33.33 → ceil to 34 months
    const result = calculatePayoffDate(10000, 0, 300, startDate);
    expect(result).toEqual(addMonths(startDate, 34));
  });

  it("calculates standard mortgage scenario", () => {
    // 200000 @ 3.5% with 898/mo should be ~360 months (30 years)
    const result = calculatePayoffDate(200000, 3.5, 898, startDate);
    expect(result).not.toBeNull();
    // The payoff should be approximately 30 years (360 months) from start
    const monthsDiff =
      (result!.getFullYear() - startDate.getFullYear()) * 12 +
      (result!.getMonth() - startDate.getMonth());
    expect(monthsDiff).toBeGreaterThanOrEqual(350);
    expect(monthsDiff).toBeLessThanOrEqual(370);
  });

  it("calculates credit card payoff", () => {
    // 5000 @ 24% with 200/mo
    const result = calculatePayoffDate(5000, 24, 200, startDate);
    expect(result).not.toBeNull();
    const monthsDiff =
      (result!.getFullYear() - startDate.getFullYear()) * 12 +
      (result!.getMonth() - startDate.getMonth());
    // Should be about 33-36 months (exact depends on amortization rounding)
    expect(monthsDiff).toBeGreaterThanOrEqual(30);
    expect(monthsDiff).toBeLessThanOrEqual(40);
  });

  it("uses default startDate when not provided", () => {
    const result = calculatePayoffDate(1000, 0, 500);
    expect(result).not.toBeNull();
    // Should be 2 months from now (approximately)
    const now = new Date();
    const expectedApprox = addMonths(now, 2);
    expect(result!.getMonth()).toBe(expectedApprox.getMonth());
  });
});

describe("calculateAmortizationSchedule", () => {
  const startDate = new Date("2025-01-01T00:00:00Z");

  it("returns empty array for zero balance", () => {
    expect(calculateAmortizationSchedule(0, 5, 500, startDate)).toEqual([]);
  });

  it("returns empty array for zero payment", () => {
    expect(calculateAmortizationSchedule(10000, 5, 0, startDate)).toEqual([]);
  });

  it("returns empty array for negative payment", () => {
    expect(calculateAmortizationSchedule(10000, 5, -100, startDate)).toEqual([]);
  });

  it("generates correct schedule for 0% interest", () => {
    const schedule = calculateAmortizationSchedule(1000, 0, 300, startDate);
    expect(schedule.length).toBe(4); // 1000 / 300 = 3.33 → 4 payments

    // First 3 payments should be full 300
    expect(schedule[0].payment).toBe(300);
    expect(schedule[0].interest).toBe(0);
    expect(schedule[0].principal).toBe(300);
    expect(schedule[0].balance).toBe(700);

    // Last payment should be the remainder (100)
    const last = schedule[schedule.length - 1];
    expect(last.payment).toBe(100);
    expect(last.balance).toBe(0);
  });

  it("generates correct schedule for standard loan", () => {
    // Small loan for easy verification: 1000 @ 12% (1%/month) with 200/month
    const schedule = calculateAmortizationSchedule(1000, 12, 200, startDate);

    // First month: interest = 1000 * 0.01 = 10, principal = 190, balance = 810
    expect(schedule[0].interest).toBe(10);
    expect(schedule[0].principal).toBe(190);
    expect(schedule[0].balance).toBe(810);
    expect(schedule[0].month).toBe(1);
    expect(schedule[0].date).toBe("2025-02-01");
  });

  it("caps at 360 months maximum", () => {
    // Huge balance with tiny payment that covers interest barely
    const schedule = calculateAmortizationSchedule(1000000, 5, 4200, startDate);
    expect(schedule.length).toBeLessThanOrEqual(360);
  });

  it("ends with balance of 0 or near-zero", () => {
    const schedule = calculateAmortizationSchedule(10000, 5, 500, startDate);
    const lastEntry = schedule[schedule.length - 1];
    expect(lastEntry.balance).toBeLessThanOrEqual(0.01);
  });

  it("has correct month numbers (1-indexed)", () => {
    const schedule = calculateAmortizationSchedule(1000, 0, 500, startDate);
    schedule.forEach((entry, index) => {
      expect(entry.month).toBe(index + 1);
    });
  });

  it("sum of all principal payments equals original balance", () => {
    const balance = 10000;
    const schedule = calculateAmortizationSchedule(balance, 6, 500, startDate);
    const totalPrincipal = schedule.reduce((sum, entry) => sum + entry.principal, 0);
    expect(totalPrincipal).toBeCloseTo(balance, 0);
  });

  it("all values are rounded to 2 decimal places", () => {
    const schedule = calculateAmortizationSchedule(10000, 7.5, 300, startDate);
    for (const entry of schedule) {
      expect(entry.payment).toBe(Number(entry.payment.toFixed(2)));
      expect(entry.principal).toBe(Number(entry.principal.toFixed(2)));
      expect(entry.interest).toBe(Number(entry.interest.toFixed(2)));
      expect(entry.balance).toBe(Number(entry.balance.toFixed(2)));
    }
  });

  it("handles final payment being less than regular payment", () => {
    const schedule = calculateAmortizationSchedule(1000, 0, 300, startDate);
    const lastEntry = schedule[schedule.length - 1];
    // Last payment should be 100 (remainder), not 300
    expect(lastEntry.payment).toBeLessThan(300);
  });

  it("breaks when payment cannot cover interest", () => {
    // Monthly interest = 10000 * 0.24 / 12 = 200. Payment = 150 < 200.
    const schedule = calculateAmortizationSchedule(10000, 24, 150, startDate);
    // Should break early since principal would be negative
    expect(schedule.length).toBeLessThan(360);
  });
});

describe("calculateTotalInterest", () => {
  it("returns 0 for 0% interest rate", () => {
    expect(calculateTotalInterest(10000, 0, 500)).toBe(0);
  });

  it("calculates total interest for standard loan", () => {
    // 1000 @ 12% with 200/mo
    const total = calculateTotalInterest(1000, 12, 200);
    expect(total).toBeGreaterThan(0);
    // Total payments ~ 6 * 200 = 1200 minus 1000 principal ≈ ~30 interest
    expect(total).toBeCloseTo(31.57, 0);
  });

  it("result is rounded to 2 decimal places", () => {
    const total = calculateTotalInterest(10000, 7.5, 300);
    expect(total).toBe(Number(total.toFixed(2)));
  });

  it("returns 0 for zero balance", () => {
    expect(calculateTotalInterest(0, 5, 500)).toBe(0);
  });
});

describe("calculateMonthlyInterestBreakdown", () => {
  it("returns first N months of full schedule", () => {
    const breakdown = calculateMonthlyInterestBreakdown(10000, 5, 500, 3);
    expect(breakdown.length).toBe(3);
    expect(breakdown[0].month).toBe(1);
    expect(breakdown[2].month).toBe(3);
  });

  it("returns full schedule if months exceeds schedule length", () => {
    const fullSchedule = calculateAmortizationSchedule(1000, 0, 500);
    const breakdown = calculateMonthlyInterestBreakdown(1000, 0, 500, 100);
    expect(breakdown.length).toBe(fullSchedule.length);
  });

  it("returns empty array for zero balance", () => {
    expect(calculateMonthlyInterestBreakdown(0, 5, 500, 12)).toEqual([]);
  });
});

describe("validateMinimumPayment", () => {
  it("returns valid for zero balance", () => {
    const result = validateMinimumPayment(0, 5, 0);
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("returns invalid for zero payment on positive balance", () => {
    const result = validateMinimumPayment(10000, 5, 0);
    expect(result.isValid).toBe(false);
    expect(result.message).toBeDefined();
  });

  it("returns invalid when payment equals monthly interest", () => {
    // Monthly interest = 10000 * 0.12 / 12 = 100
    const result = validateMinimumPayment(10000, 12, 100);
    expect(result.isValid).toBe(false);
  });

  it("returns invalid when payment is less than monthly interest", () => {
    const result = validateMinimumPayment(10000, 12, 50);
    expect(result.isValid).toBe(false);
  });

  it("message includes the monthly interest amount", () => {
    const result = validateMinimumPayment(10000, 12, 50);
    // Monthly interest = £100.00
    expect(result.message).toContain("100.00");
  });

  it("returns valid for 0% interest with any positive payment", () => {
    const result = validateMinimumPayment(10000, 0, 1);
    expect(result.isValid).toBe(true);
  });

  it("returns valid for sufficient payment", () => {
    const result = validateMinimumPayment(10000, 12, 200);
    expect(result.isValid).toBe(true);
  });

  it("returns invalid with message for negative payment on positive balance", () => {
    const result = validateMinimumPayment(10000, 5, -100);
    expect(result.isValid).toBe(false);
    expect(result.message).toBeDefined();
  });
});
