import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import Fastify from "fastify";

const giftsServiceMock = {
  getPlannerState: mock(() =>
    Promise.resolve({
      mode: "synced",
      year: 2026,
      isReadOnly: false,
      budget: {
        annualBudget: 0,
        planned: 0,
        spent: 0,
        plannedOverBudgetBy: 0,
        spentOverBudgetBy: 0,
      },
      people: [],
      rolloverPending: false,
    })
  ),
  getPersonDetail: mock(() => Promise.resolve({ person: {} as any, allocations: [] })),
  getUpcoming: mock(() =>
    Promise.resolve({
      callouts: {
        thisMonth: { count: 0, total: 0 },
        nextThreeMonths: { count: 0, total: 0 },
        restOfYear: { count: 0, total: 0 },
        dateless: { count: 0, total: 0 },
      },
      groups: [],
    })
  ),
  listPeopleForConfig: mock(() => Promise.resolve([])),
  listEventsForConfig: mock(() => Promise.resolve([])),
  listYearsWithData: mock(() => Promise.resolve([2026])),
  createPerson: mock(() => Promise.resolve({ id: "p1" })),
  updatePerson: mock(() => Promise.resolve({ id: "p1" })),
  deletePerson: mock(() => Promise.resolve()),
  createEvent: mock(() => Promise.resolve({ id: "e1" })),
  updateEvent: mock(() => Promise.resolve({ id: "e1" })),
  deleteEvent: mock(() => Promise.resolve()),
  upsertAllocation: mock(() => Promise.resolve({ id: "a1" })),
  bulkUpsertAllocations: mock(() => Promise.resolve({ count: 0 })),
  setAnnualBudget: mock(() => Promise.resolve({ annualBudget: 1000 })),
  setMode: mock(() => Promise.resolve({ mode: "synced" })),
  dismissRolloverNotification: mock(() => Promise.resolve()),
  runRolloverIfNeeded: mock(() => Promise.resolve(false)),
  seedLockedEventsIfMissing: mock(() => Promise.resolve()),
  getOrCreateSettings: mock(() =>
    Promise.resolve({ mode: "synced", syncedDiscretionaryItemId: null })
  ),
  getQuickAddMatrix: mock(() => Promise.resolve({ people: [], events: [] })),
};

mock.module("../services/gifts.service.js", () => ({ giftsService: giftsServiceMock }));
mock.module("../middleware/auth.middleware.js", () => ({
  authMiddleware: async (req: any) => {
    req.householdId = "hh-1";
    req.user = { userId: "user-1", email: "test@test.com", name: "User", role: "admin" };
  },
}));
mock.module("../lib/actor-ctx.js", () => ({
  actorCtx: () => ({ householdId: "hh-1", actorId: "user-1", actorName: "User" }),
}));

const { giftsRoutes } = await import("./gifts.routes.js");

async function buildApp() {
  const app = Fastify();
  await app.register(giftsRoutes, { prefix: "/api/gifts" });
  return app;
}

beforeEach(() => {
  for (const fn of Object.values(giftsServiceMock)) (fn as any).mockClear?.();
});

describe("gifts.routes", () => {
  it("GET /settings returns mode and syncedDiscretionaryItemId", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/settings" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ mode: "synced", syncedDiscretionaryItemId: null });
    expect(giftsServiceMock.getOrCreateSettings).toHaveBeenCalledWith("hh-1");
  });

  it("GET /state delegates to getPlannerState with current year by default", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/state" });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.getPlannerState).toHaveBeenCalledWith(
      "hh-1",
      new Date().getFullYear(),
      "user-1"
    );
  });

  it("PUT /budget/:year forwards body", async () => {
    const app = await buildApp();
    const year = new Date().getFullYear();
    const res = await app.inject({
      method: "PUT",
      url: `/api/gifts/budget/${year}`,
      payload: { annualBudget: 1500 },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.setAnnualBudget).toHaveBeenCalledWith("hh-1", year, {
      annualBudget: 1500,
    });
  });

  it("PUT /allocations/:personId/:eventId/:year upserts allocation", async () => {
    const app = await buildApp();
    const year = new Date().getFullYear();
    const res = await app.inject({
      method: "PUT",
      url: `/api/gifts/allocations/p1/e1/${year}`,
      payload: { planned: 50 },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.upsertAllocation).toHaveBeenCalledWith("hh-1", "p1", "e1", year, {
      planned: 50,
    });
  });

  it("POST /allocations/bulk forwards cells", async () => {
    const app = await buildApp();
    const year = new Date().getFullYear();
    const res = await app.inject({
      method: "POST",
      url: "/api/gifts/allocations/bulk",
      payload: { cells: [{ personId: "p1", eventId: "e1", year, planned: 10 }] },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.bulkUpsertAllocations).toHaveBeenCalled();
  });

  it("PUT /mode forwards mode", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "PUT",
      url: "/api/gifts/mode",
      payload: { mode: "independent" },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.setMode).toHaveBeenCalled();
  });

  // ── Read endpoints ──────────────────────────────────────────────────────────
  it("GET /people/:id passes the parsed year to getPersonDetail", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/people/p1?year=2025" });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.getPersonDetail).toHaveBeenCalledWith("hh-1", "p1", 2025);
  });

  it("GET /upcoming delegates to getUpcoming", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/upcoming?year=2026" });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.getUpcoming).toHaveBeenCalledWith("hh-1", 2026);
  });

  it("GET /years lists years with data", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/years" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([2026]);
    expect(giftsServiceMock.listYearsWithData).toHaveBeenCalledWith("hh-1");
  });

  it("GET /config/people defaults the filter to 'all'", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/config/people?year=2026" });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.listPeopleForConfig).toHaveBeenCalledWith("hh-1", "all", 2026);
  });

  it("GET /config/people forwards an explicit filter", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/gifts/config/people?filter=household",
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.listPeopleForConfig).toHaveBeenCalledWith(
      "hh-1",
      "household",
      expect.any(Number)
    );
  });

  it("GET /config/events lists events", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/gifts/config/events" });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.listEventsForConfig).toHaveBeenCalledWith("hh-1");
  });

  it("GET /config/quick-add-matrix delegates with the parsed year", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/api/gifts/config/quick-add-matrix?year=2026",
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.getQuickAddMatrix).toHaveBeenCalledWith("hh-1", 2026);
  });

  // ── People mutations ──────────────────────────────────────────────────────────
  it("POST /people creates a person and returns 201", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/gifts/people",
      payload: { name: "Grandma" },
    });
    expect(res.statusCode).toBe(201);
    expect(giftsServiceMock.createPerson).toHaveBeenCalledWith(
      "hh-1",
      expect.objectContaining({ name: "Grandma" }),
      expect.anything()
    );
  });

  it("POST /people rejects an invalid body (blank name)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/gifts/people",
      payload: { name: "" },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(giftsServiceMock.createPerson).not.toHaveBeenCalled();
  });

  it("PATCH /people/:id updates a person", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/gifts/people/p1",
      payload: { name: "Grandpa" },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.updatePerson).toHaveBeenCalledWith(
      "hh-1",
      "p1",
      expect.objectContaining({ name: "Grandpa" }),
      expect.anything()
    );
  });

  it("DELETE /people/:id returns 204", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "DELETE", url: "/api/gifts/people/p1" });
    expect(res.statusCode).toBe(204);
    expect(giftsServiceMock.deletePerson).toHaveBeenCalledWith("hh-1", "p1", expect.anything());
  });

  // ── Event mutations ───────────────────────────────────────────────────────────
  it("POST /events creates a personal-date event and returns 201", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/gifts/events",
      payload: { name: "Birthday", dateType: "personal" },
    });
    expect(res.statusCode).toBe(201);
    expect(giftsServiceMock.createEvent).toHaveBeenCalled();
  });

  it("POST /events rejects a shared-date event missing month/day", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/gifts/events",
      payload: { name: "Christmas", dateType: "shared" },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(giftsServiceMock.createEvent).not.toHaveBeenCalled();
  });

  it("PATCH /events/:id updates an event", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/gifts/events/e1",
      payload: { name: "Renamed" },
    });
    expect(res.statusCode).toBe(200);
    expect(giftsServiceMock.updateEvent).toHaveBeenCalled();
  });

  it("DELETE /events/:id returns 204", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "DELETE", url: "/api/gifts/events/e1" });
    expect(res.statusCode).toBe(204);
    expect(giftsServiceMock.deleteEvent).toHaveBeenCalledWith("hh-1", "e1", expect.anything());
  });

  // ── Rollover banner ─────────────────────────────────────────────────────────
  it("DELETE /rollover-banner/:year dismisses the notification", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "DELETE", url: "/api/gifts/rollover-banner/2026" });
    expect(res.statusCode).toBe(204);
    expect(giftsServiceMock.dismissRolloverNotification).toHaveBeenCalledWith(
      "hh-1",
      "user-1",
      2026
    );
  });
});
