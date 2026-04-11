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

describe("giftsService people CRUD", () => {
  it("listPeople returns rows ordered by sortOrder asc", async () => {
    prismaMock.giftPerson.findMany.mockResolvedValue([
      { id: "a", name: "Mum", sortOrder: 0, memberId: null },
      { id: "b", name: "Dad", sortOrder: 1, memberId: "m1" },
    ] as any);
    const rows = await giftsService.listPeople("hh-1");
    expect(rows).toHaveLength(2);
    expect(prismaMock.giftPerson.findMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  });

  it("createPerson rejects duplicate names with ConflictError", async () => {
    prismaMock.giftPerson.create.mockRejectedValue({ code: "P2002" });
    await expect(giftsService.createPerson("hh-1", { name: "Mum" })).rejects.toMatchObject({
      name: "ConflictError",
    });
  });

  it("createPerson persists with householdId", async () => {
    prismaMock.giftPerson.create.mockResolvedValue({ id: "p1" } as any);
    await giftsService.createPerson("hh-1", { name: "Sis", notes: "fav books" });
    expect(prismaMock.giftPerson.create).toHaveBeenCalledWith({
      data: { householdId: "hh-1", name: "Sis", notes: "fav books" },
    });
  });

  it("updatePerson asserts ownership", async () => {
    prismaMock.giftPerson.findUnique.mockResolvedValue({
      id: "p1",
      householdId: "other",
    } as any);
    await expect(giftsService.updatePerson("hh-1", "p1", { name: "x" })).rejects.toMatchObject({
      name: "NotFoundError",
    });
  });

  it("deletePerson cascades via prisma onDelete", async () => {
    prismaMock.giftPerson.findUnique.mockResolvedValue({
      id: "p1",
      householdId: "hh-1",
    } as any);
    prismaMock.giftPerson.delete.mockResolvedValue({} as any);
    await giftsService.deletePerson("hh-1", "p1");
    expect(prismaMock.giftPerson.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});

describe("giftsService events CRUD", () => {
  it("createEvent persists with householdId", async () => {
    prismaMock.giftEvent.create.mockResolvedValue({ id: "e1" } as any);
    await giftsService.createEvent("hh-1", {
      name: "Christmas",
      dateType: "shared",
      dateMonth: 12,
      dateDay: 25,
    });
    expect(prismaMock.giftEvent.create).toHaveBeenCalledWith({
      data: {
        householdId: "hh-1",
        name: "Christmas",
        dateType: "shared",
        dateMonth: 12,
        dateDay: 25,
        isLocked: false,
      },
    });
  });

  it("createEvent rejects duplicates", async () => {
    prismaMock.giftEvent.create.mockRejectedValue({ code: "P2002" });
    await expect(
      giftsService.createEvent("hh-1", { name: "Birthday", dateType: "personal" })
    ).rejects.toMatchObject({ name: "ConflictError" });
  });

  it("updateEvent rejects rename of locked event", async () => {
    prismaMock.giftEvent.findUnique.mockResolvedValue({
      id: "e1",
      householdId: "hh-1",
      isLocked: true,
      name: "Christmas",
    } as any);
    await expect(giftsService.updateEvent("hh-1", "e1", { name: "Xmas" })).rejects.toMatchObject({
      name: "ValidationError",
    });
  });

  it("updateEvent allows date override on a locked event", async () => {
    prismaMock.giftEvent.findUnique.mockResolvedValue({
      id: "e1",
      householdId: "hh-1",
      isLocked: true,
      name: "Mother's Day",
    } as any);
    prismaMock.giftEvent.update.mockResolvedValue({} as any);
    await giftsService.updateEvent("hh-1", "e1", { dateMonth: 3, dateDay: 22 });
    expect(prismaMock.giftEvent.update).toHaveBeenCalled();
  });

  it("deleteEvent rejects locked events", async () => {
    prismaMock.giftEvent.findUnique.mockResolvedValue({
      id: "e1",
      householdId: "hh-1",
      isLocked: true,
    } as any);
    await expect(giftsService.deleteEvent("hh-1", "e1")).rejects.toMatchObject({
      name: "ValidationError",
    });
  });

  it("deleteEvent succeeds for custom events", async () => {
    prismaMock.giftEvent.findUnique.mockResolvedValue({
      id: "e2",
      householdId: "hh-1",
      isLocked: false,
    } as any);
    prismaMock.giftEvent.delete.mockResolvedValue({} as any);
    await giftsService.deleteEvent("hh-1", "e2");
    expect(prismaMock.giftEvent.delete).toHaveBeenCalledWith({ where: { id: "e2" } });
  });
});
