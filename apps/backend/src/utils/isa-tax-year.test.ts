import { describe, it, expect } from "bun:test";
import { getIsaTaxYearWindow } from "./isa-tax-year";

/** UK ISA tax year runs 6 April → 5 April. */
describe("getIsaTaxYearWindow", () => {
  // ── Happy path: mid-year date ────────────────────────────────────────────────
  it("for a date after 5 April, the window ends 5 April next year", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 5, 15))); // 15 Jun 2026

    expect(w.start).toEqual(new Date(Date.UTC(2026, 3, 6))); // 6 Apr 2026
    expect(w.end).toEqual(new Date(Date.UTC(2027, 3, 5))); // 5 Apr 2027
  });

  it("for a date before 6 April, the window ends 5 April this year", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 1, 1))); // 1 Feb 2026

    expect(w.start).toEqual(new Date(Date.UTC(2025, 3, 6))); // 6 Apr 2025
    expect(w.end).toEqual(new Date(Date.UTC(2026, 3, 5))); // 5 Apr 2026
  });

  // ── Boundary: the 5 / 6 April pivot ──────────────────────────────────────────
  it("treats 5 April as the last day of the ending tax year", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 3, 5))); // 5 Apr 2026

    expect(w.end).toEqual(new Date(Date.UTC(2026, 3, 5)));
    expect(w.daysRemaining).toBe(0);
  });

  it("rolls over to the next tax year on 6 April", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 3, 6))); // 6 Apr 2026

    expect(w.start).toEqual(new Date(Date.UTC(2026, 3, 6)));
    expect(w.end).toEqual(new Date(Date.UTC(2027, 3, 5)));
  });

  // ── daysRemaining ────────────────────────────────────────────────────────────
  it("counts whole days remaining to 5 April", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 3, 1))); // 1 Apr 2026

    expect(w.daysRemaining).toBe(4); // 1→5 April
  });

  it("never returns a negative daysRemaining", () => {
    const w = getIsaTaxYearWindow(new Date(Date.UTC(2026, 3, 5)));
    expect(w.daysRemaining).toBeGreaterThanOrEqual(0);
  });
});
