import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";
import type {
  CreateGiftPersonInput,
  UpdateGiftPersonInput,
  CreateGiftEventInput,
  UpdateGiftEventInput,
  UpsertGiftAllocationInput,
} from "@finplan/shared";

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

export const giftsService = {
  async getOrCreateSettings(householdId: string) {
    const existing = await prisma.giftPlannerSettings.findUnique({
      where: { householdId },
    });
    if (existing) return existing;
    return prisma.giftPlannerSettings.create({
      data: { householdId, mode: "synced" },
    });
  },

  // ─── People ─────────────────────────────────────────────────────────────────
  async listPeople(householdId: string) {
    return prisma.giftPerson.findMany({
      where: { householdId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  async createPerson(householdId: string, data: CreateGiftPersonInput) {
    try {
      return await prisma.giftPerson.create({ data: { householdId, ...data } });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift person with that name already exists");
      }
      throw err;
    }
  },

  async updatePerson(householdId: string, id: string, data: UpdateGiftPersonInput) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    try {
      return await prisma.giftPerson.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift person with that name already exists");
      }
      throw err;
    }
  },

  async deletePerson(householdId: string, id: string) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    await prisma.giftPerson.delete({ where: { id } });
  },

  // ─── Events ─────────────────────────────────────────────────────────────────
  async listEvents(householdId: string) {
    return prisma.giftEvent.findMany({
      where: { householdId },
      orderBy: [{ isLocked: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
  },

  async createEvent(householdId: string, data: CreateGiftEventInput) {
    const payload: any = {
      householdId,
      name: data.name,
      dateType: data.dateType,
      isLocked: false,
    };
    if (data.dateType === "shared") {
      payload.dateMonth = data.dateMonth;
      payload.dateDay = data.dateDay;
    }
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
    try {
      return await prisma.giftEvent.create({ data: payload });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift event with that name already exists");
      }
      throw err;
    }
  },

  async updateEvent(householdId: string, id: string, data: UpdateGiftEventInput) {
    const existing = await prisma.giftEvent.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift event");
    if (existing!.isLocked && data.name !== undefined) {
      throw new ValidationError("Locked events cannot be renamed");
    }
    try {
      return await prisma.giftEvent.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift event with that name already exists");
      }
      throw err;
    }
  },

  async deleteEvent(householdId: string, id: string) {
    const existing = await prisma.giftEvent.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift event");
    if (existing!.isLocked) {
      throw new ValidationError("Locked events cannot be deleted");
    }
    await prisma.giftEvent.delete({ where: { id } });
  },

  // ─── Locked event seeding ───────────────────────────────────────────────────
  async seedLockedEventsIfMissing(householdId: string) {
    const seeds = [
      {
        name: "Birthday",
        dateType: "personal" as const,
        dateMonth: null,
        dateDay: null,
        sortOrder: 0,
      },
      {
        name: "Wedding Anniversary",
        dateType: "personal" as const,
        dateMonth: null,
        dateDay: null,
        sortOrder: 1,
      },
      {
        name: "Valentine's Day",
        dateType: "shared" as const,
        dateMonth: 2,
        dateDay: 14,
        sortOrder: 2,
      },
      {
        name: "Mother's Day",
        dateType: "shared" as const,
        dateMonth: 3,
        dateDay: 15,
        sortOrder: 3,
      },
      { name: "Easter", dateType: "shared" as const, dateMonth: 4, dateDay: 10, sortOrder: 4 },
      {
        name: "Father's Day",
        dateType: "shared" as const,
        dateMonth: 6,
        dateDay: 15,
        sortOrder: 5,
      },
      { name: "Christmas", dateType: "shared" as const, dateMonth: 12, dateDay: 25, sortOrder: 6 },
    ];
    await prisma.giftEvent.createMany({
      data: seeds.map((s) => ({ ...s, householdId, isLocked: true })),
      skipDuplicates: true,
    });
  },

  // ─── Allocations ────────────────────────────────────────────────────────────
  _resolveStatus(input: UpsertGiftAllocationInput): "planned" | "bought" | "skipped" | undefined {
    if (input.status === "skipped") return "skipped";
    if (input.spent === null) return "planned";
    if (input.spent !== undefined) return "bought";
    return input.status;
  },

  _assertCurrentYear(year: number) {
    if (year < new Date().getFullYear()) {
      throw new ValidationError("Prior years are read-only");
    }
  },

  async upsertAllocation(
    householdId: string,
    personId: string,
    eventId: string,
    year: number,
    input: UpsertGiftAllocationInput
  ) {
    this._assertCurrentYear(year);
    const person = await prisma.giftPerson.findUnique({ where: { id: personId } });
    assertOwned(person, householdId, "Gift person");
    const event = await prisma.giftEvent.findUnique({ where: { id: eventId } });
    assertOwned(event, householdId, "Gift event");

    const status = this._resolveStatus(input);
    const writable: Record<string, unknown> = {};
    if (input.planned !== undefined) writable.planned = input.planned;
    if (input.spent !== undefined) writable.spent = input.spent;
    if (input.notes !== undefined) writable.notes = input.notes;
    if (input.dateMonth !== undefined) writable.dateMonth = input.dateMonth;
    if (input.dateDay !== undefined) writable.dateDay = input.dateDay;
    if (status !== undefined) writable.status = status;

    return prisma.giftAllocation.upsert({
      where: {
        giftPersonId_giftEventId_year: {
          giftPersonId: personId,
          giftEventId: eventId,
          year,
        },
      },
      create: {
        householdId,
        giftPersonId: personId,
        giftEventId: eventId,
        year,
        planned: input.planned ?? 0,
        spent: input.spent ?? null,
        status: status ?? "planned",
        notes: input.notes ?? null,
        dateMonth: input.dateMonth ?? null,
        dateDay: input.dateDay ?? null,
      },
      update: writable,
    });
  },
};
