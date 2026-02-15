import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildUser } from "../test/fixtures";

// Mock modules BEFORE imports
mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

mock.module("../utils/password", () => ({
  hashPassword: mock(() => Promise.resolve("$2b$10$mockedHashValue")),
  verifyPassword: mock(() => {}),
}));

mock.module("../utils/jwt", () => ({
  generateAccessToken: mock(() => "mock-access-token"),
  generateRefreshToken: mock(() => "mock-refresh-token"),
  hashToken: mock(() => "mock-refresh-token-hash"),
  generateTokenFamily: mock(() => "mock-family-id"),
  verifyRefreshToken: mock(() => {}),
}));

import { authService } from "./auth.service";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";

beforeEach(() => {
  resetPrismaMocks();
  (hashPassword as any).mockClear();
  (verifyPassword as any).mockClear();
  (generateAccessToken as any).mockClear();
  (generateRefreshToken as any).mockClear();
  (verifyRefreshToken as any).mockClear();
  (hashPassword as any).mockResolvedValue("$2b$10$mockedHashValue");
  (generateAccessToken as any).mockReturnValue("mock-access-token");
  (generateRefreshToken as any).mockReturnValue("mock-refresh-token");
  prismaMock.refreshToken.create.mockResolvedValue({ id: "rt-1" } as any);
  prismaMock.refreshToken.update.mockResolvedValue({ id: "rt-1", isRevoked: true } as any);
  prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);
});

describe("authService.register", () => {
  const validInput = { email: "test@example.com", password: "validpassword1", name: "Test User" };

  it("creates user with hashed password and returns tokens", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const createdUser = buildUser({ email: "test@example.com", name: "Test User" });
    prismaMock.user.create.mockResolvedValue(createdUser);

    const result = await authService.register(validInput);

    expect(hashPassword).toHaveBeenCalledWith("validpassword1");
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
          passwordHash: "$2b$10$mockedHashValue",
        }),
      })
    );
    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBe("mock-refresh-token");
  });

  it("returns user without passwordHash", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(buildUser());

    const result = await authService.register(validInput);
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("lowercases email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(buildUser());

    await authService.register({ ...validInput, email: "TEST@EXAMPLE.COM" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "test@example.com" } })
    );
  });

  it("throws ValidationError for missing email", async () => {
    await expect(authService.register({ ...validInput, email: "" })).rejects.toThrow("Email, password, and name are required");
  });

  it("throws ValidationError for invalid email format", async () => {
    await expect(authService.register({ ...validInput, email: "not-an-email" })).rejects.toThrow("Invalid email format");
  });

  it("throws ValidationError for short password (< 12 chars)", async () => {
    await expect(authService.register({ ...validInput, password: "short" })).rejects.toThrow(
      "Password must be at least 12 characters"
    );
  });

  it("throws ConflictError for duplicate email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    await expect(authService.register(validInput)).rejects.toThrow("User with this email already exists");
  });

  it("sets default preferences", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(buildUser());

    await authService.register(validInput);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferences: expect.objectContaining({
            currency: "USD",
            theme: "light",
          }),
        }),
      })
    );
  });
});

describe("authService.login", () => {
  it("returns tokens for valid credentials", async () => {
    const user = buildUser({ email: "test@example.com" });
    prismaMock.user.findUnique.mockResolvedValue(user);
    (verifyPassword as any).mockResolvedValue(true);

    const result = await authService.login({ email: "test@example.com", password: "validpassword1" });

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBe("mock-refresh-token");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("throws AuthenticationError for unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: "unknown@test.com", password: "pass123456789" })).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("throws AuthenticationError for wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    (verifyPassword as any).mockResolvedValue(false);
    await expect(authService.login({ email: "test@test.com", password: "wrongpassword" })).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("throws ValidationError for missing fields", async () => {
    await expect(authService.login({ email: "", password: "pass" })).rejects.toThrow("Email and password are required");
  });
});

describe("authService.findUserById", () => {
  it("returns user without passwordHash", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    const result = await authService.findUserById("user-1");
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null for non-existent user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await authService.findUserById("non-existent");
    expect(result).toBeNull();
  });
});

describe("authService.refreshAccessToken", () => {
  it("returns new access token for valid refresh token", async () => {
    const user = buildUser();
    (verifyRefreshToken as any).mockReturnValue({ userId: user.id });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: user.id,
      familyId: "mock-family-id",
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await authService.refreshAccessToken("valid-refresh-token");
    expect(result.accessToken).toBe("mock-access-token");
  });

  it("throws AuthenticationError for missing refresh token", async () => {
    await expect(authService.refreshAccessToken("")).rejects.toThrow("Refresh token is required");
  });
});
