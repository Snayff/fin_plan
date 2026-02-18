import { describe, it, expect } from "bun:test";
import { createAssetSchema, updateAssetSchema, updateAssetValueSchema } from "./asset.schemas";

const validAssetInput = {
  name: "Investment Property",
  type: "housing" as const,
  currentValue: 250000,
};

describe("createAssetSchema", () => {
  it("accepts valid input with required fields only", () => {
    const result = createAssetSchema.safeParse(validAssetInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all optional fields", () => {
    const result = createAssetSchema.safeParse({
      ...validAssetInput,
      purchaseValue: 200000,
      purchaseDate: "2020-06-15",
      expectedGrowthRate: 3.0,
      metadata: { location: "London" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects negative currentValue", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, currentValue: -100 });
    expect(result.success).toBe(false);
  });

  it("accepts currentValue of 0", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, currentValue: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects negative purchaseValue", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, purchaseValue: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects growth rate below -100", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, expectedGrowthRate: -101 });
    expect(result.success).toBe(false);
  });

  it("rejects growth rate above 1000", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, expectedGrowthRate: 1001 });
    expect(result.success).toBe(false);
  });

  it("accepts growth rate at boundaries", () => {
    expect(createAssetSchema.safeParse({ ...validAssetInput, expectedGrowthRate: -100 }).success).toBe(true);
    expect(createAssetSchema.safeParse({ ...validAssetInput, expectedGrowthRate: 1000 }).success).toBe(true);
  });

  it("defaults expectedGrowthRate to 0", () => {
    const result = createAssetSchema.safeParse(validAssetInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expectedGrowthRate).toBe(0);
    }
  });

  it("validates type enum", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, type: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid asset types", () => {
    for (const type of ["housing", "investment", "vehicle", "business", "personal_property", "crypto"]) {
      const result = createAssetSchema.safeParse({ ...validAssetInput, type });
      expect(result.success).toBe(true);
    }
  });

  it("transforms purchaseDate Date to ISO string", () => {
    const date = new Date("2020-06-15T00:00:00Z");
    const result = createAssetSchema.safeParse({ ...validAssetInput, purchaseDate: date });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchaseDate).toBe(date.toISOString());
    }
  });

  it("accepts depreciation growth rates", () => {
    const result = createAssetSchema.safeParse({ ...validAssetInput, expectedGrowthRate: -12.5 });
    expect(result.success).toBe(true);
  });
});

describe("updateAssetSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateAssetSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateAssetSchema.safeParse({ name: "Updated Name", expectedGrowthRate: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = updateAssetSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects growth rate out of bounds when provided", () => {
    expect(updateAssetSchema.safeParse({ expectedGrowthRate: -101 }).success).toBe(false);
    expect(updateAssetSchema.safeParse({ expectedGrowthRate: 1001 }).success).toBe(false);
  });
});

describe("updateAssetValueSchema", () => {
  it("accepts valid input", () => {
    const result = updateAssetValueSchema.safeParse({ newValue: 300000 });
    expect(result.success).toBe(true);
  });

  it("rejects negative newValue", () => {
    const result = updateAssetValueSchema.safeParse({ newValue: -1 });
    expect(result.success).toBe(false);
  });

  it("defaults source to manual", () => {
    const result = updateAssetValueSchema.safeParse({ newValue: 300000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("manual");
    }
  });

  it("accepts all valid source values", () => {
    for (const source of ["manual", "automatic", "calculated"]) {
      const result = updateAssetValueSchema.safeParse({ newValue: 300000, source });
      expect(result.success).toBe(true);
    }
  });

  it("transforms date to ISO string when Date provided", () => {
    const date = new Date("2025-06-15T00:00:00Z");
    const result = updateAssetValueSchema.safeParse({ newValue: 300000, date });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBe(date.toISOString());
    }
  });
});
