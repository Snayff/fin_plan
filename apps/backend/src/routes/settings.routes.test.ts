import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const settingsServiceMock = {
  getSettings: mock(() => Promise.resolve(null)),
  updateSettings: mock(() => Promise.resolve(null)),
};

mock.module("../services/settings.service", () => ({
  settingsService: settingsServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { settingsRoutes } from "./settings.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(settingsRoutes, { prefix: "/api/settings" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const mockSettings = {
  id: "s-1",
  householdId: "hh-1",
  surplusBenchmarkPct: 10,
  isaAnnualLimit: 20000,
  isaYearStartMonth: 4,
  isaYearStartDay: 6,
  stalenessThresholds: {},
};

beforeEach(() => {
  for (const method of Object.values(settingsServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }
  settingsServiceMock.getSettings.mockResolvedValue(mockSettings as any);
  settingsServiceMock.updateSettings.mockResolvedValue(mockSettings as any);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/settings", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/settings" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with settings when authenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/settings",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().surplusBenchmarkPct).toBe(10);
  });
});

describe("PATCH /api/settings", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/settings",
      payload: { surplusBenchmarkPct: 15 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with updated settings", async () => {
    const updated = { ...mockSettings, surplusBenchmarkPct: 15 };
    settingsServiceMock.updateSettings.mockResolvedValue(updated as any);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/settings",
      headers: { authorization: "Bearer valid-token" },
      payload: { surplusBenchmarkPct: 15 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().surplusBenchmarkPct).toBe(15);
  });

  it("returns 400 for invalid surplusBenchmarkPct", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/settings",
      headers: { authorization: "Bearer valid-token" },
      payload: { surplusBenchmarkPct: 200 },
    });
    expect(res.statusCode).toBe(400);
  });
});
