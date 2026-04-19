import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { reviewSessionService } = await import("./review-session.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("reviewSessionService.getSession", () => {
  it("returns null when no session exists", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue(null);

    const result = await reviewSessionService.getSession("hh-1");

    expect(result).toBeNull();
  });
});

describe("reviewSessionService.createOrResetSession", () => {
  it("upserts with reset values", async () => {
    const ctx = { householdId: "hh-1", actorId: "user-1", actorName: "Test" };
    prismaMock.reviewSession.findUnique.mockResolvedValue(null);
    prismaMock.reviewSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await reviewSessionService.createOrResetSession("hh-1", ctx);

    expect(prismaMock.reviewSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId: "hh-1" },
        update: expect.objectContaining({
          currentStep: 0,
          confirmedItems: {},
          updatedItems: {},
        }),
      })
    );
  });
});

describe("reviewSessionService.createOrResetSession with audited()", () => {
  const actor = {
    householdId: "hh_1",
    actorId: "user_1",
    actorName: "Alice",
  };

  it("writes an AuditLog entry on session create/reset", async () => {
    prismaMock.reviewSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await reviewSessionService.createOrResetSession("hh-1", actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CREATE_REVIEW_SESSION",
          resource: "review-session",
          actorId: "user_1",
        }),
      })
    );
  });

  it("always writes AuditLog (ctx is required)", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue(null);
    prismaMock.reviewSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await reviewSessionService.createOrResetSession("hh-1", actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });
});

describe("reviewSessionService.updateSession with audited()", () => {
  const actor = {
    householdId: "hh_1",
    actorId: "user_1",
    actorName: "Alice",
  };

  it("writes an AuditLog entry on session update", async () => {
    prismaMock.reviewSession.update.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await reviewSessionService.updateSession("hh-1", { currentStep: 2 }, actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_REVIEW_SESSION",
          resource: "review-session",
          actorId: "user_1",
        }),
      })
    );
  });
});

describe("reviewSessionService.deleteSession", () => {
  it("deletes by householdId", async () => {
    prismaMock.reviewSession.deleteMany.mockResolvedValue({ count: 1 } as any);

    await reviewSessionService.deleteSession("hh-1");

    expect(prismaMock.reviewSession.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
  });
});

describe("reviewSessionService.getSession — JSON validation", () => {
  it("returns session with valid JSON fields", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue({
      id: "rs-1",
      householdId: "hh-1",
      currentStep: 2,
      confirmedItems: { income_source: ["inc-1"] },
      updatedItems: { "inc-1": { from: 3000, to: 3500 } },
      startedAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const session = await reviewSessionService.getSession("hh-1");

    expect(session).toBeDefined();
    expect(session!.confirmedItems).toEqual({ income_source: ["inc-1"] });
  });

  it("throws ValidationError when confirmedItems has invalid shape", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue({
      id: "rs-1",
      householdId: "hh-1",
      currentStep: 0,
      confirmedItems: { income_source: [123] }, // should be strings
      updatedItems: {},
      startedAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(reviewSessionService.getSession("hh-1")).rejects.toThrow("failed validation");
  });

  it("throws ValidationError when updatedItems has invalid shape", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue({
      id: "rs-1",
      householdId: "hh-1",
      currentStep: 0,
      confirmedItems: {},
      updatedItems: { "inc-1": { from: "bad" } }, // should be numbers with 'to'
      startedAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(reviewSessionService.getSession("hh-1")).rejects.toThrow("failed validation");
  });

  it("returns null when no session exists", async () => {
    prismaMock.reviewSession.findUnique.mockResolvedValue(null);

    const session = await reviewSessionService.getSession("hh-1");
    expect(session).toBeNull();
  });
});
