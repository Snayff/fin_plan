import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const searchServiceMock = {
  search: mock(() => Promise.resolve({ results: [] })),
};

mock.module("../services/search.service", () => ({
  searchService: searchServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

mock.module("../config/database", () => ({
  prisma: {},
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { searchRoutes } from "./search.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  searchServiceMock.search.mockReset();
  searchServiceMock.search.mockResolvedValue({ results: [] });

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/search", () => {
  it("returns 401 without a JWT", async () => {
    const res = await app.inject({ method: "GET", url: "/api/search?q=x" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for an empty query", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("passes req.householdId (not client input) to the service", async () => {
    searchServiceMock.search.mockResolvedValue({
      results: [
        {
          kind: "income_source",
          id: "i1",
          name: "Salary",
          subtitle: "Income · Source",
          route: "/income",
          focusId: "i1",
        },
      ],
    } as any);

    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=salary",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(res.statusCode).toBe(200);
    expect(searchServiceMock.search).toHaveBeenCalledWith("hh-1", "salary");
    const body = res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].kind).toBe("income_source");
  });
});
