import { describe, it, expect } from "bun:test";
import { toGBP } from "./toGBP";

describe("toGBP", () => {
  it("rounds to exactly 2 decimal places", () => {
    expect(toGBP(10.555)).toBe(10.56);
    expect(toGBP(10.554)).toBe(10.55);
  });

  it("handles whole numbers", () => {
    expect(toGBP(100)).toBe(100);
  });

  it("handles negative numbers", () => {
    expect(toGBP(-10.555)).toBe(-10.56);
  });

  it("handles very small floating point drift", () => {
    expect(toGBP(0.1 + 0.2)).toBe(0.3);
  });

  it("handles zero", () => {
    expect(toGBP(0)).toBe(0);
  });

  it("rounds 1200/12 cleanly", () => {
    expect(toGBP(1200 / 12)).toBe(100);
  });

  it("rounds indivisible amounts", () => {
    expect(toGBP(1000 / 3)).toBe(333.33);
  });
});
