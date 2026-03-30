import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { nextEventDate } from "../utils/gift-dates.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  UpsertYearBudgetInput,
  CreateGiftPersonInput,
  UpdateGiftPersonInput,
  CreateGiftEventInput,
  UpdateGiftEventInput,
  UpsertGiftYearRecordInput,
} from "@finplan/shared";

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

export const plannerService = {
  // ─── Purchases ────────────────────────────────────────────────────────────

  async listPurchases(householdId: string, year: number) {
    return prisma.purchaseItem.findMany({
      where: { householdId, yearAdded: year },
      orderBy: [{ scheduledThisYear: "desc" }, { priority: "desc" }, { createdAt: "asc" }],
    });
  },

  async createPurchase(householdId: string, data: CreatePurchaseInput, ctx?: ActorCtx) {
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) =>
          tx.purchaseItem.create({
            data: { ...data, householdId, yearAdded: new Date().getFullYear() },
          }),
      });
    }
    return prisma.purchaseItem.create({
      data: { ...data, householdId, yearAdded: new Date().getFullYear() },
    });
  },

  async updatePurchase(householdId: string, id: string, data: UpdatePurchaseInput, ctx?: ActorCtx) {
    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Purchase");
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.purchaseItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => tx.purchaseItem.update({ where: { id }, data }),
      });
    }
    return prisma.purchaseItem.update({ where: { id }, data });
  },

  async deletePurchase(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Purchase");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.purchaseItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          await tx.purchaseItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
    await prisma.purchaseItem.delete({ where: { id } });
  },

  // ─── Year budget ──────────────────────────────────────────────────────────

  async getYearBudget(householdId: string, year: number) {
    const existing = await prisma.plannerYearBudget.findUnique({
      where: { householdId_year: { householdId, year } },
    });
    if (existing) return existing;
    // Auto-create with defaults
    return prisma.plannerYearBudget.create({ data: { householdId, year } });
  },

  async upsertYearBudget(householdId: string, year: number, data: UpsertYearBudgetInput) {
    return prisma.plannerYearBudget.upsert({
      where: { householdId_year: { householdId, year } },
      create: { householdId, year, ...data },
      update: data,
    });
  },

  // ─── Gift persons ─────────────────────────────────────────────────────────

  async listGiftPersons(householdId: string, year: number) {
    const persons = await prisma.giftPerson.findMany({
      where: { householdId },
      include: {
        events: {
          include: { yearRecords: { where: { year } } },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return persons.map((p) => ({
      ...p,
      budgetTotal: p.events.reduce((sum, e) => {
        const rec = e.yearRecords[0];
        return sum + (rec?.budget ?? 0);
      }, 0),
    }));
  },

  async getGiftPerson(householdId: string, id: string, year: number) {
    const person = await prisma.giftPerson.findUnique({
      where: { id },
      include: {
        events: {
          include: { yearRecords: { where: { year } } },
        },
      },
    });
    assertOwned(person, householdId, "Gift person");
    return person;
  },

  async createGiftPerson(householdId: string, data: CreateGiftPersonInput) {
    return prisma.giftPerson.create({ data: { ...data, householdId } });
  },

  async updateGiftPerson(householdId: string, id: string, data: UpdateGiftPersonInput) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    return prisma.giftPerson.update({ where: { id }, data });
  },

  async deleteGiftPerson(householdId: string, id: string) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    // Cascade: delete year records, then events, then person
    const events = await prisma.giftEvent.findMany({ where: { giftPersonId: id } });
    const eventIds = events.map((e) => e.id);
    await prisma.giftYearRecord.deleteMany({ where: { giftEventId: { in: eventIds } } });
    await prisma.giftEvent.deleteMany({ where: { giftPersonId: id } });
    await prisma.giftPerson.delete({ where: { id } });
  },

  // ─── Gift events ──────────────────────────────────────────────────────────

  async createGiftEvent(householdId: string, personId: string, data: CreateGiftEventInput) {
    const person = await prisma.giftPerson.findUnique({ where: { id: personId } });
    assertOwned(person, householdId, "Gift person");
    return prisma.giftEvent.create({
      data: { ...data, giftPersonId: personId, householdId },
    });
  },

  async updateGiftEvent(householdId: string, id: string, data: UpdateGiftEventInput) {
    const existing = await prisma.giftEvent.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift event");
    return prisma.giftEvent.update({ where: { id }, data });
  },

  async deleteGiftEvent(householdId: string, id: string) {
    const existing = await prisma.giftEvent.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift event");
    await prisma.giftYearRecord.deleteMany({ where: { giftEventId: id } });
    await prisma.giftEvent.delete({ where: { id } });
  },

  // ─── Gift year records ────────────────────────────────────────────────────

  async upsertGiftYearRecord(
    householdId: string,
    eventId: string,
    year: number,
    data: UpsertGiftYearRecordInput
  ) {
    const event = await prisma.giftEvent.findUnique({ where: { id: eventId } });
    assertOwned(event, householdId, "Gift event");
    return prisma.giftYearRecord.upsert({
      where: { giftEventId_year: { giftEventId: eventId, year } },
      create: { giftEventId: eventId, year, ...data },
      update: data,
    });
  },

  // ─── Upcoming gifts ───────────────────────────────────────────────────────

  async getUpcomingGifts(householdId: string, year: number, now: Date = new Date()) {
    const events = await prisma.giftEvent.findMany({
      where: { householdId },
      include: {
        giftPerson: true,
        yearRecords: { where: { year } },
      },
    });

    const withDates = events
      .map((event) => {
        const nextDate = nextEventDate(event, year);
        const yearRecord = event.yearRecords[0] ?? null;
        return {
          ...event,
          nextDate,
          yearRecord,
          done: nextDate ? nextDate < now : false,
        };
      })
      .filter((e) => e.nextDate !== null)
      .sort((a, b) => (a.nextDate!.getTime() > b.nextDate!.getTime() ? 1 : -1));

    return withDates;
  },
};
