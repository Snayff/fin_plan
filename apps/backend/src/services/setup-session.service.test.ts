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

describe("setupSessionService.createOrResetSession with audited()", () => {
  const actor = {
    householdId: "hh_1",
    actorId: "user_1",
    actorName: "Alice",
  };

  it("writes an AuditLog entry on session create/reset", async () => {
    prismaMock.waterfallSetupSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await setupSessionService.createOrResetSession("hh-1", actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CREATE_SETUP_SESSION",
          resource: "setup-session",
          actorId: "user_1",
        }),
      })
    );
  });

  it("does not write AuditLog when actorCtx is absent (backward compat)", async () => {
    prismaMock.waterfallSetupSession.upsert.mockResolvedValue({ householdId: "hh-1" } as any);

    await setupSessionService.createOrResetSession("hh-1");

    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("setupSessionService.updateSession with audited()", () => {
  const actor = {
    householdId: "hh_1",
    actorId: "user_1",
    actorName: "Alice",
  };

  it("writes an AuditLog entry on session update", async () => {
    prismaMock.waterfallSetupSession.update.mockResolvedValue({ householdId: "hh-1" } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await setupSessionService.updateSession("hh-1", { currentStep: 3 }, actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_SETUP_SESSION",
          resource: "setup-session",
          actorId: "user_1",
        }),
      })
    );
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
