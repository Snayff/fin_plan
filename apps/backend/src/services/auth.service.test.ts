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
  // register() now creates a personal household and updates user.activeHouseholdId
  prismaMock.household.create.mockResolvedValue({
    id: "household-1",
    name: "Test Household",
  } as any);
  prismaMock.user.update.mockResolvedValue(buildUser({ activeHouseholdId: "household-1" } as any));
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
    await expect(authService.register({ ...validInput, email: "" })).rejects.toThrow(
      "Email, password, and name are required"
    );
  });

  it("throws ValidationError for invalid email format", async () => {
    await expect(authService.register({ ...validInput, email: "not-an-email" })).rejects.toThrow(
      "Invalid email format"
    );
  });

  it("throws ValidationError for short password (< 12 chars)", async () => {
    await expect(authService.register({ ...validInput, password: "short" })).rejects.toThrow(
      "Password must be at least 12 characters"
    );
  });

  it("throws ConflictError for duplicate email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    await expect(authService.register(validInput)).rejects.toThrow(
      "Registration could not be completed. Please try again or log in."
    );
  });

  it("sets default preferences", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(buildUser());

    await authService.register(validInput);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferences: expect.objectContaining({
            currency: "GBP",
            theme: "dark",
          }),
        }),
      })
    );
  });

  it("stores session metadata with secure defaults", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(buildUser());

    await authService.register(validInput);

    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rememberMe: false,
          expiresAt: expect.any(Date),
          sessionExpiresAt: expect.any(Date),
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

    const result = await authService.login({
      email: "test@example.com",
      password: "validpassword1",
    });

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBe("mock-refresh-token");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("throws AuthenticationError for unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.login({ email: "unknown@test.com", password: "pass123456789" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws AuthenticationError for wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildUser());
    (verifyPassword as any).mockResolvedValue(false);
    await expect(
      authService.login({ email: "test@test.com", password: "wrongpassword" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws ValidationError for missing fields", async () => {
    await expect(authService.login({ email: "", password: "pass" })).rejects.toThrow(
      "Email and password are required"
    );
  });

  it("stores rememberMe preference and session expiries", async () => {
    const user = buildUser({ email: "test@example.com" });
    prismaMock.user.findUnique.mockResolvedValue(user);
    (verifyPassword as any).mockResolvedValue(true);

    await authService.login({
      email: "test@example.com",
      password: "validpassword1",
      rememberMe: true,
    });

    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rememberMe: true,
          expiresAt: expect.any(Date),
          sessionExpiresAt: expect.any(Date),
        }),
      })
    );
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
    const now = Date.now();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: user.id,
      familyId: "mock-family-id",
      isRevoked: false,
      rememberMe: true,
      expiresAt: new Date(now + 60_000),
      sessionExpiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
    });
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await authService.refreshAccessToken("valid-refresh-token");
    expect(result.accessToken).toBe("mock-access-token");
    expect(result.rememberMe).toBe(true);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.sessionExpiresAt).toBeInstanceOf(Date);
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          familyId: "mock-family-id",
          rememberMe: true,
          sessionExpiresAt: expect.any(Date),
          expiresAt: expect.any(Date),
        }),
      })
    );
  });

  it("throws AuthenticationError for missing refresh token", async () => {
    await expect(authService.refreshAccessToken("")).rejects.toThrow("Refresh token is required");
  });

  it("rejects refresh when absolute session cap is reached", async () => {
    const user = buildUser();
    (verifyRefreshToken as any).mockReturnValue({ userId: user.id });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: user.id,
      familyId: "mock-family-id",
      isRevoked: false,
      rememberMe: true,
      expiresAt: new Date(Date.now() + 60_000),
      sessionExpiresAt: new Date(Date.now() - 1_000),
    });

    await expect(authService.refreshAccessToken("valid-refresh-token")).rejects.toThrow(
      "Session expired - please login again"
    );
  });

  it("caps rotated idle expiry to absolute session expiry", async () => {
    const user = buildUser();
    (verifyRefreshToken as any).mockReturnValue({ userId: user.id });
    const sessionExpiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: user.id,
      familyId: "mock-family-id",
      isRevoked: false,
      rememberMe: true,
      expiresAt: new Date(Date.now() + 60_000),
      sessionExpiresAt,
    });
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await authService.refreshAccessToken("valid-refresh-token");

    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(sessionExpiresAt.getTime());
    expect(result.sessionExpiresAt.getTime()).toBe(sessionExpiresAt.getTime());
  });

  it("revokes the whole family when a revoked token is replayed", async () => {
    (verifyRefreshToken as any).mockReturnValue({ userId: "user-1" });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-old",
      familyId: "fam-1",
      isRevoked: true, // already revoked → replay attack
      rememberMe: false,
      expiresAt: new Date(Date.now() + 60_000),
      sessionExpiresAt: new Date(Date.now() + 60_000),
    } as any);

    await expect(authService.refreshAccessToken("replayed-token")).rejects.toThrow(
      /reuse detected/
    );
    // The entire family must be revoked.
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: "fam-1" }, data: { isRevoked: true } })
    );
  });

  it("rejects an unknown (not stored) refresh token", async () => {
    (verifyRefreshToken as any).mockReturnValue({ userId: "user-1" });
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    // "Invalid refresh token" is an AuthenticationError, re-thrown as-is.
    await expect(authService.refreshAccessToken("ghost-token")).rejects.toThrow(
      /invalid refresh token/i
    );
  });

  it("rejects when the idle expiry has passed", async () => {
    (verifyRefreshToken as any).mockReturnValue({ userId: "user-1" });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      familyId: "fam-1",
      isRevoked: false,
      rememberMe: false,
      expiresAt: new Date(Date.now() - 1000), // idle-expired
      sessionExpiresAt: new Date(Date.now() + 60_000),
    } as any);

    await expect(authService.refreshAccessToken("stale-token")).rejects.toThrow(
      /refresh token expired/i
    );
  });

  it("rejects when the absolute session cap has passed", async () => {
    (verifyRefreshToken as any).mockReturnValue({ userId: "user-1" });
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      familyId: "fam-1",
      isRevoked: false,
      rememberMe: false,
      expiresAt: new Date(Date.now() + 60_000),
      sessionExpiresAt: new Date(Date.now() - 1000), // absolute cap passed
    } as any);

    await expect(authService.refreshAccessToken("capped-token")).rejects.toThrow(
      /session expired/i
    );
  });
});

describe("authService.findUserByEmail", () => {
  it("looks up by lowercased email", async () => {
    const user = buildUser({ email: "person@example.com" });
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await authService.findUserByEmail("Person@Example.COM");

    expect(result).toBe(user as any);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "person@example.com" },
    });
  });

  it("returns null when no user matches", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await authService.findUserByEmail("nobody@example.com")).toBeNull();
  });
});

describe("authService.updateUserName", () => {
  it("updates the name and strips sensitive fields", async () => {
    prismaMock.user.update.mockResolvedValue(
      buildUser({ id: "user-1", name: "New Name", passwordHash: "secret-hash" })
    );

    const result = await authService.updateUserName("user-1", "New Name");

    expect(result.name).toBe("New Name");
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("twoFactorSecret");
    expect(result).not.toHaveProperty("twoFactorEnabled");
  });

  it("throws NotFoundError when the user does not exist (P2025)", async () => {
    const { Prisma } = await import("@prisma/client");
    const err = new Prisma.PrismaClientKnownRequestError("not found", {
      code: "P2025",
      clientVersion: "test",
    });
    prismaMock.user.update.mockRejectedValue(err);

    await expect(authService.updateUserName("ghost", "X")).rejects.toThrow("User not found");
  });

  it("rethrows unexpected errors unchanged", async () => {
    prismaMock.user.update.mockRejectedValue(new Error("db exploded"));
    await expect(authService.updateUserName("user-1", "X")).rejects.toThrow("db exploded");
  });
});

describe("authService.revokeAllUserTokens", () => {
  it("revokes only the user's non-revoked tokens", async () => {
    await authService.revokeAllUserTokens("user-1");
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRevoked: false },
      data: { isRevoked: true },
    });
  });
});

describe("authService.revokeTokenFamily", () => {
  it("revokes a family scoped to the owning user", async () => {
    await authService.revokeTokenFamily("fam-9", "user-1");
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "fam-9", userId: "user-1" },
      data: { isRevoked: true },
    });
  });
});

describe("authService.getUserSessions", () => {
  it("returns one entry per family, keeping the most recent", async () => {
    prismaMock.refreshToken.findMany.mockResolvedValue([
      { id: "t1", familyId: "fam-A", createdAt: new Date(3) },
      { id: "t2", familyId: "fam-A", createdAt: new Date(2) }, // dup family → dropped
      { id: "t3", familyId: "fam-B", createdAt: new Date(1) },
    ] as any);

    const sessions = await authService.getUserSessions("user-1");

    expect(sessions.map((s: { id: string }) => s.id)).toEqual(["t1", "t3"]);
    // Only active, non-expired tokens are queried.
    expect(prismaMock.refreshToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", isRevoked: false }),
      })
    );
  });

  it("returns an empty list when the user has no active sessions", async () => {
    prismaMock.refreshToken.findMany.mockResolvedValue([] as any);
    expect(await authService.getUserSessions("user-1")).toEqual([]);
  });
});

describe("authService.revokeSession", () => {
  it("returns true when a session was revoked", async () => {
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 } as any);
    expect(await authService.revokeSession("fam-1", "user-1")).toBe(true);
  });

  it("returns false when nothing matched (wrong owner or unknown family)", async () => {
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 } as any);
    expect(await authService.revokeSession("fam-x", "user-1")).toBe(false);
  });
});

describe("authService.cleanupExpiredTokens", () => {
  it("deletes idle- or session-expired tokens and returns the count", async () => {
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 7 } as any);

    const count = await authService.cleanupExpiredTokens();

    expect(count).toBe(7);
    const arg = (prismaMock.refreshToken.deleteMany as any).mock.calls[0][0];
    expect(arg.where.OR).toHaveLength(2);
  });
});
