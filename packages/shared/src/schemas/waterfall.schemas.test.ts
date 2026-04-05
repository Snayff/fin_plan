import { describe, it, expect } from "bun:test";
import {
  SpendTypeEnum,
  WaterfallTierEnum,
  createCommittedItemSchema,
  createDiscretionaryItemSchema,
} from "./waterfall.schemas";

describe("SpendTypeEnum", () => {
  it("accepts valid spend types", () => {
    expect(SpendTypeEnum.safeParse("monthly").success).toBe(true);
    expect(SpendTypeEnum.safeParse("yearly").success).toBe(true);
    expect(SpendTypeEnum.safeParse("one_off").success).toBe(true);
  });

  it("rejects invalid spend type", () => {
    expect(SpendTypeEnum.safeParse("weekly").success).toBe(false);
  });
});

describe("WaterfallTierEnum", () => {
  it("accepts valid tiers", () => {
    expect(WaterfallTierEnum.safeParse("income").success).toBe(true);
    expect(WaterfallTierEnum.safeParse("committed").success).toBe(true);
    expect(WaterfallTierEnum.safeParse("discretionary").success).toBe(true);
  });

  it("rejects surplus as a tier", () => {
    expect(WaterfallTierEnum.safeParse("surplus").success).toBe(false);
  });
});

describe("createCommittedItemSchema", () => {
  it("accepts valid committed item with subcategoryId and notes", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
      spendType: "monthly",
      notes: "Fixed rate until 2027",
    });
    expect(result.success).toBe(true);
  });

  it("defaults spendType to monthly", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.spendType).toBe("monthly");
    }
  });

  it("validates notes max length of 500", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("createDiscretionaryItemSchema", () => {
  it("accepts valid discretionary item", () => {
    const result = createDiscretionaryItemSchema.safeParse({
      name: "Emergency Fund",
      amount: 200,
      subcategoryId: "sub-2",
    });
    expect(result.success).toBe(true);
  });
});

describe("batchSaveSubcategoriesSchema", () => {
  it("accepts valid batch save payload", () => {
    const { batchSaveSubcategoriesSchema } = require("./waterfall.schemas");
    const result = batchSaveSubcategoriesSchema.safeParse({
      subcategories: [
        { id: "sub-1", name: "Housing", sortOrder: 0 },
        { name: "New Category", sortOrder: 1 },
      ],
      reassignments: [{ fromSubcategoryId: "sub-old", toSubcategoryId: "sub-1" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const { batchSaveSubcategoriesSchema } = require("./waterfall.schemas");
    const result = batchSaveSubcategoriesSchema.safeParse({
      subcategories: [{ name: "", sortOrder: 0 }],
      reassignments: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 24 characters", () => {
    const { batchSaveSubcategoriesSchema } = require("./waterfall.schemas");
    const result = batchSaveSubcategoriesSchema.safeParse({
      subcategories: [{ name: "A".repeat(25), sortOrder: 0 }],
      reassignments: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("resetSubcategoriesSchema", () => {
  it("accepts valid reset payload", () => {
    const { resetSubcategoriesSchema } = require("./waterfall.schemas");
    const result = resetSubcategoriesSchema.safeParse({
      reassignments: [{ fromSubcategoryId: "sub-custom", toSubcategoryId: "sub-other" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty reassignments", () => {
    const { resetSubcategoriesSchema } = require("./waterfall.schemas");
    const result = resetSubcategoriesSchema.safeParse({
      reassignments: [],
    });
    expect(result.success).toBe(true);
  });
});
