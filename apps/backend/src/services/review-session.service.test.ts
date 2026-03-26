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
    prismaMock.reviewSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);

    await reviewSessionService.createOrResetSession("hh-1");

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
