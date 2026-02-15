import { describe, it, expect } from "bun:test";
import { createLiabilitySchema, updateLiabilitySchema } from "./liability.schemas";

const validLiabilityInput = {
  name: "Test Mortgage",
  type: "mortgage" as const,
  currentBalance: 200000,
  interestRate: 3.5,
  interestType: "fixed" as const,
  openDate: "2020-01-01",
  termEndDate: "2055-01-01",
};

describe("createLiabilitySchema", () => {
  it("accepts valid complete input", () => {
    const result = createLiabilitySchema.safeParse(validLiabilityInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional fields", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      metadata: { lender: "Test Bank" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative currentBalance", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, currentBalance: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects interestRate below 0", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, interestRate: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects interestRate above 100", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, interestRate: 101 });
    expect(result.success).toBe(false);
  });

  it("accepts interestRate of 0", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      interestRate: 0,
    });
    expect(result.success).toBe(true);
  });

  it("validates type enum values", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, type: "invalid_type" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid type values", () => {
    for (const type of ["mortgage", "auto_loan", "student_loan", "credit_card", "personal_loan", "line_of_credit"]) {
      const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, type });
      expect(result.success).toBe(true);
    }
  });

  it("validates interestType enum", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, interestType: "invalid" });
    expect(result.success).toBe(false);
  });

  it("transforms termEndDate string to string", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      termEndDate: "2055-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.termEndDate).toBe("2055-01-01");
    }
  });

  it("transforms openDate Date to ISO string", () => {
    const date = new Date("2055-01-01T00:00:00Z");
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      openDate: date,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.openDate).toBe(date.toISOString());
    }
  });

  it("rejects termEndDate before openDate", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      openDate: "2025-01-01",
      termEndDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateLiabilitySchema", () => {
  it("accepts valid partial input", () => {
    const result = updateLiabilitySchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = updateLiabilitySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    const result = updateLiabilitySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative interestRate when provided", () => {
    const result = updateLiabilitySchema.safeParse({ interestRate: -1 });
    expect(result.success).toBe(false);
  });
});
