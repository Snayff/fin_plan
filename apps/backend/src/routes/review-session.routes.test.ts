import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const reviewSessionServiceMock = {
  getSession: mock(() => Promise.resolve(null)),
  createOrResetSession: mock(() => Promise.resolve(null)),
  updateSession: mock(() => Promise.resolve(null)),
  deleteSession: mock(() => Promise.resolve()),
};

mock.module("../services/review-session.service", () => ({
  reviewSessionService: reviewSessionServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { reviewRoutes } from "./review-session.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(reviewRoutes, { prefix: "/api/review" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const mockSession = {
  id: "rs-1",
  householdId: "hh-1",
  currentStep: 0,
  confirmedItems: {},
  updatedItems: {},
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  for (const method of Object.values(reviewSessionServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }
  reviewSessionServiceMock.getSession.mockResolvedValue(mockSession as any);
  reviewSessionServiceMock.createOrResetSession.mockResolvedValue(mockSession as any);
  reviewSessionServiceMock.updateSession.mockResolvedValue(mockSession as any);
  reviewSessionServiceMock.deleteSession.mockResolvedValue(undefined);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/review", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/review" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with session data", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 with null when no session exists", async () => {
    reviewSessionServiceMock.getSession.mockResolvedValue(null);
    const res = await app.inject({
      method: "GET",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toBeNull();
  });
});

describe("POST /api/review", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/api/review" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 when creating session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(201);
  });
});

describe("PATCH /api/review", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/review",
      payload: { currentStep: 1 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with updated session", async () => {
    const updated = { ...mockSession, currentStep: 2 };
    reviewSessionServiceMock.updateSession.mockResolvedValue(updated as any);
    const res = await app.inject({
      method: "PATCH",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
      payload: { currentStep: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().currentStep).toBe(2);
  });

  it("returns 400 for invalid currentStep", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
      payload: { currentStep: -1 },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/review", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/review" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 204 when deleting", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/review",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(204);
  });
});
