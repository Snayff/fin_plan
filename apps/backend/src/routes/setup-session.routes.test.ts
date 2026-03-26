import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const setupSessionServiceMock = {
  getSession: mock(() => Promise.resolve(null)),
  createOrResetSession: mock(() => Promise.resolve(null)),
  updateSession: mock(() => Promise.resolve(null)),
  deleteSession: mock(() => Promise.resolve()),
};

mock.module("../services/setup-session.service", () => ({
  setupSessionService: setupSessionServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { setupRoutes } from "./setup-session.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(setupRoutes, { prefix: "/api/setup" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const mockSession = {
  id: "ss-1",
  householdId: "hh-1",
  currentStep: 0,
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  for (const method of Object.values(setupSessionServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }
  setupSessionServiceMock.getSession.mockResolvedValue(mockSession as any);
  setupSessionServiceMock.createOrResetSession.mockResolvedValue(mockSession as any);
  setupSessionServiceMock.updateSession.mockResolvedValue(mockSession as any);
  setupSessionServiceMock.deleteSession.mockResolvedValue(undefined);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/setup", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/setup" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with session data", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/setup",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /api/setup", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/api/setup" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 when creating session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/setup",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(201);
  });
});

describe("PATCH /api/setup", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/setup",
      payload: { currentStep: 1 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with updated session", async () => {
    const updated = { ...mockSession, currentStep: 2 };
    setupSessionServiceMock.updateSession.mockResolvedValue(updated as any);
    const res = await app.inject({
      method: "PATCH",
      url: "/api/setup",
      headers: { authorization: "Bearer valid-token" },
      payload: { currentStep: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().currentStep).toBe(2);
  });

  it("returns 400 for negative currentStep", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/setup",
      headers: { authorization: "Bearer valid-token" },
      payload: { currentStep: -1 },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/setup", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/setup" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 204 when deleting", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/setup",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(204);
  });
});
