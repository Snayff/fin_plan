import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/goal.service", () => ({
  goalService: {
    getUserGoalsWithProgress: mock(() => {}),
    getGoalById: mock(() => {}),
    getGoalContributions: mock(() => {}),
    createGoal: mock(() => {}),
    updateGoal: mock(() => {}),
    addContribution: mock(() => {}),
    linkTransactionToGoal: mock(() => {}),
    deleteGoal: mock(() => {}),
    getGoalSummary: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { goalService } from "../services/goal.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { goalRoutes } from "./goal.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(goalRoutes, { prefix: "/api" });
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

const mockGoal = {
  id: "goal-1",
  userId: "user-1",
  name: "Emergency Fund",
  type: "savings",
  targetAmount: 5000,
  currentAmount: 1000,
  status: "active",
};

describe("GET /api/goals", () => {
  it("returns 200 with goals list", async () => {
    (goalService.getUserGoalsWithProgress as any).mockResolvedValue([mockGoal]);

    const response = await app.inject({
      method: "GET",
      url: "/api/goals",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().goals).toHaveLength(1);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({ method: "GET", url: "/api/goals" });
    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/goals/:id", () => {
  it("returns 200 with single goal", async () => {
    (goalService.getGoalById as any).mockResolvedValue(mockGoal);

    const response = await app.inject({
      method: "GET",
      url: "/api/goals/goal-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().goal.id).toBe("goal-1");
  });
});

describe("GET /api/goals/:id/contributions", () => {
  it("returns 200 with contributions", async () => {
    (goalService.getGoalContributions as any).mockResolvedValue([{ id: "contrib-1", amount: 100 }]);

    const response = await app.inject({
      method: "GET",
      url: "/api/goals/goal-1/contributions",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().contributions).toHaveLength(1);
  });
});

describe("POST /api/goals", () => {
  const validPayload = {
    name: "Emergency Fund",
    type: "savings",
    targetAmount: 5000,
  };

  it("returns 201 with valid payload", async () => {
    (goalService.createGoal as any).mockResolvedValue(mockGoal);

    const response = await app.inject({
      method: "POST",
      url: "/api/goals",
      headers: authHeaders,
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().goal.name).toBe("Emergency Fund");
  });

  it("returns 400 for invalid goal type", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/goals",
      headers: authHeaders,
      payload: { ...validPayload, type: "invalid" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/goals/:id", () => {
  it("returns 200 on successful update", async () => {
    (goalService.updateGoal as any).mockResolvedValue({ ...mockGoal, name: "Updated Goal" });

    const response = await app.inject({
      method: "PUT",
      url: "/api/goals/goal-1",
      headers: authHeaders,
      payload: { name: "Updated Goal" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().goal.name).toBe("Updated Goal");
  });
});

describe("POST /api/goals/:id/contributions", () => {
  it("returns 201 for valid contribution", async () => {
    (goalService.addContribution as any).mockResolvedValue({
      contribution: { id: "contrib-1", amount: 100 },
      goal: mockGoal,
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/goals/goal-1/contributions",
      headers: authHeaders,
      payload: { amount: 100 },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().goal.id).toBe("goal-1");
  });

  it("returns 400 for invalid amount", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/goals/goal-1/contributions",
      headers: authHeaders,
      payload: { amount: 0 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /api/goals/:id/link-transaction", () => {
  it("returns 200 for valid payload", async () => {
    (goalService.linkTransactionToGoal as any).mockResolvedValue({
      contribution: { id: "contrib-1", amount: 50 },
      goal: mockGoal,
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/goals/goal-1/link-transaction",
      headers: authHeaders,
      payload: { transactionId: validUUID, amount: 50 },
    });

    expect(response.statusCode).toBe(200);
  });

  it("returns 400 for invalid transaction id", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/goals/goal-1/link-transaction",
      headers: authHeaders,
      payload: { transactionId: "bad-id", amount: 50 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /api/goals/:id", () => {
  it("returns 200 on successful delete", async () => {
    (goalService.deleteGoal as any).mockResolvedValue({ message: "Goal deleted successfully" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/goals/goal-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("deleted");
  });
});

describe("GET /api/goals/summary", () => {
  it("returns 200 with summary", async () => {
    (goalService.getGoalSummary as any).mockResolvedValue({
      totalSaved: 1000,
      totalTarget: 5000,
      activeGoals: 1,
      completedGoals: 0,
      byType: [],
      byPriority: [],
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/goals/summary",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().totalSaved).toBe(1000);
  });
});
