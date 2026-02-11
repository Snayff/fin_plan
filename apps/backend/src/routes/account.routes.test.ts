import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/account.service", () => ({
  accountService: {
    getUserAccountsWithEnhancedData: mock(() => {}),
    getAccountById: mock(() => {}),
    getAccountSummary: mock(() => {}),
    createAccount: mock(() => {}),
    updateAccount: mock(() => {}),
    deleteAccount: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { accountService } from "../services/account.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { accountRoutes } from "./account.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(accountRoutes, { prefix: "/api" });
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
const mockAccount = {
  id: "acc-1",
  name: "Current Account",
  type: "current",
  userId: "user-1",
  currency: "GBP",
  openingBalance: 0,
  isActive: true,
};

describe("GET /api/accounts", () => {
  it("returns 200 with accounts list", async () => {
    (accountService.getUserAccountsWithEnhancedData as any).mockResolvedValue([mockAccount]);

    const response = await app.inject({
      method: "GET",
      url: "/api/accounts",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().accounts).toHaveLength(1);
    expect(response.json().accounts[0].name).toBe("Current Account");
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/accounts",
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/accounts/:id", () => {
  it("returns 200 with single account", async () => {
    (accountService.getAccountById as any).mockResolvedValue(mockAccount);

    const response = await app.inject({
      method: "GET",
      url: "/api/accounts/acc-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().account.id).toBe("acc-1");
  });
});

describe("GET /api/accounts/:id/summary", () => {
  it("returns 200 with account summary", async () => {
    const summary = { account: mockAccount, transactionCount: 10, recentTransactions: [] };
    (accountService.getAccountSummary as any).mockResolvedValue(summary);

    const response = await app.inject({
      method: "GET",
      url: "/api/accounts/acc-1/summary",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().transactionCount).toBe(10);
  });
});

describe("POST /api/accounts", () => {
  it("returns 201 with valid input", async () => {
    (accountService.createAccount as any).mockResolvedValue(mockAccount);

    const response = await app.inject({
      method: "POST",
      url: "/api/accounts",
      headers: authHeaders,
      payload: { name: "Current Account", type: "current" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().account.name).toBe("Current Account");
  });

  it("calls service with parsed data including defaults", async () => {
    (accountService.createAccount as any).mockResolvedValue(mockAccount);

    await app.inject({
      method: "POST",
      url: "/api/accounts",
      headers: authHeaders,
      payload: { name: "Savings", type: "savings" },
    });

    expect(accountService.createAccount).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        name: "Savings",
        type: "savings",
        openingBalance: 0,
        currency: "GBP",
      })
    );
  });

  it("returns 400 for missing name", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/accounts",
      headers: authHeaders,
      payload: { type: "current" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid account type", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/accounts",
      headers: authHeaders,
      payload: { name: "Test", type: "invalid_type" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/accounts/:id", () => {
  it("returns 200 with updated account", async () => {
    const updated = { ...mockAccount, name: "Updated Account" };
    (accountService.updateAccount as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: "PUT",
      url: "/api/accounts/acc-1",
      headers: authHeaders,
      payload: { name: "Updated Account" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().account.name).toBe("Updated Account");
  });
});

describe("DELETE /api/accounts/:id", () => {
  it("returns 200 on successful delete", async () => {
    (accountService.deleteAccount as any).mockResolvedValue({ message: "Account deleted" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/accounts/acc-1",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("deleted");
  });
});
