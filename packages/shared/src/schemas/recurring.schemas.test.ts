import { describe, it, expect } from "bun:test";
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
  previewOccurrencesSchema,
  templateTransactionSchema,
} from "./recurring.schemas";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const validTemplateTransaction = {
  accountId: validUUID,
  type: "expense" as const,
  amount: 100,
  name: "Monthly Subscription",
};

const validCreateInput = {
  frequency: "monthly" as const,
  interval: 1,
  startDate: "2025-01-01",
  templateTransaction: validTemplateTransaction,
};

// ---------------------------------------------------------------------------
// templateTransactionSchema
// ---------------------------------------------------------------------------

describe("templateTransactionSchema", () => {
  it("accepts valid input with required fields", () => {
    const result = templateTransactionSchema.safeParse(validTemplateTransaction);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all optional fields", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      categoryId: validUUID,
      subcategoryId: validUUID,
      description: "Recurring Netflix charge",
      memo: "Auto-pay",
      tags: ["subscription", "entertainment"],
      liabilityId: validUUID,
      metadata: { service: "Netflix" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount of zero", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Amount must be greater than 0");
    }
  });

  it("rejects negative amount", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      amount: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Transaction name is required");
    }
  });

  it("rejects non-UUID accountId", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      accountId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid account ID");
    }
  });

  it("rejects non-UUID categoryId when provided", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      categoryId: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid transaction types", () => {
    for (const type of ["income", "expense", "transfer"]) {
      const result = templateTransactionSchema.safeParse({
        ...validTemplateTransaction,
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid transaction type", () => {
    const result = templateTransactionSchema.safeParse({
      ...validTemplateTransaction,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createRecurringRuleSchema
// ---------------------------------------------------------------------------

describe("createRecurringRuleSchema", () => {
  it("accepts valid input with required fields only", () => {
    const result = createRecurringRuleSchema.safeParse(validCreateInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with endDate (no occurrences)", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      endDate: "2025-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with occurrences (no endDate)", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      occurrences: 12,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid frequency values", () => {
    for (const frequency of ["daily", "weekly", "biweekly", "monthly", "quarterly", "annually", "custom"]) {
      const result = createRecurringRuleSchema.safeParse({ ...validCreateInput, frequency });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid frequency value", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      frequency: "hourly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects interval of zero", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      interval: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Interval must be a positive integer");
    }
  });

  it("rejects negative interval", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      interval: -1,
    });
    expect(result.success).toBe(false);
  });

  it("defaults interval to 1 when not provided", () => {
    const { interval, ...rest } = validCreateInput;
    const result = createRecurringRuleSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(1);
    }
  });

  it("defaults isActive to true when not provided", () => {
    const result = createRecurringRuleSchema.safeParse(validCreateInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("refine: rejects when both endDate and occurrences are set", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      endDate: "2025-12-31",
      occurrences: 12,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const endDateIssue = result.error.issues.find(
        (issue) => issue.path.includes("endDate")
      );
      expect(endDateIssue?.message).toBe("Cannot specify both endDate and occurrences");
    }
  });

  it("refine: rejects endDate that is not after startDate (same day)", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      startDate: "2025-06-01",
      endDate: "2025-06-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const endDateIssue = result.error.issues.find(
        (issue) => issue.path.includes("endDate")
      );
      expect(endDateIssue?.message).toBe("End date must be after start date");
    }
  });

  it("refine: rejects endDate that is before startDate", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      startDate: "2025-06-01",
      endDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const endDateIssue = result.error.issues.find(
        (issue) => issue.path.includes("endDate")
      );
      expect(endDateIssue?.message).toBe("End date must be after start date");
    }
  });

  it("accepts Date objects for startDate and endDate", () => {
    const result = createRecurringRuleSchema.safeParse({
      ...validCreateInput,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    });
    expect(result.success).toBe(true);
  });

  it("transforms startDate string into Date object", () => {
    const result = createRecurringRuleSchema.safeParse(validCreateInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });
});

// ---------------------------------------------------------------------------
// updateRecurringRuleSchema
// ---------------------------------------------------------------------------

describe("updateRecurringRuleSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateRecurringRuleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update with frequency only", () => {
    const result = updateRecurringRuleSchema.safeParse({ frequency: "weekly" });
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update with isActive only", () => {
    const result = updateRecurringRuleSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("rejects when both endDate and occurrences are set", () => {
    const result = updateRecurringRuleSchema.safeParse({
      endDate: "2025-12-31",
      occurrences: 6,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const endDateIssue = result.error.issues.find(
        (issue) => issue.path.includes("endDate")
      );
      expect(endDateIssue?.message).toBe("Cannot specify both endDate and occurrences");
    }
  });

  it("rejects invalid interval when provided", () => {
    const result = updateRecurringRuleSchema.safeParse({ interval: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts valid templateTransaction when provided", () => {
    const result = updateRecurringRuleSchema.safeParse({
      templateTransaction: validTemplateTransaction,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// previewOccurrencesSchema
// ---------------------------------------------------------------------------

describe("previewOccurrencesSchema", () => {
  const validPreviewInput = {
    frequency: "monthly" as const,
    startDate: "2025-01-01",
  };

  it("accepts valid input with required fields only", () => {
    const result = previewOccurrencesSchema.safeParse(validPreviewInput);
    expect(result.success).toBe(true);
  });

  it("defaults limit to 10 when not provided", () => {
    const result = previewOccurrencesSchema.safeParse(validPreviewInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("defaults interval to 1 when not provided", () => {
    const result = previewOccurrencesSchema.safeParse(validPreviewInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(1);
    }
  });

  it("accepts limit of 50 (boundary maximum)", () => {
    const result = previewOccurrencesSchema.safeParse({ ...validPreviewInput, limit: 50 });
    expect(result.success).toBe(true);
  });

  it("rejects limit of 51 (exceeds maximum)", () => {
    const result = previewOccurrencesSchema.safeParse({ ...validPreviewInput, limit: 51 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Limit cannot exceed 50");
    }
  });

  it("rejects limit of 0", () => {
    const result = previewOccurrencesSchema.safeParse({ ...validPreviewInput, limit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts optional endDate and occurrences", () => {
    const result = previewOccurrencesSchema.safeParse({
      ...validPreviewInput,
      endDate: "2025-12-31",
    });
    expect(result.success).toBe(true);
  });
});
