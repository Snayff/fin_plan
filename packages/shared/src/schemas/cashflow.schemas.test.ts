import { describe, it, expect } from "bun:test";
import {
  cashflowProjectionQuerySchema,
  cashflowMonthDetailQuerySchema,
  bulkUpdateLinkedAccountsSchema,
} from "./cashflow.schemas";

describe("cashflowProjectionQuerySchema", () => {
  it("accepts valid month range 1-24", () => {
    expect(cashflowProjectionQuerySchema.parse({ monthCount: 12 }).monthCount).toBe(12);
    expect(cashflowProjectionQuerySchema.parse({ monthCount: 1 }).monthCount).toBe(1);
    expect(cashflowProjectionQuerySchema.parse({ monthCount: 24 }).monthCount).toBe(24);
  });

  it("defaults monthCount to 12", () => {
    expect(cashflowProjectionQuerySchema.parse({}).monthCount).toBe(12);
  });

  it("rejects monthCount > 24 or < 1", () => {
    expect(cashflowProjectionQuerySchema.safeParse({ monthCount: 0 }).success).toBe(false);
    expect(cashflowProjectionQuerySchema.safeParse({ monthCount: 25 }).success).toBe(false);
  });
});

describe("cashflowMonthDetailQuerySchema", () => {
  it("validates year and month bounds", () => {
    expect(cashflowMonthDetailQuerySchema.parse({ year: 2026, month: 4 })).toEqual({
      year: 2026,
      month: 4,
    });
    expect(cashflowMonthDetailQuerySchema.safeParse({ year: 1999, month: 4 }).success).toBe(false);
    expect(cashflowMonthDetailQuerySchema.safeParse({ year: 2026, month: 13 }).success).toBe(false);
  });
});

describe("bulkUpdateLinkedAccountsSchema", () => {
  it("accepts an array of {accountId, isCashflowLinked} entries", () => {
    const result = bulkUpdateLinkedAccountsSchema.parse({
      updates: [
        { accountId: "a1", isCashflowLinked: true },
        { accountId: "a2", isCashflowLinked: false },
      ],
    });
    expect(result.updates).toHaveLength(2);
  });
});

import { cashflowShortfallQuerySchema } from "./cashflow.schemas";

describe("cashflowShortfallQuerySchema", () => {
  it("defaults windowDays to 30 when omitted", () => {
    const parsed = cashflowShortfallQuerySchema.parse({});
    expect(parsed.windowDays).toBe(30);
  });

  it("coerces string input to integer", () => {
    const parsed = cashflowShortfallQuerySchema.parse({ windowDays: "14" });
    expect(parsed.windowDays).toBe(14);
  });

  it("rejects values below 1", () => {
    expect(() => cashflowShortfallQuerySchema.parse({ windowDays: 0 })).toThrow();
  });

  it("rejects values above 90", () => {
    expect(() => cashflowShortfallQuerySchema.parse({ windowDays: 91 })).toThrow();
  });
});
