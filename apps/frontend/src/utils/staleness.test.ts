import { describe, it, expect } from "bun:test";
import { monthsElapsed, isStale, stalenessLabel } from "./staleness";

describe("monthsElapsed", () => {
  it("returns 0 for a date within the same month", () => {
    const now = new Date("2026-03-15");
    const reviewed = new Date("2026-03-01");
    expect(monthsElapsed(reviewed, now)).toBe(0);
  });

  it("returns 3 for a date exactly 3 months ago", () => {
    const now = new Date("2026-06-15");
    const reviewed = new Date("2026-03-10");
    expect(monthsElapsed(reviewed, now)).toBe(3);
  });

  it("accepts ISO string input", () => {
    const now = new Date("2026-06-15");
    expect(monthsElapsed("2026-03-10T00:00:00Z", now)).toBe(3);
  });
});

describe("isStale", () => {
  it("returns false when within threshold", () => {
    const now = new Date("2026-03-15");
    const reviewed = new Date("2026-01-20");
    expect(isStale(reviewed, 6, now)).toBe(false);
  });

  it("returns true when at or past threshold", () => {
    const now = new Date("2026-09-15");
    const reviewed = new Date("2026-03-10");
    expect(isStale(reviewed, 6, now)).toBe(true);
  });
});

describe("stalenessLabel", () => {
  it("returns 'this month' for recent review", () => {
    const now = new Date("2026-03-15");
    const reviewed = new Date("2026-03-01");
    expect(stalenessLabel(reviewed, now)).toBe("Last reviewed: this month");
  });

  it("returns '1 month ago' for singular", () => {
    const now = new Date("2026-04-15");
    const reviewed = new Date("2026-03-10");
    expect(stalenessLabel(reviewed, now)).toBe("Last reviewed: 1 month ago");
  });

  it("returns 'N months ago' for plural", () => {
    const now = new Date("2026-08-15");
    const reviewed = new Date("2026-03-10");
    expect(stalenessLabel(reviewed, now)).toBe("Last reviewed: 5 months ago");
  });
});
