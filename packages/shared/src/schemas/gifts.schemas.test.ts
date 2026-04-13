import { describe, it, expect } from "bun:test";
import {
  GiftDateTypeEnum,
  createGiftPersonSchema,
  createGiftEventSchema,
  upsertGiftAllocationSchema,
  bulkUpsertAllocationsSchema,
  setGiftBudgetSchema,
  setGiftPlannerModeSchema,
} from "./gifts.schemas";

describe("gifts schemas", () => {
  it("GiftDateTypeEnum allows shared and personal", () => {
    expect(GiftDateTypeEnum.parse("shared")).toBe("shared");
    expect(GiftDateTypeEnum.parse("personal")).toBe("personal");
    expect(() => GiftDateTypeEnum.parse("other")).toThrow();
  });

  it("createGiftPersonSchema requires non-empty name", () => {
    expect(() => createGiftPersonSchema.parse({ name: "" })).toThrow();
    expect(createGiftPersonSchema.parse({ name: "Mum" })).toEqual({ name: "Mum" });
  });

  it("createGiftEventSchema requires shared events to have month + day", () => {
    expect(() => createGiftEventSchema.parse({ name: "Christmas", dateType: "shared" })).toThrow();
    expect(
      createGiftEventSchema.parse({
        name: "Christmas",
        dateType: "shared",
        dateMonth: 12,
        dateDay: 25,
      })
    ).toMatchObject({ name: "Christmas", dateType: "shared", dateMonth: 12, dateDay: 25 });
  });

  it("createGiftEventSchema rejects month/day for personal events", () => {
    const parsed = createGiftEventSchema.parse({
      name: "Birthday",
      dateType: "personal",
    });
    expect(parsed.dateMonth).toBeUndefined();
    expect(parsed.dateDay).toBeUndefined();
  });

  it("upsertGiftAllocationSchema rejects negative planned/spent", () => {
    expect(() => upsertGiftAllocationSchema.parse({ planned: -1 })).toThrow();
    expect(() => upsertGiftAllocationSchema.parse({ spent: -5 })).toThrow();
    expect(upsertGiftAllocationSchema.parse({ planned: 50, spent: 0 })).toEqual({
      planned: 50,
      spent: 0,
    });
  });

  it("upsertGiftAllocationSchema accepts spent: null to clear", () => {
    expect(upsertGiftAllocationSchema.parse({ spent: null })).toEqual({ spent: null });
  });

  it("bulkUpsertAllocationsSchema caps payload at 500 cells", () => {
    const cell = { personId: "p", eventId: "e", year: 2026, planned: 1 };
    expect(() =>
      bulkUpsertAllocationsSchema.parse({
        cells: Array.from({ length: 501 }, () => cell),
      })
    ).toThrow();
    const ok = bulkUpsertAllocationsSchema.parse({
      cells: Array.from({ length: 500 }, () => cell),
    });
    expect(ok.cells).toHaveLength(500);
  });

  it("setGiftBudgetSchema requires non-negative budget", () => {
    expect(() => setGiftBudgetSchema.parse({ annualBudget: -1 })).toThrow();
    expect(setGiftBudgetSchema.parse({ annualBudget: 1500 })).toEqual({ annualBudget: 1500 });
  });

  it("setGiftPlannerModeSchema only accepts known modes", () => {
    expect(setGiftPlannerModeSchema.parse({ mode: "synced" }).mode).toBe("synced");
    expect(setGiftPlannerModeSchema.parse({ mode: "independent" }).mode).toBe("independent");
    expect(() => setGiftPlannerModeSchema.parse({ mode: "off" })).toThrow();
  });
});
