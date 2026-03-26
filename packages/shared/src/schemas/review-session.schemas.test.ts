import { describe, it, expect } from "bun:test";
import { confirmedItemsSchema, updatedItemsSchema } from "./review-session.schemas";

describe("confirmedItemsSchema", () => {
  it("accepts valid record of string arrays", () => {
    const result = confirmedItemsSchema.safeParse({
      income_source: ["inc-1", "inc-2"],
      committed_bill: ["bill-1"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = confirmedItemsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects non-string array values", () => {
    const result = confirmedItemsSchema.safeParse({
      income_source: [123],
    });
    expect(result.success).toBe(false);
  });
});

describe("updatedItemsSchema", () => {
  it("accepts valid record of from/to objects", () => {
    const result = updatedItemsSchema.safeParse({
      "inc-1": { from: 3000, to: 3500 },
      "bill-1": { from: 50, to: 60 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updatedItemsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects missing 'to' field", () => {
    const result = updatedItemsSchema.safeParse({
      "inc-1": { from: 3000 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric values", () => {
    const result = updatedItemsSchema.safeParse({
      "inc-1": { from: "three thousand", to: 3500 },
    });
    expect(result.success).toBe(false);
  });
});
