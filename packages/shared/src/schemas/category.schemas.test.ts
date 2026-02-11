import { describe, it, expect } from "bun:test";
import { createCategorySchema, updateCategorySchema } from "./category.schemas";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createCategorySchema", () => {
  it("accepts valid input with required fields", () => {
    const result = createCategorySchema.safeParse({ name: "Food", type: "expense" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all fields", () => {
    const result = createCategorySchema.safeParse({
      name: "Salary",
      type: "income",
      parentCategoryId: validUUID,
      color: "#FF5733",
      icon: "money",
      sortOrder: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createCategorySchema.safeParse({ name: "", type: "expense" });
    expect(result.success).toBe(false);
  });

  it("validates type enum (income, expense)", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts both valid type values", () => {
    expect(createCategorySchema.safeParse({ name: "Test", type: "income" }).success).toBe(true);
    expect(createCategorySchema.safeParse({ name: "Test", type: "expense" }).success).toBe(true);
  });

  it("validates color format (hex)", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", color: "red" });
    expect(result.success).toBe(false);
  });

  it("accepts valid hex color", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", color: "#3B82F6" });
    expect(result.success).toBe(true);
  });

  it("defaults color to #3B82F6", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#3B82F6");
    }
  });

  it("validates parentCategoryId as UUID", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", parentCategoryId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts null parentCategoryId", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", parentCategoryId: null });
    expect(result.success).toBe(true);
  });

  it("rejects negative sortOrder", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", sortOrder: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer sortOrder", () => {
    const result = createCategorySchema.safeParse({ name: "Test", type: "expense", sortOrder: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateCategorySchema.safeParse({ name: "Updated", color: "#FF0000" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = updateCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format when provided", () => {
    const result = updateCategorySchema.safeParse({ color: "invalid" });
    expect(result.success).toBe(false);
  });
});
