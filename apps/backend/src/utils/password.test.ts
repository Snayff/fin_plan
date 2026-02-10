import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("returns a different string than the input", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash).not.toBe("mypassword123");
  });

  it("produces a bcrypt-format hash", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash).toMatch(/^\$2[aby]?\$\d+\$/);
  });

  it("different calls produce different hashes (unique salts)", async () => {
    const hash1 = await hashPassword("samepassword12");
    const hash2 = await hashPassword("samepassword12");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("correctpassword", hash);
    expect(result).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("wrongpassword!!", hash);
    expect(result).toBe(false);
  });
});
