import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/liability.service", () => ({
  liabilityService: {
    getUserLiabilities: mock(() => {}),
    getUserLiabilitiesWithForecast: mock(() => {}),
    getLiabilityById: mock(() => {}),
    createLiability: mock(() => {}),
    updateLiability: mock(() => {}),
    deleteLiability: mock(() => {}),
    calculateLiabilityProjection: mock(() => {}),
    getLiabilitySummary: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { liabilityService } from "../services/liability.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { liabilityRoutes } from "./liability.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(liabilityRoutes, { prefix: "/api" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
  });
});

const authHeaders = { authorization: "Bearer valid-token" };

describe("liability routes", () => {
  it("GET /api/liabilities returns list", async () => {
    (liabilityService.getUserLiabilities as any).mockResolvedValue([]);

    const response = await app.inject({ method: "GET", url: "/api/liabilities", headers: authHeaders });
    expect(response.statusCode).toBe(200);
  });

  it("GET /api/liabilities?enhanced=true returns forecasted list", async () => {
    (liabilityService.getUserLiabilitiesWithForecast as any).mockResolvedValue([]);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities?enhanced=true",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(liabilityService.getUserLiabilitiesWithForecast).toHaveBeenCalledWith("user-1");
  });

  it("GET /api/liabilities/:id/projection returns projection", async () => {
    (liabilityService.calculateLiabilityProjection as any).mockResolvedValue({
      projectedBalanceAtTermEnd: 100,
      schedule: [],
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities/liab-1/projection",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
  });
});
