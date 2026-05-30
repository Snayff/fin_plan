import { describe, test, expect } from "bun:test";
import { evaluateCoverage } from "./check-coverage";

const FLOOR = { functions: 63, lines: 74 };

describe("evaluateCoverage", () => {
  test("passes when current meets floor and matches baseline", () => {
    const result = evaluateCoverage({
      current: { "apps/backend": { functions: 80, lines: 82 } },
      baseline: { "apps/backend": { functions: 80, lines: 82 } },
      floor: FLOOR,
      ratchetTolerancePp: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test("fails when below fixed floor", () => {
    const result = evaluateCoverage({
      current: { "apps/backend": { functions: 60, lines: 82 } },
      baseline: { "apps/backend": { functions: 80, lines: 82 } },
      floor: FLOOR,
      ratchetTolerancePp: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.kind === "floor" && v.metric === "functions")).toBe(
      true
    );
  });

  test("fails on >1pp ratchet drop", () => {
    const result = evaluateCoverage({
      current: { "apps/backend": { functions: 78.5, lines: 82 } },
      baseline: { "apps/backend": { functions: 80, lines: 82 } },
      floor: FLOOR,
      ratchetTolerancePp: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.kind === "ratchet" && v.metric === "functions")).toBe(
      true
    );
  });

  test("passes on ≤1pp ratchet drop", () => {
    const result = evaluateCoverage({
      current: { "apps/backend": { functions: 79.5, lines: 82 } },
      baseline: { "apps/backend": { functions: 80, lines: 82 } },
      floor: FLOOR,
      ratchetTolerancePp: 1,
    });
    expect(result.ok).toBe(true);
  });

  test("applies per-package floor override instead of the default", () => {
    const result = evaluateCoverage({
      current: {
        "apps/backend": { functions: 65, lines: 80 },
        "packages/shared": { functions: 99, lines: 99 },
      },
      baseline: {
        "apps/backend": { functions: 65, lines: 80 },
        "packages/shared": { functions: 99, lines: 99 },
      },
      floor: FLOOR,
      floors: {
        // shared is held to a stricter floor than the default
        "packages/shared": { functions: 100, lines: 99 },
      },
      ratchetTolerancePp: 1,
    });
    // backend (65/80) clears the default floor; shared funcs 99 < 100 fails its override
    expect(result.ok).toBe(false);
    expect(
      result.violations.some(
        (v) => v.kind === "floor" && v.pkg === "packages/shared" && v.metric === "functions"
      )
    ).toBe(true);
    expect(result.violations.some((v) => v.pkg === "apps/backend")).toBe(false);
  });

  test("falls back to default floor when no override for a package", () => {
    const result = evaluateCoverage({
      current: { "apps/frontend": { functions: 60, lines: 80 } },
      baseline: { "apps/frontend": { functions: 60, lines: 80 } },
      floor: FLOOR,
      floors: { "packages/shared": { functions: 100, lines: 99 } },
      ratchetTolerancePp: 1,
    });
    // frontend funcs 60 < default floor 63 → fails via the default
    expect(result.ok).toBe(false);
    expect(
      result.violations.some(
        (v) => v.kind === "floor" && v.pkg === "apps/frontend" && v.metric === "functions"
      )
    ).toBe(true);
  });

  test("flags missing package in baseline", () => {
    const result = evaluateCoverage({
      current: { "apps/backend": { functions: 80, lines: 82 } },
      baseline: {},
      floor: FLOOR,
      ratchetTolerancePp: 1,
    });
    expect(result.violations.some((v) => v.kind === "missing-baseline")).toBe(true);
  });
});
