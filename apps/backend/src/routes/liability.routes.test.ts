import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

vi.mock("../services/liability.service", () => ({
  liabilityService: {
    getUserLiabilities: vi.fn(),
    getUserLiabilitiesWithPayments: vi.fn(),
    getLiabilityById: vi.fn(),
    createLiability: vi.fn(),
    updateLiability: vi.fn(),
    deleteLiability: vi.fn(),
    allocateTransactionToLiability: vi.fn(),
    removePaymentAllocation: vi.fn(),
    calculatePayoffProjection: vi.fn(),
    getUnallocatedPayments: vi.fn(),
    getLiabilitySummary: vi.fn(),
  },
}));

vi.mock("../middleware/auth.middleware", () => ({
  authMiddleware: vi.fn(),
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
  vi.clearAllMocks();
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
  });
});

const authHeaders = { authorization: "Bearer valid-token" };
const mockLiability = {
  id: "liab-1",
  name: "Mortgage",
  type: "mortgage",
  currentBalance: 200000,
  originalAmount: 250000,
  interestRate: 3.5,
  interestType: "fixed",
  minimumPayment: 898,
  paymentFrequency: "monthly",
  userId: "user-1",
};

describe("GET /api/liabilities", () => {
  it("returns 200 with basic liabilities list", async () => {
    (liabilityService.getUserLiabilities as any).mockResolvedValue([mockLiability]);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().liabilities).toHaveLength(1);
  });

  it("returns enhanced data when enhanced=true", async () => {
    const enhanced = { ...mockLiability, payments: [] };
    (liabilityService.getUserLiabilitiesWithPayments as any).mockResolvedValue([enhanced]);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities?enhanced=true",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(liabilityService.getUserLiabilitiesWithPayments).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities",
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/liabilities/:id", () => {
  it("returns 200 with single liability", async () => {
    (liabilityService.getLiabilityById as any).mockResolvedValue(mockLiability);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities/liab-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().liability.id).toBe("liab-1");
  });
});

describe("POST /api/liabilities", () => {
  const validPayload = {
    name: "Test Mortgage",
    type: "mortgage",
    currentBalance: 200000,
    originalAmount: 250000,
    interestRate: 3.5,
    interestType: "fixed",
    minimumPayment: 898,
    paymentFrequency: "monthly",
  };

  it("returns 201 with valid input", async () => {
    (liabilityService.createLiability as any).mockResolvedValue(mockLiability);

    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities",
      headers: authHeaders,
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().liability.name).toBe("Mortgage");
  });

  it("returns 400 for missing required fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities",
      headers: authHeaders,
      payload: { name: "Test" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for negative balance", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities",
      headers: authHeaders,
      payload: { ...validPayload, currentBalance: -1 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for interest rate > 100", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities",
      headers: authHeaders,
      payload: { ...validPayload, interestRate: 101 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/liabilities/:id", () => {
  it("returns 200 with updated liability", async () => {
    const updated = { ...mockLiability, name: "Updated Mortgage" };
    (liabilityService.updateLiability as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: "PUT",
      url: "/api/liabilities/liab-1",
      headers: authHeaders,
      payload: { name: "Updated Mortgage" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().liability.name).toBe("Updated Mortgage");
  });
});

describe("POST /api/liabilities/:id/allocate", () => {
  it("returns 201 with valid allocation", async () => {
    const payment = { id: "payment-1", transactionId: "tx-1", liabilityId: "liab-1" };
    (liabilityService.allocateTransactionToLiability as any).mockResolvedValue(payment);

    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities/liab-1/allocate",
      headers: authHeaders,
      payload: {
        transactionId: "550e8400-e29b-41d4-a716-446655440000",
        principalAmount: 315,
        interestAmount: 583,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().payment.id).toBe("payment-1");
  });

  it("returns 400 for missing transactionId", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/liabilities/liab-1/allocate",
      headers: authHeaders,
      payload: { principalAmount: 315, interestAmount: 583 },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /api/liabilities/payments/:paymentId", () => {
  it("returns 200 on successful removal", async () => {
    (liabilityService.removePaymentAllocation as any).mockResolvedValue({
      message: "Payment allocation removed",
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/liabilities/payments/payment-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("removed");
  });
});

describe("GET /api/liabilities/:id/projection", () => {
  it("returns 200 with payoff projection", async () => {
    const projection = {
      currentBalance: 200000,
      schedule: [{ month: 1, payment: 898, principal: 315, interest: 583, balance: 199685 }],
      totalInterestToPay: 123000,
      projectedPayoffDate: "2055-01-01",
    };
    (liabilityService.calculatePayoffProjection as any).mockResolvedValue(projection);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities/liab-1/projection",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().projection.currentBalance).toBe(200000);
  });
});

describe("DELETE /api/liabilities/:id", () => {
  it("returns 200 on successful delete", async () => {
    (liabilityService.deleteLiability as any).mockResolvedValue({ message: "Liability deleted" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/liabilities/liab-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("deleted");
  });
});

describe("GET /api/liabilities/summary", () => {
  it("returns 200 with liability summary", async () => {
    const summary = { totalDebt: 205000, monthlyMinimumPayment: 1098, byType: [] };
    (liabilityService.getLiabilitySummary as any).mockResolvedValue(summary);

    const response = await app.inject({
      method: "GET",
      url: "/api/liabilities/summary",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().totalDebt).toBe(205000);
  });
});
