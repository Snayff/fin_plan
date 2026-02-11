import { describe, it, expect } from "bun:test";
import { createLiabilitySchema, updateLiabilitySchema, allocatePaymentSchema } from "./liability.schemas";

const validLiabilityInput = {
  name: "Test Mortgage",
  type: "mortgage" as const,
  currentBalance: 200000,
  originalAmount: 250000,
  interestRate: 3.5,
  interestType: "fixed" as const,
  minimumPayment: 898,
  paymentFrequency: "monthly" as const,
};

describe("createLiabilitySchema", () => {
  it("accepts valid complete input", () => {
    const result = createLiabilitySchema.safeParse(validLiabilityInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional fields", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      payoffDate: "2055-01-01",
      accountId: "550e8400-e29b-41d4-a716-446655440000",
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

  it("rejects negative originalAmount", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, originalAmount: -100 });
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
      currentBalance: 0,
      minimumPayment: 0,
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

  it("validates paymentFrequency enum", () => {
    const result = createLiabilitySchema.safeParse({ ...validLiabilityInput, paymentFrequency: "daily" });
    expect(result.success).toBe(false);
  });

  it("transforms payoffDate string to string", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      payoffDate: "2055-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payoffDate).toBe("2055-01-01");
    }
  });

  it("transforms payoffDate Date to ISO string", () => {
    const date = new Date("2055-01-01T00:00:00Z");
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      payoffDate: date,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payoffDate).toBe(date.toISOString());
    }
  });

  it("accepts missing accountId (field omitted)", () => {
    const result = createLiabilitySchema.safeParse(validLiabilityInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBeUndefined();
    }
  });

  it("validates accountId is UUID when provided", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      accountId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("refinement: rejects minimumPayment=0 when balance > 0", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      minimumPayment: 0,
      currentBalance: 10000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pathStr = result.error.issues.map((i) => i.path.join("."));
      expect(pathStr).toContain("minimumPayment");
    }
  });

  it("refinement: allows minimumPayment=0 when balance is 0", () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiabilityInput,
      minimumPayment: 0,
      currentBalance: 0,
    });
    expect(result.success).toBe(true);
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

describe("allocatePaymentSchema", () => {
  const validAllocation = {
    transactionId: "550e8400-e29b-41d4-a716-446655440000",
    liabilityId: "550e8400-e29b-41d4-a716-446655440001",
    principalAmount: 500,
    interestAmount: 100,
  };

  it("accepts valid input", () => {
    const result = allocatePaymentSchema.safeParse(validAllocation);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID transactionId", () => {
    const result = allocatePaymentSchema.safeParse({ ...validAllocation, transactionId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID liabilityId", () => {
    const result = allocatePaymentSchema.safeParse({ ...validAllocation, liabilityId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects negative principalAmount", () => {
    const result = allocatePaymentSchema.safeParse({ ...validAllocation, principalAmount: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative interestAmount", () => {
    const result = allocatePaymentSchema.safeParse({ ...validAllocation, interestAmount: -1 });
    expect(result.success).toBe(false);
  });

  it("refinement: rejects when both amounts are 0", () => {
    const result = allocatePaymentSchema.safeParse({
      ...validAllocation,
      principalAmount: 0,
      interestAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("allows principalAmount=0 when interestAmount > 0", () => {
    const result = allocatePaymentSchema.safeParse({
      ...validAllocation,
      principalAmount: 0,
      interestAmount: 100,
    });
    expect(result.success).toBe(true);
  });
});
