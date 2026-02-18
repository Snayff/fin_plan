import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/asset.service", () => ({
  assetService: {
    getUserAssetsWithHistory: mock(() => {}),
    getAssetById: mock(() => {}),
    getAssetValueHistory: mock(() => {}),
    createAsset: mock(() => {}),
    updateAsset: mock(() => {}),
    updateAssetValue: mock(() => {}),
    deleteAsset: mock(() => {}),
    getAssetSummary: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { assetService } from "../services/asset.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { assetRoutes } from "./asset.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(assetRoutes, { prefix: "/api" });
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
const mockAsset = {
  id: "asset-1",
  name: "Investment Property",
  type: "housing",
  currentValue: 250000,
  purchaseValue: 200000,
  liquidityType: "illiquid",
  userId: "user-1",
};

describe("GET /api/assets", () => {
  it("returns 200 with assets list", async () => {
    (assetService.getUserAssetsWithHistory as any).mockResolvedValue([mockAsset]);

    const response = await app.inject({
      method: "GET",
      url: "/api/assets",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().assets).toHaveLength(1);
    expect(response.json().assets[0].name).toBe("Investment Property");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/assets",
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/assets/:id", () => {
  it("returns 200 with single asset", async () => {
    (assetService.getAssetById as any).mockResolvedValue(mockAsset);

    const response = await app.inject({
      method: "GET",
      url: "/api/assets/asset-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().asset.id).toBe("asset-1");
  });
});

describe("GET /api/assets/:id/history", () => {
  it("returns 200 with value history", async () => {
    const history = [
      { id: "h-1", value: 250000, date: "2025-01-15", source: "manual" },
    ];
    (assetService.getAssetValueHistory as any).mockResolvedValue(history);

    const response = await app.inject({
      method: "GET",
      url: "/api/assets/asset-1/history",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().history).toHaveLength(1);
  });

  it("passes daysBack query parameter", async () => {
    (assetService.getAssetValueHistory as any).mockResolvedValue([]);

    await app.inject({
      method: "GET",
      url: "/api/assets/asset-1/history?daysBack=30",
      headers: authHeaders,
    });

    expect(assetService.getAssetValueHistory).toHaveBeenCalledWith("asset-1", "user-1", 30);
  });

  it("defaults to 90 days when no daysBack provided", async () => {
    (assetService.getAssetValueHistory as any).mockResolvedValue([]);

    await app.inject({
      method: "GET",
      url: "/api/assets/asset-1/history",
      headers: authHeaders,
    });

    expect(assetService.getAssetValueHistory).toHaveBeenCalledWith("asset-1", "user-1", 90);
  });
});

describe("POST /api/assets", () => {
  const validPayload = {
    name: "Investment Property",
    type: "housing",
    currentValue: 250000,
  };

  it("returns 201 with valid input", async () => {
    (assetService.createAsset as any).mockResolvedValue(mockAsset);

    const response = await app.inject({
      method: "POST",
      url: "/api/assets",
      headers: authHeaders,
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().asset.name).toBe("Investment Property");
  });

  it("returns 400 for missing required fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/assets",
      headers: authHeaders,
      payload: { name: "Test" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for negative currentValue", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/assets",
      headers: authHeaders,
      payload: { ...validPayload, currentValue: -1 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid asset type", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/assets",
      headers: authHeaders,
      payload: { ...validPayload, type: "invalid_type" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/assets/:id", () => {
  it("returns 200 with updated asset", async () => {
    const updated = { ...mockAsset, name: "Updated Property" };
    (assetService.updateAsset as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: "PUT",
      url: "/api/assets/asset-1",
      headers: authHeaders,
      payload: { name: "Updated Property" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().asset.name).toBe("Updated Property");
  });
});

describe("PUT /api/assets/:id/value", () => {
  it("returns 200 with updated value", async () => {
    const updated = { ...mockAsset, currentValue: 300000 };
    (assetService.updateAssetValue as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: "PUT",
      url: "/api/assets/asset-1/value",
      headers: authHeaders,
      payload: { newValue: 300000 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().asset.currentValue).toBe(300000);
  });

  it("passes source and date to service", async () => {
    (assetService.updateAssetValue as any).mockResolvedValue(mockAsset);

    await app.inject({
      method: "PUT",
      url: "/api/assets/asset-1/value",
      headers: authHeaders,
      payload: { newValue: 300000, source: "automatic", date: "2025-06-15" },
    });

    expect(assetService.updateAssetValue).toHaveBeenCalledWith(
      "asset-1",
      "user-1",
      300000,
      "automatic",
      expect.any(Date)
    );
  });

  it("returns 400 for missing newValue", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/assets/asset-1/value",
      headers: authHeaders,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /api/assets/:id", () => {
  it("returns 200 on successful delete", async () => {
    (assetService.deleteAsset as any).mockResolvedValue({ message: "Asset deleted" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/assets/asset-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("deleted");
  });
});

describe("GET /api/assets/summary", () => {
  it("returns 200 with asset summary", async () => {
    const summary = { totalValue: 350000, totalGain: 110000, byType: [] };
    (assetService.getAssetSummary as any).mockResolvedValue(summary);

    const response = await app.inject({
      method: "GET",
      url: "/api/assets/summary",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().totalValue).toBe(350000);
  });
});
