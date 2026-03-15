import { describe, it, expect } from "bun:test";
import {
  createHouseholdSchema,
  renameHouseholdSchema,
  createHouseholdInviteSchema,
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

describe("createHouseholdInviteSchema", () => {
  it("accepts empty payload", () => {
    const result = createHouseholdInviteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a valid email", () => {
    const result = createHouseholdInviteSchema.safeParse({ email: "alice@example.com" });
    expect(result.success).toBe(true);
  });

  it("trims email values", () => {
    const result = createHouseholdInviteSchema.safeParse({ email: "  alice@example.com  " });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("alice@example.com");
  });

  it("treats blank email as undefined", () => {
    const result = createHouseholdInviteSchema.safeParse({ email: "   " });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBeUndefined();
  });

  it("rejects invalid email", () => {
    const result = createHouseholdInviteSchema.safeParse({ email: "bad-email" });
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
