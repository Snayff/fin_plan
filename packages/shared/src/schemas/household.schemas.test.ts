import { describe, it, expect } from "bun:test";
import {
  createHouseholdSchema,
  renameHouseholdSchema,
  inviteMemberSchema,
  acceptInviteSchema,
} from "./household.schemas";

describe("createHouseholdSchema", () => {
  it("accepts valid name", () => {
    const result = createHouseholdSchema.safeParse({ name: "Smith Family" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createHouseholdSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createHouseholdSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("renameHouseholdSchema", () => {
  it("accepts valid name", () => {
    const result = renameHouseholdSchema.safeParse({ name: "Jones Family" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = renameHouseholdSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = renameHouseholdSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("accepts valid email", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = inviteMemberSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = inviteMemberSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = inviteMemberSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("acceptInviteSchema", () => {
  const validInput = {
    name: "Alice",
    email: "alice@example.com",
    password: "supersecret123",
  };

  it("accepts valid input", () => {
    const result = acceptInviteSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts password of exactly 12 characters", () => {
    const result = acceptInviteSchema.safeParse({ ...validInput, password: "a".repeat(12) });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 12 characters", () => {
    const result = acceptInviteSchema.safeParse({ ...validInput, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects password of exactly 11 characters", () => {
    const result = acceptInviteSchema.safeParse({ ...validInput, password: "a".repeat(11) });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = acceptInviteSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validInput;
    const result = acceptInviteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = acceptInviteSchema.safeParse({ ...validInput, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email, ...rest } = validInput;
    const result = acceptInviteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const { password, ...rest } = validInput;
    const result = acceptInviteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
