import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const wealthServiceMock = {
  getWealthSummary: mock(() =>
    Promise.resolve({
      netWorth: 0,
      ytdChange: 0,
      byLiquidity: { cashAndSavings: 0, investmentsAndPensions: 0, propertyAndVehicles: 0 },
      byClass: {},
      trust: { total: 0, beneficiaries: [] },
    })
  ),
  getIsaAllowance: mock(() =>
    Promise.resolve({ taxYearStart: "", taxYearEnd: "", annualLimit: 20000, byPerson: [] })
  ),
  listAccounts: mock(() => Promise.resolve([])),
  getAccount: mock(() => Promise.resolve(null)),
  createAccount: mock(() => Promise.resolve(null)),
  updateAccount: mock(() => Promise.resolve(null)),
  deleteAccount: mock(() => Promise.resolve()),
  updateValuation: mock(() => Promise.resolve(null)),
  confirmAccount: mock(() => Promise.resolve(null)),
  confirmBatch: mock(() => Promise.resolve()),
  getHistory: mock(() => Promise.resolve([])),
};

mock.module("../services/wealth.service", () => ({
  wealthService: wealthServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { wealthRoutes } from "./wealth.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(wealthRoutes, { prefix: "/api/wealth" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const mockAccount = {
  id: "wa-1",
  householdId: "hh-1",
  assetClass: "savings",
  name: "Test ISA",
  balance: 10000,
};

beforeEach(() => {
  for (const method of Object.values(wealthServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }
  wealthServiceMock.getWealthSummary.mockResolvedValue({
    netWorth: 0,
    ytdChange: 0,
    byLiquidity: { cashAndSavings: 0, investmentsAndPensions: 0, propertyAndVehicles: 0 },
    byClass: {},
    trust: { total: 0, beneficiaries: [] },
  } as any);
  wealthServiceMock.getIsaAllowance.mockResolvedValue({
    taxYearStart: "",
    taxYearEnd: "",
    annualLimit: 20000,
    byPerson: [],
  } as any);
  wealthServiceMock.listAccounts.mockResolvedValue([mockAccount] as any);
  wealthServiceMock.getAccount.mockResolvedValue(mockAccount as any);
  wealthServiceMock.createAccount.mockResolvedValue(mockAccount as any);
  wealthServiceMock.updateAccount.mockResolvedValue(mockAccount as any);
  wealthServiceMock.updateValuation.mockResolvedValue(mockAccount as any);
  wealthServiceMock.confirmAccount.mockResolvedValue(mockAccount as any);
  wealthServiceMock.confirmBatch.mockResolvedValue(undefined);
  wealthServiceMock.getHistory.mockResolvedValue([] as any);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/wealth", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wealth" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with wealth summary", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/wealth",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /api/wealth/isa-allowance", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wealth/isa-allowance" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with ISA allowance", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/wealth/isa-allowance",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().annualLimit).toBe(20000);
  });
});

describe("GET /api/wealth/accounts", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/wealth/accounts" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with account list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/wealth/accounts",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });
});

describe("POST /api/wealth/accounts", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts",
      payload: { name: "Test", assetClass: "savings", balance: 0 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created account", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "New Account", assetClass: "savings", balance: 5000 },
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts",
      headers: { authorization: "Bearer valid-token" },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /api/wealth/accounts/:id", () => {
  it("returns 200 with updated account", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/wealth/accounts/wa-1",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Renamed" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("DELETE /api/wealth/accounts/:id", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/wealth/accounts/wa-1" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 204 when deleting", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/wealth/accounts/wa-1",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(204);
  });
});

describe("POST /api/wealth/accounts/:id/valuation", () => {
  it("returns 200 with updated valuation", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts/wa-1/valuation",
      headers: { authorization: "Bearer valid-token" },
      payload: { balance: 12000 },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /api/wealth/accounts/:id/confirm", () => {
  it("returns 200 confirming account", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts/wa-1/confirm",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /api/wealth/accounts/confirm-batch", () => {
  it("returns 204 when batch confirming", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/wealth/accounts/confirm-batch",
      headers: { authorization: "Bearer valid-token" },
      payload: { ids: ["wa-1"] },
    });
    expect(res.statusCode).toBe(204);
  });
});
