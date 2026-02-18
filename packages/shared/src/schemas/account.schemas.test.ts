import { describe, it, expect } from "bun:test";
import { createAccountSchema, updateAccountSchema } from "./account.schemas";

describe("createAccountSchema", () => {
  it("accepts valid input with required fields", () => {
    const result = createAccountSchema.safeParse({ name: "Current Account", type: "current" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all fields", () => {
    const result = createAccountSchema.safeParse({
      name: "Savings Account",
      type: "savings",
      subtype: "high-interest",
      openingBalance: 1000,
      currency: "USD",
      description: "Main savings",
      metadata: { institution: "HSBC", interestRate: 4.5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createAccountSchema.safeParse({ name: "", type: "current" });
    expect(result.success).toBe(false);
  });

  it("validates type enum", () => {
    const result = createAccountSchema.safeParse({ name: "Test", type: "invalid_type" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid account types", () => {
    const types = ["current", "savings", "isa", "stocks_and_shares_isa", "credit", "investment", "loan", "asset", "liability"];
    for (const type of types) {
      const result = createAccountSchema.safeParse({ name: "Test", type });
      expect(result.success).toBe(true);
    }
  });

  it("defaults openingBalance to 0", () => {
    const result = createAccountSchema.safeParse({ name: "Test", type: "current" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.openingBalance).toBe(0);
    }
  });

  it("defaults currency to GBP", () => {
    const result = createAccountSchema.safeParse({ name: "Test", type: "current" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("GBP");
    }
  });

  it("accepts negative openingBalance", () => {
    const result = createAccountSchema.safeParse({ name: "Credit Card", type: "credit", openingBalance: -500 });
    expect(result.success).toBe(true);
  });

  it("accepts metadata with institution and rates", () => {
    const result = createAccountSchema.safeParse({
      name: "Test",
      type: "credit",
      metadata: { institution: "Barclays", creditLimit: 5000 },
    });
    expect(result.success).toBe(true);
  });
});

describe("updateAccountSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateAccountSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateAccountSchema.safeParse({ name: "Updated Name", isActive: false });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = updateAccountSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty currency when provided", () => {
    const result = updateAccountSchema.safeParse({ currency: "" });
    expect(result.success).toBe(false);
  });

  it("accepts isActive boolean", () => {
    const result = updateAccountSchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });
});
