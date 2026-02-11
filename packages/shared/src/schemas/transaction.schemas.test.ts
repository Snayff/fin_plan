import { describe, it, expect } from "bun:test";
import { createTransactionSchema, updateTransactionSchema } from "./transaction.schemas";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const validTransactionInput = {
  accountId: validUUID,
  date: "2025-01-15",
  amount: 100.5,
  type: "expense" as const,
  name: "Grocery Shopping",
};

describe("createTransactionSchema", () => {
  it("accepts valid input with required fields", () => {
    const result = createTransactionSchema.safeParse(validTransactionInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all optional fields", () => {
    const result = createTransactionSchema.safeParse({
      ...validTransactionInput,
      categoryId: validUUID,
      subcategoryId: validUUID,
      description: "Weekly groceries",
      memo: "Paid with debit",
      tags: ["food", "weekly"],
      isRecurring: true,
      recurrence: "weekly",
      recurrence_end_date: "2025-12-31",
      metadata: { store: "Tesco" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing accountId", () => {
    const { accountId, ...rest } = validTransactionInput;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID accountId", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, accountId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, amount: -50 });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("validates type enum (income, expense, transfer)", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid type values", () => {
    for (const type of ["income", "expense", "transfer"]) {
      const result = createTransactionSchema.safeParse({ ...validTransactionInput, type });
      expect(result.success).toBe(true);
    }
  });

  it("validates recurrence enum", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, recurrence: "daily" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid recurrence values", () => {
    for (const recurrence of ["none", "weekly", "monthly", "yearly"]) {
      const result = createTransactionSchema.safeParse({ ...validTransactionInput, recurrence });
      expect(result.success).toBe(true);
    }
  });

  it("transforms empty categoryId to undefined", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, categoryId: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBeUndefined();
    }
  });

  it("rejects non-UUID categoryId when provided", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, categoryId: "bad-id" });
    expect(result.success).toBe(false);
  });

  it("transforms empty description to undefined", () => {
    const result = createTransactionSchema.safeParse({ ...validTransactionInput, description: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("accepts Date object for date field", () => {
    const result = createTransactionSchema.safeParse({
      ...validTransactionInput,
      date: new Date("2025-01-15"),
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTransactionSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateTransactionSchema.safeParse({ name: "Updated", amount: 200 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = updateTransactionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount when provided", () => {
    const result = updateTransactionSchema.safeParse({ amount: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount when provided", () => {
    const result = updateTransactionSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});
