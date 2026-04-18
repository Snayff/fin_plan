import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { settingsService } = await import("./settings.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("settingsService.getSettings", () => {
  it("returns existing record when found", async () => {
    const existing = { id: "s-1", householdId: "hh-1" };
    prismaMock.householdSettings.findUnique.mockResolvedValue(existing as any);

    const result = await settingsService.getSettings("hh-1");

    expect(result).toBe(existing);
    expect(prismaMock.householdSettings.create).not.toHaveBeenCalled();
  });

  it("auto-creates with defaults when not found", async () => {
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.householdSettings.create.mockResolvedValue({ householdId: "hh-1" } as any);

    await settingsService.getSettings("hh-1");

    expect(prismaMock.householdSettings.create).toHaveBeenCalledWith({
      data: { householdId: "hh-1" },
    });
  });
});

describe("settingsService.updateSettings", () => {
  it("upserts with provided data", async () => {
    prismaMock.householdSettings.upsert.mockResolvedValue({ householdId: "hh-1" } as any);

    await settingsService.updateSettings("hh-1", { surplusBenchmarkPct: 15 });

    expect(prismaMock.householdSettings.upsert).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
      create: { householdId: "hh-1", surplusBenchmarkPct: 15 },
      update: { surplusBenchmarkPct: 15 },
    });
  });
});

describe("settingsService.updateSettings with audited()", () => {
  const actor = {
    householdId: "hh-1",
    actorId: "user-1",
    actorName: "Alice",
  };

  it("writes an UPDATE_HOUSEHOLD_SETTINGS AuditLog entry when ctx is provided", async () => {
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      householdId: "hh-1",
      surplusBenchmarkPct: 10,
    } as any);
    prismaMock.householdSettings.upsert.mockResolvedValue({
      householdId: "hh-1",
      surplusBenchmarkPct: 15,
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await settingsService.updateSettings("hh-1", { surplusBenchmarkPct: 15 }, actor);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_HOUSEHOLD_SETTINGS",
          resource: "household-settings",
          actorId: "user-1",
        }),
      })
    );
  });

  it("does not write AuditLog when ctx is absent (backward compat)", async () => {
    prismaMock.householdSettings.upsert.mockResolvedValue({ householdId: "hh-1" } as any);

    await settingsService.updateSettings("hh-1", { surplusBenchmarkPct: 15 });

    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("HouseholdSettings.waterfallTipDismissed", () => {
  it("defaults to false for a new household", async () => {
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);
    prismaMock.householdSettings.create.mockResolvedValue({
      householdId: "hh-1",
      waterfallTipDismissed: false,
    } as any);

    const settings = await settingsService.getSettings("hh-1");

    expect(settings.waterfallTipDismissed).toBe(false);
  });

  it("can be updated to true via updateSettings", async () => {
    prismaMock.householdSettings.upsert.mockResolvedValue({
      householdId: "hh-1",
      waterfallTipDismissed: true,
    } as any);

    const updated = await settingsService.updateSettings("hh-1", { waterfallTipDismissed: true });

    expect(updated.waterfallTipDismissed).toBe(true);
    expect(prismaMock.householdSettings.upsert).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
      create: { householdId: "hh-1", waterfallTipDismissed: true },
      update: { waterfallTipDismissed: true },
    });
  });
});
