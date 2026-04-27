import { describe, it, expect } from "bun:test";
import { createAccountSchema, updateAccountSchema } from "../assets.schemas.js";

describe("Account ISA validation", () => {
  it("accepts isISA=true with Savings type and memberId", () => {
    const r = createAccountSchema.safeParse({
      name: "Cash ISA",
      type: "Savings",
      memberId: "m1",
      isISA: true,
      isaYearContribution: 5000,
    });
    expect(r.success).toBe(true);
  });

  it("rejects isISA=true without memberId", () => {
    const r = createAccountSchema.safeParse({
      name: "Cash ISA",
      type: "Savings",
      memberId: null,
      isISA: true,
    });
    expect(r.success).toBe(false);
  });

  it("rejects isISA=true with non-Savings type", () => {
    const r = createAccountSchema.safeParse({
      name: "Cash ISA",
      type: "Current",
      memberId: "m1",
      isISA: true,
    });
    expect(r.success).toBe(false);
  });

  it("accepts isISA=false on any type", () => {
    const r = createAccountSchema.safeParse({
      name: "Current",
      type: "Current",
      isISA: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects negative isaYearContribution", () => {
    const r = createAccountSchema.safeParse({
      name: "Cash ISA",
      type: "Savings",
      memberId: "m1",
      isISA: true,
      isaYearContribution: -1,
    });
    expect(r.success).toBe(false);
  });

  it("update schema enforces same isa-requires-member rule", () => {
    const r = updateAccountSchema.safeParse({ isISA: true, memberId: null });
    expect(r.success).toBe(false);
  });
});

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
