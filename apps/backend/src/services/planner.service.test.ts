import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { plannerService } = await import("./planner.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

// ─── Purchases ────────────────────────────────────────────────────────────────

describe("plannerService.listPurchases", () => {
  it("queries by householdId and year", async () => {
    prismaMock.purchaseItem.findMany.mockResolvedValue([]);

    await plannerService.listPurchases("hh-1", 2025);

    expect(prismaMock.purchaseItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { householdId: "hh-1", yearAdded: 2025 } })
    );
  });
});

describe("plannerService.createPurchase", () => {
  it("creates with householdId and current year", async () => {
    prismaMock.purchaseItem.create.mockResolvedValue({ id: "p-1" } as any);

    await plannerService.createPurchase("hh-1", { name: "Bike", estimatedCost: 500 });

    expect(prismaMock.purchaseItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Bike",
        estimatedCost: 500,
        householdId: "hh-1",
        yearAdded: new Date().getFullYear(),
      }),
    });
  });
});

describe("plannerService.updatePurchase", () => {
  it("throws NotFoundError when item not found", async () => {
    prismaMock.purchaseItem.findUnique.mockResolvedValue(null);

    await expect(
      plannerService.updatePurchase("hh-1", "p-1", { name: "New name" })
    ).rejects.toThrow("Purchase not found");
  });

  it("throws NotFoundError when item belongs to different household", async () => {
    prismaMock.purchaseItem.findUnique.mockResolvedValue({
      id: "p-1",
      householdId: "hh-other",
    } as any);

    await expect(
      plannerService.updatePurchase("hh-1", "p-1", { name: "New name" })
    ).rejects.toThrow("Purchase not found");
  });
});

describe("plannerService.deletePurchase", () => {
  it("deletes when ownership verified", async () => {
    prismaMock.purchaseItem.findUnique.mockResolvedValue({
      id: "p-1",
      householdId: "hh-1",
    } as any);
    prismaMock.purchaseItem.delete.mockResolvedValue({} as any);

    await plannerService.deletePurchase("hh-1", "p-1");

    expect(prismaMock.purchaseItem.delete).toHaveBeenCalledWith({ where: { id: "p-1" } });
  });
});

// ─── Year budget ──────────────────────────────────────────────────────────────

describe("plannerService.getYearBudget", () => {
  it("returns existing record when found", async () => {
    const existing = { householdId: "hh-1", year: 2025 };
    prismaMock.plannerYearBudget.findUnique.mockResolvedValue(existing as any);

    const result = await plannerService.getYearBudget("hh-1", 2025);

    expect(result).toBe(existing);
    expect(prismaMock.plannerYearBudget.create).not.toHaveBeenCalled();
  });

  it("auto-creates with defaults when not found", async () => {
    prismaMock.plannerYearBudget.findUnique.mockResolvedValue(null);
    prismaMock.plannerYearBudget.create.mockResolvedValue({
      householdId: "hh-1",
      year: 2025,
    } as any);

    await plannerService.getYearBudget("hh-1", 2025);

    expect(prismaMock.plannerYearBudget.create).toHaveBeenCalledWith({
      data: { householdId: "hh-1", year: 2025 },
    });
  });
});

// ─── Gift persons ─────────────────────────────────────────────────────────────

describe("plannerService.createGiftPerson", () => {
  it("creates with householdId", async () => {
    prismaMock.giftPerson.create.mockResolvedValue({ id: "gp-1" } as any);

    await plannerService.createGiftPerson("hh-1", { name: "Mum" });

    expect(prismaMock.giftPerson.create).toHaveBeenCalledWith({
      data: { name: "Mum", householdId: "hh-1" },
    });
  });
});

describe("plannerService.deleteGiftPerson", () => {
  it("cascades: deletes year records, then events, then person", async () => {
    prismaMock.giftPerson.findUnique.mockResolvedValue({
      id: "gp-1",
      householdId: "hh-1",
    } as any);
    prismaMock.giftEvent.findMany.mockResolvedValue([{ id: "ev-1" }, { id: "ev-2" }] as any);
    prismaMock.giftYearRecord.deleteMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.giftEvent.deleteMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.giftPerson.delete.mockResolvedValue({} as any);

    await plannerService.deleteGiftPerson("hh-1", "gp-1");

    expect(prismaMock.giftYearRecord.deleteMany).toHaveBeenCalledWith({
      where: { giftEventId: { in: ["ev-1", "ev-2"] } },
    });
    expect(prismaMock.giftEvent.deleteMany).toHaveBeenCalledWith({
      where: { giftPersonId: "gp-1" },
    });
    expect(prismaMock.giftPerson.delete).toHaveBeenCalledWith({ where: { id: "gp-1" } });
  });
});

// ─── Gift events ──────────────────────────────────────────────────────────────

describe("plannerService.createGiftEvent", () => {
  it("throws when person not found", async () => {
    prismaMock.giftPerson.findUnique.mockResolvedValue(null);

    await expect(
      plannerService.createGiftEvent("hh-1", "gp-1", { eventType: "birthday" })
    ).rejects.toThrow("Gift person not found");
  });

  it("creates event with personId and householdId", async () => {
    prismaMock.giftPerson.findUnique.mockResolvedValue({
      id: "gp-1",
      householdId: "hh-1",
    } as any);
    prismaMock.giftEvent.create.mockResolvedValue({ id: "ev-1" } as any);

    await plannerService.createGiftEvent("hh-1", "gp-1", { eventType: "birthday" });

    expect(prismaMock.giftEvent.create).toHaveBeenCalledWith({
      data: { eventType: "birthday", giftPersonId: "gp-1", householdId: "hh-1" },
    });
  });
});

describe("plannerService.deleteGiftEvent", () => {
  it("deletes year records then event", async () => {
    prismaMock.giftEvent.findUnique.mockResolvedValue({
      id: "ev-1",
      householdId: "hh-1",
    } as any);
    prismaMock.giftYearRecord.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.giftEvent.delete.mockResolvedValue({} as any);

    await plannerService.deleteGiftEvent("hh-1", "ev-1");

    expect(prismaMock.giftYearRecord.deleteMany).toHaveBeenCalledWith({
      where: { giftEventId: "ev-1" },
    });
    expect(prismaMock.giftEvent.delete).toHaveBeenCalledWith({ where: { id: "ev-1" } });
  });
});

// ─── Upcoming gifts ───────────────────────────────────────────────────────────

describe("plannerService.getUpcomingGifts", () => {
  it("returns events sorted by nextDate with done flag", async () => {
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), 11, 25); // Dec 25
    const pastDate = new Date(now.getFullYear(), 1, 14); // Feb 14 (likely past)

    prismaMock.giftEvent.findMany.mockResolvedValue([
      {
        id: "ev-1",
        householdId: "hh-1",
        eventType: "christmas",
        recurrence: "annual",
        specificDate: null,
        dateMonth: null,
        dateDay: null,
        giftPerson: { id: "gp-1", name: "Mum" },
        yearRecords: [],
      },
      {
        id: "ev-2",
        householdId: "hh-1",
        eventType: "valentines_day",
        recurrence: "annual",
        specificDate: null,
        dateMonth: null,
        dateDay: null,
        giftPerson: { id: "gp-1", name: "Mum" },
        yearRecords: [{ budget: 50, notes: null }],
      },
    ] as any);

    const result = await plannerService.getUpcomingGifts("hh-1", now.getFullYear());

    expect(result).toHaveLength(2);
    // Christmas should come after Valentine's when sorted chronologically in current year
    // Valentine's (Feb 14) < Christmas (Dec 25)
    expect(result[0].eventType).toBe("valentines_day");
    expect(result[1].eventType).toBe("christmas");

    const valentines = result[0];
    expect(valentines.done).toBe(new Date(now.getFullYear(), 1, 14) < now);
    expect(valentines.yearRecord).toEqual({ budget: 50, notes: null });

    const christmas = result[1];
    expect(christmas.done).toBe(futureDate < now);
    expect(christmas.yearRecord).toBeNull();
  });
});

describe("plannerService.getUpcomingGifts — DI clock", () => {
  it("marks past events as done based on injected now", async () => {
    const now = new Date("2026-07-01");

    prismaMock.giftEvent.findMany.mockResolvedValue([
      {
        id: "ge-1",
        householdId: "hh-1",
        giftPersonId: "gp-1",
        eventType: "birthday",
        recurrence: "annual",
        dateMonth: 3, // March — before July
        dateDay: 15,
        specificDate: null,
        giftPerson: { id: "gp-1", name: "Alice", householdId: "hh-1" },
        yearRecords: [],
      },
      {
        id: "ge-2",
        householdId: "hh-1",
        giftPersonId: "gp-1",
        eventType: "birthday",
        recurrence: "annual",
        dateMonth: 12, // December — after July
        dateDay: 25,
        specificDate: null,
        giftPerson: { id: "gp-1", name: "Bob", householdId: "hh-1" },
        yearRecords: [],
      },
    ] as any);

    const result = await plannerService.getUpcomingGifts("hh-1", 2026, now);

    const marchEvent = result.find((e) => e.id === "ge-1");
    const decEvent = result.find((e) => e.id === "ge-2");
    expect(marchEvent!.done).toBe(true); // March 15 < July 1
    expect(decEvent!.done).toBe(false); // Dec 25 > July 1
  });
});
