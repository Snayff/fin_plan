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
    request.householdId = "household-1";
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
    expect(liabilityService.getUserLiabilitiesWithForecast).toHaveBeenCalledWith("household-1");
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

  it("POST /api/liabilities accepts linkedAssetId", async () => {
    (liabilityService.createLiability as any).mockResolvedValue({
      id: "liab-1",
      linkedAsset: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Main Residence",
        type: "housing",
        currentValue: 300000,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities",
      headers: authHeaders,
      payload: {
        name: "Test Mortgage",
        type: "mortgage",
        currentBalance: 200000,
        interestRate: 3.5,
        interestType: "fixed",
        openDate: "2020-01-01",
        termEndDate: "2055-01-01",
        linkedAssetId: "00000000-0000-0000-0000-000000000001",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().liability.linkedAsset.id).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("PUT /api/liabilities accepts linkedAssetId null to unlink", async () => {
    (liabilityService.updateLiability as any).mockResolvedValue({
      id: "liab-1",
      linkedAsset: null,
    });

    const response = await app.inject({
      method: "PUT",
      url: "/api/liabilities/liab-1",
      headers: authHeaders,
      payload: { linkedAssetId: null },
    });

    expect(response.statusCode).toBe(200);
    expect(liabilityService.updateLiability).toHaveBeenCalledWith(
      "liab-1",
      "household-1",
      { linkedAssetId: null }
    );
  });
});
