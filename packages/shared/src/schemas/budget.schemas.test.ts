import { describe, it, expect } from "bun:test";
import {
  createBudgetSchema,
  updateBudgetSchema,
  addBudgetItemSchema,
  updateBudgetItemSchema,
} from "./budget.schemas";

describe("createBudgetSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createBudgetSchema.safeParse({
      name: "Monthly Budget",
      period: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(result.success).toBe(true);
  });

  it("accepts all period types", () => {
    const periods = ["monthly", "quarterly", "annual", "custom"];
    periods.forEach((period) => {
      const result = createBudgetSchema.safeParse({
        name: "Test Budget",
        period,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
      expect(result.success).toBe(true);
    });
  });

  it("transforms Date startDate and endDate to ISO string", () => {
    const result = createBudgetSchema.safeParse({
      name: "Date transform budget",
      period: "monthly",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      endDate: new Date("2025-01-31T23:59:59.999Z"),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe("2025-01-01T00:00:00.000Z");
      expect(result.data.endDate).toBe("2025-01-31T23:59:59.999Z");
    }
  });

  it("rejects empty name", () => {
    const result = createBudgetSchema.safeParse({
      name: "",
      period: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid period", () => {
    const result = createBudgetSchema.safeParse({
      name: "Test",
      period: "weekly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing startDate", () => {
    const result = createBudgetSchema.safeParse({
      name: "Test",
      period: "monthly",
      endDate: "2025-01-31",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing endDate", () => {
    const result = createBudgetSchema.safeParse({
      name: "Test",
      period: "monthly",
      startDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBudgetSchema", () => {
  it("accepts empty object", () => {
    const result = updateBudgetSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with just name", () => {
    const result = updateBudgetSchema.safeParse({
      name: "Updated Budget Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with period and isActive", () => {
    const result = updateBudgetSchema.safeParse({
      period: "quarterly",
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts Date objects for dates", () => {
    const result = updateBudgetSchema.safeParse({
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      endDate: new Date("2025-02-28T23:59:59.999Z"),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe("2025-02-01T00:00:00.000Z");
      expect(result.data.endDate).toBe("2025-02-28T23:59:59.999Z");
    }
  });

  it("rejects invalid period", () => {
    const result = updateBudgetSchema.safeParse({
      period: "daily",
    });
    expect(result.success).toBe(false);
  });
});

describe("addBudgetItemSchema", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid minimal input", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: validUUID,
      allocatedAmount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with notes", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: validUUID,
      allocatedAmount: 1500,
      notes: "Rent payment",
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero allocated amount", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: validUUID,
      allocatedAmount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative allocated amount", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: validUUID,
      allocatedAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid categoryId", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: "not-a-uuid",
      allocatedAmount: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing allocatedAmount", () => {
    const result = addBudgetItemSchema.safeParse({
      categoryId: validUUID,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBudgetItemSchema", () => {
  it("accepts empty object", () => {
    const result = updateBudgetItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with just allocatedAmount", () => {
    const result = updateBudgetItemSchema.safeParse({
      allocatedAmount: 750,
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with just notes", () => {
    const result = updateBudgetItemSchema.safeParse({
      notes: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts both fields", () => {
    const result = updateBudgetItemSchema.safeParse({
      allocatedAmount: 1200,
      notes: "Monthly utilities",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative allocated amount", () => {
    const result = updateBudgetItemSchema.safeParse({
      allocatedAmount: -50,
    });
    expect(result.success).toBe(false);
  });
});
