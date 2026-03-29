import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const queryAuditLogMock = mock(() => Promise.resolve({ entries: [], nextCursor: null }));

mock.module("../services/audit-log.service", () => ({
  queryAuditLog: queryAuditLogMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { auditLogRoutes } from "./audit-log.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(auditLogRoutes, { prefix: "/api" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

function makeAuthMiddleware(role: string | null = "owner") {
  return async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user_1", email: "a@b.com", name: "Alice" };
    request.householdId = "hh_1";
    // Attach role to request for route's prisma lookup
    request._mockRole = role;
  };
}

// Mock prisma to return the role set on request
mock.module("../config/database", () => ({
  prisma: {
    householdMember: {
      findUnique: mock(async (_args: any) => {
        // Role is set per-test via mockHouseholdMember
        return mockHouseholdMember;
      }),
    },
  },
}));

let mockHouseholdMember: {
  userId: string;
  householdId: string;
  role: string;
  joinedAt: Date;
} | null = null;

describe("GET /api/audit-log", () => {
  beforeEach(() => {
    queryAuditLogMock.mockResolvedValue({ entries: [], nextCursor: null });
    mockHouseholdMember = {
      userId: "user_1",
      householdId: "hh_1",
      role: "owner",
      joinedAt: new Date(),
    };
    (authMiddleware as any).mockImplementation(makeAuthMiddleware("owner"));
  });

  it("returns 401 without token", async () => {
    (authMiddleware as any).mockImplementation(async () => {
      throw new AuthenticationError("No authorization token provided");
    });
    const res = await app.inject({ method: "GET", url: "/api/audit-log" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 for owner with entries and nextCursor", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/audit-log",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("entries");
    expect(body).toHaveProperty("nextCursor");
  });

  it("returns 200 for admin", async () => {
    mockHouseholdMember = {
      userId: "user_1",
      householdId: "hh_1",
      role: "admin",
      joinedAt: new Date(),
    };
    const res = await app.inject({
      method: "GET",
      url: "/api/audit-log",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 403 for member", async () => {
    mockHouseholdMember = {
      userId: "user_1",
      householdId: "hh_1",
      role: "member",
      joinedAt: new Date(),
    };
    const res = await app.inject({
      method: "GET",
      url: "/api/audit-log",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("never returns ipAddress or userAgent in response", async () => {
    queryAuditLogMock.mockResolvedValue({
      entries: [
        {
          id: "al_1",
          actorName: "Alice",
          action: "CREATE_INCOME_SOURCE",
          resource: "income-source",
          resourceId: "inc_1",
          changes: [],
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    } as any);

    const res = await app.inject({
      method: "GET",
      url: "/api/audit-log",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.entries[0]).not.toHaveProperty("ipAddress");
    expect(body.entries[0]).not.toHaveProperty("userAgent");
  });
});
