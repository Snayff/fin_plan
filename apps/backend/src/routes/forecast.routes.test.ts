import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const forecastServiceMock = {
  getProjections: mock(() =>
    Promise.resolve({
      netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
      surplus: [{ year: 2026, cumulative: 0 }],
      savings: [{ year: 2026, balance: 0 }],
      stocksAndShares: [{ year: 2026, balance: 0 }],
      retirement: [],
      monthlyContributionsByScope: {
        netWorth: 0,
        retirement: 0,
        savings: 0,
        stocksAndShares: 0,
      },
    })
  ),
};

mock.module("../services/forecast.service", () => ({
  forecastService: forecastServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

mock.module("../config/database", () => ({
  prisma: {},
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { forecastRoutes } from "./forecast.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(forecastRoutes, { prefix: "/api/forecast" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  forecastServiceMock.getProjections.mockReset();
  forecastServiceMock.getProjections.mockResolvedValue({
    netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
    surplus: [{ year: 2026, cumulative: 0 }],
    savings: [{ year: 2026, balance: 0 }],
    stocksAndShares: [{ year: 2026, balance: 0 }],
    retirement: [],
    monthlyContributionsByScope: {
      netWorth: 0,
      retirement: 0,
      savings: 0,
      stocksAndShares: 0,
    },
  } as any);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/forecast", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/forecast?horizonYears=10" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with projection data for valid horizonYears", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=10",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("netWorth");
    expect(res.json()).toHaveProperty("surplus");
    expect(res.json()).toHaveProperty("retirement");
  });

  it("calls forecastService with the correct horizonYears", async () => {
    await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=20",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(forecastServiceMock.getProjections).toHaveBeenCalledWith("hh-1", 20);
  });

  it("returns 400 for invalid horizonYears", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=7",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when horizonYears is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(400);
  });
});
