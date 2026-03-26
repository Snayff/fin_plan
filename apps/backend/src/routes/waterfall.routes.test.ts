import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const waterfallServiceMock = {
  getWaterfallSummary: mock(() =>
    Promise.resolve({
      income: { total: 0, byType: [], monthly: [], annual: [], oneOff: [] },
      committed: { monthlyTotal: 0, monthlyAvg12: 0, bills: [], yearlyBills: [] },
      discretionary: { total: 0, categories: [], savings: { total: 0, allocations: [] } },
      surplus: { amount: 0, percentOfIncome: 0 },
    })
  ),
  getCashflow: mock(() => Promise.resolve([])),
  listIncome: mock(() => Promise.resolve([])),
  listEndedIncome: mock(() => Promise.resolve([])),
  createIncome: mock(() => Promise.resolve(null)),
  updateIncome: mock(() => Promise.resolve(null)),
  deleteIncome: mock(() => Promise.resolve()),
  endIncome: mock(() => Promise.resolve(null)),
  reactivateIncome: mock(() => Promise.resolve(null)),
  confirmIncome: mock(() => Promise.resolve(null)),
  listCommitted: mock(() => Promise.resolve([])),
  createCommitted: mock(() => Promise.resolve(null)),
  updateCommitted: mock(() => Promise.resolve(null)),
  deleteCommitted: mock(() => Promise.resolve()),
  confirmCommitted: mock(() => Promise.resolve(null)),
  listYearly: mock(() => Promise.resolve([])),
  createYearly: mock(() => Promise.resolve(null)),
  updateYearly: mock(() => Promise.resolve(null)),
  deleteYearly: mock(() => Promise.resolve()),
  confirmYearly: mock(() => Promise.resolve(null)),
  listDiscretionary: mock(() => Promise.resolve([])),
  createDiscretionary: mock(() => Promise.resolve(null)),
  updateDiscretionary: mock(() => Promise.resolve(null)),
  deleteDiscretionary: mock(() => Promise.resolve()),
  confirmDiscretionary: mock(() => Promise.resolve(null)),
  listSavings: mock(() => Promise.resolve([])),
  createSavings: mock(() => Promise.resolve(null)),
  updateSavings: mock(() => Promise.resolve(null)),
  deleteSavings: mock(() => Promise.resolve()),
  confirmSavings: mock(() => Promise.resolve(null)),
  getHistory: mock(() => Promise.resolve([])),
  confirmBatch: mock(() => Promise.resolve()),
  deleteAll: mock(() => Promise.resolve()),
};

const snapshotServiceMock = {
  ensureJan1Snapshot: mock(() => Promise.resolve()),
};

mock.module("../services/waterfall.service", () => ({
  waterfallService: waterfallServiceMock,
}));

mock.module("../services/snapshot.service", () => ({
  snapshotService: snapshotServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { waterfallRoutes } from "./waterfall.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(waterfallRoutes, { prefix: "/api/waterfall" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const mockSummary = {
  income: { total: 5000, byType: [], monthly: [], annual: [], oneOff: [] },
  committed: { monthlyTotal: 1000, monthlyAvg12: 100, bills: [], yearlyBills: [] },
  discretionary: { total: 500, categories: [], savings: { total: 0, allocations: [] } },
  surplus: { amount: 3400, percentOfIncome: 68 },
};

const mockIncomeSource = {
  id: "inc-1",
  householdId: "hh-1",
  name: "Salary",
  amount: 5000,
  frequency: "monthly",
  incomeType: "salary",
  expectedMonth: null,
  ownerId: null,
  sortOrder: 0,
  endedAt: null,
  lastReviewedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCommittedBill = {
  id: "bill-1",
  householdId: "hh-1",
  name: "Rent",
  amount: 1000,
  ownerId: null,
  sortOrder: 0,
  lastReviewedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockYearlyBill = {
  id: "ybill-1",
  householdId: "hh-1",
  name: "Car Insurance",
  amount: 600,
  dueMonth: 3,
  sortOrder: 0,
  lastReviewedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDiscretionaryCategory = {
  id: "disc-1",
  householdId: "hh-1",
  name: "Groceries",
  monthlyBudget: 400,
  sortOrder: 0,
  lastReviewedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSavingsAllocation = {
  id: "sav-1",
  householdId: "hh-1",
  name: "Emergency Fund",
  monthlyAmount: 200,
  sortOrder: 0,
  wealthAccountId: null,
  lastReviewedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  for (const method of Object.values(waterfallServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }
  for (const method of Object.values(snapshotServiceMock)) {
    if (typeof method?.mockReset === "function") method.mockReset();
  }

  waterfallServiceMock.getWaterfallSummary.mockResolvedValue(mockSummary as any);
  waterfallServiceMock.getCashflow.mockResolvedValue([] as any);
  waterfallServiceMock.listIncome.mockResolvedValue([mockIncomeSource] as any);
  waterfallServiceMock.listEndedIncome.mockResolvedValue([] as any);
  waterfallServiceMock.createIncome.mockResolvedValue(mockIncomeSource as any);
  waterfallServiceMock.updateIncome.mockResolvedValue(mockIncomeSource as any);
  waterfallServiceMock.deleteIncome.mockResolvedValue(undefined);
  waterfallServiceMock.endIncome.mockResolvedValue(mockIncomeSource as any);
  waterfallServiceMock.reactivateIncome.mockResolvedValue(mockIncomeSource as any);
  waterfallServiceMock.confirmIncome.mockResolvedValue(mockIncomeSource as any);
  waterfallServiceMock.listCommitted.mockResolvedValue([mockCommittedBill] as any);
  waterfallServiceMock.createCommitted.mockResolvedValue(mockCommittedBill as any);
  waterfallServiceMock.updateCommitted.mockResolvedValue(mockCommittedBill as any);
  waterfallServiceMock.deleteCommitted.mockResolvedValue(undefined);
  waterfallServiceMock.confirmCommitted.mockResolvedValue(mockCommittedBill as any);
  waterfallServiceMock.listYearly.mockResolvedValue([mockYearlyBill] as any);
  waterfallServiceMock.createYearly.mockResolvedValue(mockYearlyBill as any);
  waterfallServiceMock.updateYearly.mockResolvedValue(mockYearlyBill as any);
  waterfallServiceMock.deleteYearly.mockResolvedValue(undefined);
  waterfallServiceMock.confirmYearly.mockResolvedValue(mockYearlyBill as any);
  waterfallServiceMock.listDiscretionary.mockResolvedValue([mockDiscretionaryCategory] as any);
  waterfallServiceMock.createDiscretionary.mockResolvedValue(mockDiscretionaryCategory as any);
  waterfallServiceMock.updateDiscretionary.mockResolvedValue(mockDiscretionaryCategory as any);
  waterfallServiceMock.deleteDiscretionary.mockResolvedValue(undefined);
  waterfallServiceMock.confirmDiscretionary.mockResolvedValue(mockDiscretionaryCategory as any);
  waterfallServiceMock.listSavings.mockResolvedValue([mockSavingsAllocation] as any);
  waterfallServiceMock.createSavings.mockResolvedValue(mockSavingsAllocation as any);
  waterfallServiceMock.updateSavings.mockResolvedValue(mockSavingsAllocation as any);
  waterfallServiceMock.deleteSavings.mockResolvedValue(undefined);
  waterfallServiceMock.confirmSavings.mockResolvedValue(mockSavingsAllocation as any);
  waterfallServiceMock.getHistory.mockResolvedValue([] as any);
  waterfallServiceMock.confirmBatch.mockResolvedValue(undefined);
  waterfallServiceMock.deleteAll.mockResolvedValue(undefined);

  snapshotServiceMock.ensureJan1Snapshot.mockResolvedValue(undefined as any);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

// ─── Summary ──────────────────────────────────────────────────────────────────

describe("GET /api/waterfall", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/waterfall" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with waterfall summary", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.surplus).toBeDefined();
    expect(body.income).toBeDefined();
  });
});

// ─── Cashflow ─────────────────────────────────────────────────────────────────

describe("GET /api/waterfall/cashflow", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/waterfall/cashflow" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with cashflow data", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall/cashflow",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("passes year query param to service", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall/cashflow?year=2025",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(waterfallServiceMock.getCashflow).toHaveBeenCalledWith("hh-1", 2025);
  });
});

// ─── Income ───────────────────────────────────────────────────────────────────

describe("GET /api/waterfall/income", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/waterfall/income" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with income list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall/income",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });
});

describe("POST /api/waterfall/income", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/income",
      payload: { name: "Salary", amount: 5000, frequency: "monthly" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created income source", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/income",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Salary", amount: 5000, frequency: "monthly" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Salary");
  });

  it("returns 400 for invalid frequency", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/income",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Salary", amount: 5000, frequency: "weekly" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/income",
      headers: { authorization: "Bearer valid-token" },
      payload: { amount: 5000, frequency: "monthly" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Committed Bills ──────────────────────────────────────────────────────────

describe("POST /api/waterfall/committed", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/committed",
      payload: { name: "Rent", amount: 1000 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created committed bill", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/committed",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Rent", amount: 1000 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Rent");
  });

  it("returns 400 for missing amount", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/committed",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Rent" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Yearly Bills ─────────────────────────────────────────────────────────────

describe("POST /api/waterfall/yearly", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/yearly",
      payload: { name: "Car Insurance", amount: 600, dueMonth: 3 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created yearly bill", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/yearly",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Car Insurance", amount: 600, dueMonth: 3 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().dueMonth).toBe(3);
  });

  it("returns 400 for missing dueMonth", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/yearly",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Car Insurance", amount: 600 },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Discretionary ────────────────────────────────────────────────────────────

describe("POST /api/waterfall/discretionary", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/discretionary",
      payload: { name: "Groceries", monthlyBudget: 400 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created discretionary category", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/discretionary",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Groceries", monthlyBudget: 400 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().monthlyBudget).toBe(400);
  });

  it("returns 400 for missing monthlyBudget", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/discretionary",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Groceries" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Savings Allocations ──────────────────────────────────────────────────────

describe("POST /api/waterfall/savings", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/savings",
      payload: { name: "Emergency Fund", monthlyAmount: 200 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 201 with created savings allocation", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/savings",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Emergency Fund", monthlyAmount: 200 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().monthlyAmount).toBe(200);
  });

  it("returns 400 for missing monthlyAmount", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/savings",
      headers: { authorization: "Bearer valid-token" },
      payload: { name: "Emergency Fund" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Confirm Batch ────────────────────────────────────────────────────────────

describe("POST /api/waterfall/confirm-batch", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/confirm-batch",
      payload: { items: [{ type: "income_source", id: "inc-1" }] },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 204 with valid batch", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/confirm-batch",
      headers: { authorization: "Bearer valid-token" },
      payload: {
        items: [
          { type: "income_source", id: "inc-1" },
          { type: "committed_bill", id: "bill-1" },
          { type: "yearly_bill", id: "ybill-1" },
          { type: "discretionary_category", id: "disc-1" },
          { type: "savings_allocation", id: "sav-1" },
        ],
      },
    });
    expect(res.statusCode).toBe(204);
  });

  it("returns 400 for invalid item type", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/confirm-batch",
      headers: { authorization: "Bearer valid-token" },
      payload: {
        items: [{ type: "unknown_type", id: "inc-1" }],
      },
    });
    expect(res.statusCode).toBe(400);
  });
});
