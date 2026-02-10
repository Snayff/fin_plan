import { describe, it, expect } from "vitest";
import { endOfDay } from "./balance.utils";

describe("endOfDay", () => {
  it("sets hours to 23:59:59.999", () => {
    const date = new Date("2025-06-15T10:30:00Z");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("does not mutate the original date", () => {
    const original = new Date("2025-06-15T10:30:00Z");
    const originalTime = original.getTime();
    endOfDay(original);
    expect(original.getTime()).toBe(originalTime);
  });

  it("handles midnight input", () => {
    const date = new Date("2025-06-15T00:00:00.000");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it("preserves the date (year, month, day)", () => {
    const date = new Date("2025-12-31T10:00:00Z");
    const result = endOfDay(date);
    expect(result.getFullYear()).toBe(date.getFullYear());
    expect(result.getMonth()).toBe(date.getMonth());
    expect(result.getDate()).toBe(date.getDate());
  });

  it("handles end of year", () => {
    const date = new Date("2025-12-31T23:59:59.000");
    const result = endOfDay(date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
    expect(result.getMilliseconds()).toBe(999);
  });
});
