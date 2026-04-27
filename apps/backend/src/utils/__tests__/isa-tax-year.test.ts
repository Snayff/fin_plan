import { describe, it, expect } from "bun:test";
import { getIsaTaxYearWindow } from "../isa-tax-year.js";

describe("getIsaTaxYearWindow", () => {
  it("returns this year's 5 April when today is before that", () => {
    const w = getIsaTaxYearWindow(new Date("2026-02-15"));
    expect(w.start.toISOString().slice(0, 10)).toBe("2025-04-06");
    expect(w.end.toISOString().slice(0, 10)).toBe("2026-04-05");
  });

  it("returns next year's 5 April when today is past 5 April", () => {
    const w = getIsaTaxYearWindow(new Date("2026-04-10"));
    expect(w.start.toISOString().slice(0, 10)).toBe("2026-04-06");
    expect(w.end.toISOString().slice(0, 10)).toBe("2027-04-05");
  });

  it("treats 5 April itself as still inside this tax year", () => {
    const w = getIsaTaxYearWindow(new Date("2026-04-05"));
    expect(w.end.toISOString().slice(0, 10)).toBe("2026-04-05");
  });

  it("computes daysRemaining as whole days from today to end", () => {
    const w = getIsaTaxYearWindow(new Date("2026-04-01"));
    expect(w.daysRemaining).toBe(4);
  });
});
