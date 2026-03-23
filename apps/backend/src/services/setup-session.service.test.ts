import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { setupSessionService } = await import("./setup-session.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("setupSessionService.getSession", () => {
  it("returns null when no session exists", async () => {
    prismaMock.waterfallSetupSession.findUnique.mockResolvedValue(null);

    const result = await setupSessionService.getSession("hh-1");

    expect(result).toBeNull();
  });
});

describe("setupSessionService.createOrResetSession", () => {
  it("upserts resetting step to 0", async () => {
    prismaMock.waterfallSetupSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);

    await setupSessionService.createOrResetSession("hh-1");

    expect(prismaMock.waterfallSetupSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId: "hh-1" },
        update: expect.objectContaining({ currentStep: 0 }),
      })
    );
  });
});

describe("setupSessionService.updateSession", () => {
  it("updates currentStep", async () => {
    prismaMock.waterfallSetupSession.update.mockResolvedValue({ householdId: "hh-1" } as any);

    await setupSessionService.updateSession("hh-1", { currentStep: 3 });

    expect(prismaMock.waterfallSetupSession.update).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
      data: { currentStep: 3 },
    });
  });
});

describe("setupSessionService.deleteSession", () => {
  it("deletes by householdId", async () => {
    prismaMock.waterfallSetupSession.deleteMany.mockResolvedValue({ count: 1 } as any);

    await setupSessionService.deleteSession("hh-1");

    expect(prismaMock.waterfallSetupSession.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
  });
});
