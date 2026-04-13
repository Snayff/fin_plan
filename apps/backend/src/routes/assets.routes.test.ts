import { describe, it, expect, beforeEach, mock } from "bun:test";
import Fastify from "fastify";
import { buildTestApp } from "../test/helpers/fastify.js";

const mockAssetsService = {
  getSummary: mock(() => Promise.resolve({ assetTotals: {}, accountTotals: {}, grandTotal: 0 })),
  listAssetsByType: mock(() => Promise.resolve([])),
  createAsset: mock(() => Promise.resolve({ id: "a-1", name: "Test", type: "Property" })),
  updateAsset: mock(() => Promise.resolve({ id: "a-1", name: "Updated" })),
  deleteAsset: mock(() => Promise.resolve({ id: "a-1" })),
  recordAssetBalance: mock(() => Promise.resolve({ id: "b-1", value: 100 })),
  confirmAsset: mock(() => Promise.resolve({ id: "a-1" })),
  listAccountsByType: mock(() => Promise.resolve([])),
  createAccount: mock(() => Promise.resolve({ id: "ac-1", name: "SIPP", type: "Pension" })),
  updateAccount: mock(() => Promise.resolve({ id: "ac-1", name: "Updated" })),
  deleteAccount: mock(() => Promise.resolve({ id: "ac-1" })),
  recordAccountBalance: mock(() => Promise.resolve({ id: "b-1", value: 500 })),
  confirmAccount: mock(() => Promise.resolve({ id: "ac-1" })),
};

mock.module("../services/assets.service.js", () => ({ assetsService: mockAssetsService }));
mock.module("../middleware/auth.middleware.js", () => ({
  authMiddleware: mock(async (req: any) => {
    req.user = { userId: "user-1", email: "test@test.com", name: "Test User" };
    req.householdId = "hh-1";
  }),
}));
mock.module("../lib/actor-ctx.js", () => ({
  actorCtx: mock(() => ({
    householdId: "hh-1",
    actorId: "user-1",
    actorName: "Test",
    ipAddress: "127.0.0.1",
    userAgent: "test",
  })),
}));

const { assetsRoutes } = await import("./assets.routes.js");

beforeEach(() => {
  Object.values(mockAssetsService).forEach((m) => (m as ReturnType<typeof mock>).mockClear());
});

describe("GET /api/assets/summary", () => {
  it("returns 200 with summary", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/api/assets/summary" });
    expect(res.statusCode).toBe(200);
    expect(mockAssetsService.getSummary).toHaveBeenCalledWith("hh-1");
  });
});

describe("GET /api/assets/assets/:type", () => {
  it("returns 200 with items for type", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/api/assets/assets/Property" });
    expect(res.statusCode).toBe(200);
    expect(mockAssetsService.listAssetsByType).toHaveBeenCalledWith("hh-1", "Property");
  });
});

describe("POST /api/assets/assets", () => {
  it("creates asset and returns 201", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/assets/assets",
      payload: { name: "Test", type: "Property" },
    });
    expect(res.statusCode).toBe(201);
    expect(mockAssetsService.createAsset).toHaveBeenCalled();
  });
});

describe("POST /api/assets/assets/:assetId/balance", () => {
  it("records balance and returns 201", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/assets/assets/a-1/balance",
      payload: { value: 190000, date: "2026-03-30" },
    });
    expect(res.statusCode).toBe(201);
    expect(mockAssetsService.recordAssetBalance).toHaveBeenCalledWith(
      "hh-1",
      "a-1",
      expect.objectContaining({ value: 190000 }),
      expect.any(Object)
    );
  });
});

describe("POST /api/assets/accounts", () => {
  it("creates account with initialValue and forwards to service", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/assets/accounts",
      payload: { name: "HSBC Current", type: "Current", initialValue: 1500 },
    });
    expect(res.statusCode).toBe(201);
    expect(mockAssetsService.createAccount).toHaveBeenCalledWith(
      "hh-1",
      expect.objectContaining({ name: "HSBC Current", type: "Current", initialValue: 1500 }),
      expect.any(Object)
    );
  });
});

describe("GET /api/assets/accounts/:type", () => {
  it("returns 200 with accounts for type", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/api/assets/accounts/Pension" });
    expect(res.statusCode).toBe(200);
    expect(mockAssetsService.listAccountsByType).toHaveBeenCalledWith("hh-1", "Pension");
  });
});

describe("DELETE /api/assets/assets/:assetId", () => {
  it("deletes asset and returns 200", async () => {
    const app = await buildTestApp();
    app.register(assetsRoutes, { prefix: "/api/assets" });
    await app.ready();

    const res = await app.inject({ method: "DELETE", url: "/api/assets/assets/a-1" });
    expect(res.statusCode).toBe(200);
    expect(mockAssetsService.deleteAsset).toHaveBeenCalledWith("hh-1", "a-1", expect.any(Object));
  });
});
