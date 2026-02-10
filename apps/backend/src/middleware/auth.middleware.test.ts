import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/jwt", () => ({
  verifyAccessToken: vi.fn(),
}));

import { authMiddleware } from "./auth.middleware";
import { verifyAccessToken } from "../utils/jwt";
import { AuthenticationError } from "../utils/errors";

beforeEach(() => {
  vi.clearAllMocks();
});

function buildMockRequest(authHeader?: string) {
  return {
    headers: {
      authorization: authHeader,
    },
  } as any;
}

const mockReply = {} as any;

describe("authMiddleware", () => {
  it("attaches user to request for valid token", async () => {
    const payload = { userId: "user-1", email: "test@test.com" };
    (verifyAccessToken as any).mockReturnValue(payload);

    const request = buildMockRequest("Bearer valid-token");
    await authMiddleware(request, mockReply);

    expect(request.user).toEqual(payload);
  });

  it("throws AuthenticationError when no authorization header", async () => {
    const request = buildMockRequest(undefined);
    await expect(authMiddleware(request, mockReply)).rejects.toThrow(AuthenticationError);
  });

  it("throws AuthenticationError for invalid format (no Bearer prefix)", async () => {
    const request = buildMockRequest("Basic some-token");
    await expect(authMiddleware(request, mockReply)).rejects.toThrow("Invalid authorization format");
  });

  it("throws AuthenticationError for missing token after Bearer", async () => {
    const request = buildMockRequest("Bearer ");
    await expect(authMiddleware(request, mockReply)).rejects.toThrow(AuthenticationError);
  });

  it("throws AuthenticationError for expired token", async () => {
    (verifyAccessToken as any).mockImplementation(() => {
      throw new Error("Token expired");
    });

    const request = buildMockRequest("Bearer expired-token");
    await expect(authMiddleware(request, mockReply)).rejects.toThrow("Invalid or expired token");
  });

  it("throws AuthenticationError for invalid token", async () => {
    (verifyAccessToken as any).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const request = buildMockRequest("Bearer invalid-token");
    await expect(authMiddleware(request, mockReply)).rejects.toThrow("Invalid or expired token");
  });
});
