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
