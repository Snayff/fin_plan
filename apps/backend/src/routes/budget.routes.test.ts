import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/budget.service", () => ({
  budgetService: {
    getUserBudgets: mock(() => {}),
    getBudgetWithTracking: mock(() => {}),
    createBudget: mock(() => {}),
    updateBudget: mock(() => {}),
    deleteBudget: mock(() => {}),
    addBudgetItem: mock(() => {}),
    updateBudgetItem: mock(() => {}),
    deleteBudgetItem: mock(() => {}),
    removeCategoryFromBudget: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { budgetService } from "../services/budget.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { budgetRoutes } from "./budget.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(budgetRoutes, { prefix: "/api" });
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
const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const mockBudget = {
  id: "budget-1",
  userId: "user-1",
  name: "Monthly Budget",
  period: "monthly",
  startDate: "2025-01-01T00:00:00.000Z",
  endDate: "2025-01-31T23:59:59.999Z",
  isActive: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

const mockBudgetSummary = {
  ...mockBudget,
  totalAllocated: 2000,
  itemCount: 3,
};

const mockEnhancedBudget = {
  ...mockBudget,
  categoryGroups: [],
  expectedIncome: 5000,
  totalAllocated: 2000,
  totalSpent: 1500,
  totalRemaining: 500,
  unallocated: 3000,
};

const mockBudgetItem = {
  id: "item-1",
  budgetId: "budget-1",
  categoryId: validUUID,
  allocatedAmount: 500,
  carryover: false,
  rolloverAmount: null,
  notes: "Rent",
  category: {
    id: validUUID,
    name: "Housing",
    color: "#FF0000",
    icon: "home",
  },
};

describe("GET /api/budgets", () => {
  it("returns 200 with budgets list", async () => {
    (budgetService.getUserBudgets as any).mockResolvedValue([mockBudgetSummary]);

    const response = await app.inject({
      method: "GET",
      url: "/api/budgets",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().budgets).toHaveLength(1);
    expect(response.json().budgets[0].id).toBe("budget-1");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({ method: "GET", url: "/api/budgets" });
    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/budgets/:id", () => {
  it("returns 200 with budget tracking data", async () => {
    (budgetService.getBudgetWithTracking as any).mockResolvedValue(mockEnhancedBudget);

    const response = await app.inject({
      method: "GET",
      url: "/api/budgets/budget-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const budget = response.json().budget;
    expect(budget.id).toBe("budget-1");
    expect(budget.expectedIncome).toBe(5000);
    expect(budget.totalAllocated).toBe(2000);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({ method: "GET", url: "/api/budgets/budget-1" });
    expect(response.statusCode).toBe(401);
  });
});

describe("POST /api/budgets", () => {
  const validPayload = {
    name: "Monthly Budget",
    period: "monthly",
    startDate: "2025-01-01",
    endDate: "2025-01-31",
  };

  it("returns 201 with valid payload", async () => {
    (budgetService.createBudget as any).mockResolvedValue(mockBudget);

    const response = await app.inject({
      method: "POST",
      url: "/api/budgets",
      headers: authHeaders,
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().budget.name).toBe("Monthly Budget");
    expect(response.json().budget.period).toBe("monthly");
  });

  it("returns 400 for invalid period", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets",
      headers: authHeaders,
      payload: { ...validPayload, period: "weekly" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets",
      headers: authHeaders,
      payload: { period: "monthly", startDate: "2025-01-01", endDate: "2025-01-31" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for missing dates", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets",
      headers: authHeaders,
      payload: { name: "Test", period: "monthly" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets",
      payload: validPayload,
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("PUT /api/budgets/:id", () => {
  it("returns 200 on successful update", async () => {
    (budgetService.updateBudget as any).mockResolvedValue({ ...mockBudget, name: "Updated Budget" });

    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1",
      headers: authHeaders,
      payload: { name: "Updated Budget" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().budget.name).toBe("Updated Budget");
  });

  it("returns 400 for invalid period", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1",
      headers: authHeaders,
      payload: { period: "daily" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1",
      payload: { name: "Test" },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("DELETE /api/budgets/:id", () => {
  it("returns 200 on successful delete", async () => {
    (budgetService.deleteBudget as any).mockResolvedValue({ message: "Budget deleted successfully" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/budgets/budget-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toBe("Budget deleted successfully");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/budgets/budget-1",
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("POST /api/budgets/:id/items", () => {
  const validPayload = {
    categoryId: validUUID,
    allocatedAmount: 500,
    notes: "Rent",
  };

  it("returns 201 with valid payload", async () => {
    (budgetService.addBudgetItem as any).mockResolvedValue(mockBudgetItem);

    const response = await app.inject({
      method: "POST",
      url: "/api/budgets/budget-1/items",
      headers: authHeaders,
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().item.allocatedAmount).toBe(500);
    expect(response.json().item.notes).toBe("Rent");
  });

  it("returns 400 for invalid categoryId", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets/budget-1/items",
      headers: authHeaders,
      payload: { ...validPayload, categoryId: "not-a-uuid" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for negative allocatedAmount", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets/budget-1/items",
      headers: authHeaders,
      payload: { ...validPayload, allocatedAmount: -100 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/budgets/budget-1/items",
      payload: validPayload,
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("PUT /api/budgets/:budgetId/items/:itemId", () => {
  it("returns 200 on successful update", async () => {
    (budgetService.updateBudgetItem as any).mockResolvedValue({
      ...mockBudgetItem,
      allocatedAmount: 750,
    });

    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1/items/item-1",
      headers: authHeaders,
      payload: { allocatedAmount: 750 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().item.allocatedAmount).toBe(750);
  });

  it("returns 400 for negative allocatedAmount", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1/items/item-1",
      headers: authHeaders,
      payload: { allocatedAmount: -50 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/budgets/budget-1/items/item-1",
      payload: { allocatedAmount: 100 },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("DELETE /api/budgets/:budgetId/items/:itemId", () => {
  it("returns 200 on successful delete", async () => {
    (budgetService.deleteBudgetItem as any).mockResolvedValue({
      message: "Budget item deleted successfully",
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/budgets/budget-1/items/item-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toBe("Budget item deleted successfully");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/budgets/budget-1/items/item-1",
    });
    expect(response.statusCode).toBe(401);
  });
});

describe("DELETE /api/budgets/:id/categories/:categoryId", () => {
  it("returns 200 on successful category removal", async () => {
    (budgetService.removeCategoryFromBudget as any).mockResolvedValue({
      message: "Removed 2 item(s) from budget",
    });

    const response = await app.inject({
      method: "DELETE",
      url: `/api/budgets/budget-1/categories/${validUUID}`,
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("Removed");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/budgets/budget-1/categories/${validUUID}`,
    });
    expect(response.statusCode).toBe(401);
  });
});
