import { describe, it, expect } from "bun:test";
import { createAccountSchema, updateAccountSchema } from "../assets.schemas.js";

describe("createAccountSchema — monthlyContributionLimit", () => {
  it("accepts a non-negative number", () => {
    const r = createAccountSchema.safeParse({
      name: "Marcus",
      type: "Savings",
      monthlyContributionLimit: 200,
    });
    expect(r.success).toBe(true);
  });
  it("accepts null (clears the limit)", () => {
    const r = createAccountSchema.safeParse({
      name: "Marcus",
      type: "Savings",
      monthlyContributionLimit: null,
    });
    expect(r.success).toBe(true);
  });
  it("rejects negative numbers", () => {
    const r = createAccountSchema.safeParse({
      name: "Marcus",
      type: "Savings",
      monthlyContributionLimit: -5,
    });
    expect(r.success).toBe(false);
  });
});

describe("updateAccountSchema — monthlyContributionLimit", () => {
  it("accepts setting and clearing the limit", () => {
    expect(updateAccountSchema.safeParse({ monthlyContributionLimit: 300 }).success).toBe(true);
    expect(updateAccountSchema.safeParse({ monthlyContributionLimit: null }).success).toBe(true);
  });
});
