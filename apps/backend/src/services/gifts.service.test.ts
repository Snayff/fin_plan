import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { giftsService } = await import("./gifts.service.js");

beforeEach(() => resetPrismaMocks());

describe("schema: new gift models exist on prisma client", () => {
  it("exposes giftAllocation, giftPlannerSettings, giftRolloverDismissal", () => {
    expect(prismaMock.giftAllocation).toBeDefined();
    expect(prismaMock.giftPlannerSettings).toBeDefined();
    expect(prismaMock.giftRolloverDismissal).toBeDefined();
  });

  it("exposes giftAllocation.upsert as a mock fn", () => {
    expect(typeof prismaMock.giftAllocation.upsert).toBe("function");
  });
});

describe("giftsService.getOrCreateSettings", () => {
  it("returns existing settings when present", async () => {
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue({
      id: "s1",
      householdId: "hh-1",
      mode: "synced",
      syncedDiscretionaryItemId: "d1",
    } as any);

    const s = await giftsService.getOrCreateSettings("hh-1");
    expect(s.mode).toBe("synced");
    expect(prismaMock.giftPlannerSettings.create).not.toHaveBeenCalled();
  });

  it("creates with synced default when missing", async () => {
    prismaMock.giftPlannerSettings.findUnique.mockResolvedValue(null);
    prismaMock.giftPlannerSettings.create.mockResolvedValue({
      id: "s2",
      householdId: "hh-1",
      mode: "synced",
      syncedDiscretionaryItemId: null,
    } as any);

    const s = await giftsService.getOrCreateSettings("hh-1");
    expect(s.mode).toBe("synced");
    expect(prismaMock.giftPlannerSettings.create).toHaveBeenCalledWith({
      data: { householdId: "hh-1", mode: "synced" },
    });
  });
});
