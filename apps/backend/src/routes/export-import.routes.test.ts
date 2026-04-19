import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

mock.module("../services/export.service", () => ({
  exportService: {
    exportHousehold: mock(() => {}),
  },
}));

mock.module("../services/import.service", () => ({
  importService: {
    importHousehold: mock(() => {}),
    validateImportData: mock(() => {}),
  },
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { exportService } from "../services/export.service";
import { importService } from "../services/import.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { exportImportRoutes } from "./export-import.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(exportImportRoutes, { prefix: "/api" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const authHeaders = { authorization: "Bearer valid-token" };

const mockExportEnvelope = {
  schemaVersion: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  household: { name: "Test Household" },
  settings: {},
  members: [],
  subcategories: [],
  incomeSources: [],
  committedItems: [],
  discretionaryItems: [],
  itemAmountPeriods: [],
  waterfallHistory: [],
  assets: [],
  accounts: [],
  purchaseItems: [],
  plannerYearBudgets: [],
  giftPersons: [],
};

beforeEach(() => {
  (exportService.exportHousehold as any).mockReset();
  (importService.importHousehold as any).mockReset();
  (importService.validateImportData as any).mockReset();

  (exportService.exportHousehold as any).mockResolvedValue(mockExportEnvelope);
  (importService.importHousehold as any).mockResolvedValue({
    success: true,
    householdId: "household-new-1",
  });
  (importService.validateImportData as any).mockReturnValue({ valid: true });

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "household-1";
  });
});

describe("GET /api/households/export", () => {
  it("returns 200 with the export envelope for an owner", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/households/export",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.schemaVersion).toBe(1);
    expect(body.household.name).toBe("Test Household");
    expect(exportService.exportHousehold).toHaveBeenCalledWith(
      "household-1",
      "user-1",
      expect.any(Object)
    );
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/households/export",
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("POST /api/households/import", () => {
  it("returns 200 with success + householdId for create_new mode", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/households/import?mode=create_new",
      headers: authHeaders,
      payload: { schemaVersion: 1, household: { name: "Imported" } },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.householdId).toBe("household-new-1");
    expect(importService.importHousehold).toHaveBeenCalledWith(
      "household-1",
      "user-1",
      expect.objectContaining({ schemaVersion: 1 }),
      "create_new",
      expect.any(Object)
    );
  });

  it("returns 200 for overwrite mode", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/households/import?mode=overwrite",
      headers: authHeaders,
      payload: { schemaVersion: 1, household: { name: "Imported" } },
    });

    expect(response.statusCode).toBe(200);
    expect(importService.importHousehold).toHaveBeenCalledWith(
      "household-1",
      "user-1",
      expect.anything(),
      "overwrite",
      expect.any(Object)
    );
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/households/import?mode=create_new",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("POST /api/households/validate-import", () => {
  it("returns { valid: true } for a valid body", async () => {
    (importService.validateImportData as any).mockReturnValue({ valid: true });

    const response = await app.inject({
      method: "POST",
      url: "/api/households/validate-import",
      headers: authHeaders,
      payload: { schemaVersion: 1, household: { name: "x" } },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ valid: true });
    expect(importService.validateImportData).toHaveBeenCalled();
  });

  it("returns { valid: false, errors: [...] } for an invalid body", async () => {
    (importService.validateImportData as any).mockReturnValue({
      valid: false,
      errors: ["household: Required"],
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/households/validate-import",
      headers: authHeaders,
      payload: { bogus: true },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.valid).toBe(false);
    expect(body.errors).toEqual(["household: Required"]);
  });

  it("returns 401 without auth", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/households/validate-import",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });
});
