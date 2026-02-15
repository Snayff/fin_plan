import { describe, it, expect } from "bun:test";
import {
  createGoalSchema,
  updateGoalSchema,
  createGoalContributionSchema,
  linkTransactionToGoalSchema,
} from "./goal.schemas";

describe("createGoalSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createGoalSchema.safeParse({
      name: "Emergency Fund",
      type: "savings",
      targetAmount: 5000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("accepts valid input with optional fields", () => {
    const result = createGoalSchema.safeParse({
      name: "Deposit",
      description: "House deposit goal",
      type: "purchase",
      targetAmount: 25000,
      targetDate: "2027-01-01",
      priority: "high",
      icon: "house",
      metadata: {
        notes: "Save aggressively",
        milestones: [{ percentage: 50, label: "Halfway", reached: false }],
      },
    });

    expect(result.success).toBe(true);
  });

  it("transforms Date targetDate to ISO string", () => {
    const result = createGoalSchema.safeParse({
      name: "Date transform goal",
      type: "investment",
      targetAmount: 1000,
      targetDate: new Date("2027-02-15T00:00:00.000Z"),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetDate).toBe("2027-02-15T00:00:00.000Z");
    }
  });

  it("rejects empty name", () => {
    const result = createGoalSchema.safeParse({
      name: "",
      type: "savings",
      targetAmount: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative targetAmount", () => {
    const result = createGoalSchema.safeParse({
      name: "Invalid",
      type: "savings",
      targetAmount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid goal type", () => {
    const result = createGoalSchema.safeParse({
      name: "Invalid",
      type: "bad_type",
      targetAmount: 100,
    });
    expect(result.success).toBe(false);
  });

});

describe("updateGoalSchema", () => {
  it("accepts empty object", () => {
    const result = updateGoalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateGoalSchema.safeParse({
      name: "Updated name",
      status: "completed",
      targetAmount: 1200,
    });
    expect(result.success).toBe(true);
  });
});

describe("createGoalContributionSchema", () => {
  it("accepts valid contribution", () => {
    const result = createGoalContributionSchema.safeParse({ amount: 25.5, notes: "Weekly save" });
    expect(result.success).toBe(true);
  });

  it("rejects zero or negative amounts", () => {
    expect(createGoalContributionSchema.safeParse({ amount: 0 }).success).toBe(false);
    expect(createGoalContributionSchema.safeParse({ amount: -10 }).success).toBe(false);
  });
});

describe("linkTransactionToGoalSchema", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid payload", () => {
    const result = linkTransactionToGoalSchema.safeParse({
      transactionId: validUUID,
      amount: 50,
      notes: "From salary",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid transactionId", () => {
    const result = linkTransactionToGoalSchema.safeParse({ transactionId: "bad", amount: 50 });
    expect(result.success).toBe(false);
  });
});
