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
