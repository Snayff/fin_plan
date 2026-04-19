import { describe, it, expect, mock, beforeAll, afterAll, beforeEach } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const mockQuerySecurityActivity = mock(() => {});
const mockAuthMiddleware = mock(() => {});

mock.module("../services/security-activity.service", () => ({
  querySecurityActivity: mockQuerySecurityActivity,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mockAuthMiddleware,
}));

mock.module("../config/database", () => ({
  prisma: {},
}));

import { securityActivityRoutes } from "./security-activity.routes";
import { authMiddleware } from "../middleware/auth.middleware";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(securityActivityRoutes, { prefix: "/api" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  mockQuerySecurityActivity.mockReset();
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
  });
});

const makeEntry = (
  overrides: Partial<{
    id: string;
    action: string;
    createdAt: string;
    metadata: unknown;
  }> = {}
) => ({
  id: "log-1",
  action: "LOGIN_SUCCESS",
  createdAt: "2024-01-15T10:00:00.000Z",
  metadata: null,
  ...overrides,
});

describe("GET /api/security-activity", () => {
  it("returns 401 without auth token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/security-activity",
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 200 with entries array when authenticated", async () => {
    const entries = [makeEntry(), makeEntry({ id: "log-2", action: "LOGOUT" })];
    mockQuerySecurityActivity.mockResolvedValue({ entries, nextCursor: null });

    const response = await app.inject({
      method: "GET",
      url: "/api/security-activity",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries).toHaveLength(2);
    expect(body.nextCursor).toBeNull();
  });

  it("entries do not include other users' events — service is called with requesting user's id only", async () => {
    mockQuerySecurityActivity.mockResolvedValue({ entries: [], nextCursor: null });

    await app.inject({
      method: "GET",
      url: "/api/security-activity",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(mockQuerySecurityActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "user-1" })
    );
  });

  it("returns 200 with nextCursor when more pages exist", async () => {
    const entries = [makeEntry()];
    mockQuerySecurityActivity.mockResolvedValue({ entries, nextCursor: "some-cursor" });

    const response = await app.inject({
      method: "GET",
      url: "/api/security-activity",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().nextCursor).toBe("some-cursor");
  });

  it("passes limit query param to service", async () => {
    mockQuerySecurityActivity.mockResolvedValue({ entries: [], nextCursor: null });

    await app.inject({
      method: "GET",
      url: "/api/security-activity?limit=10",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(mockQuerySecurityActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 10 })
    );
  });

  it("passes cursor query param to service", async () => {
    mockQuerySecurityActivity.mockResolvedValue({ entries: [], nextCursor: null });

    await app.inject({
      method: "GET",
      url: "/api/security-activity?cursor=abc123",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(mockQuerySecurityActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cursor: "abc123" })
    );
  });
});
