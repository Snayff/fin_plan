import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { waterfallService } from "./waterfall.service.js";
import type { CreateSnapshotInput, RenameSnapshotInput } from "@finplan/shared";

export const snapshotService = {
  async listSnapshots(householdId: string) {
    return prisma.snapshot.findMany({
      where: { householdId },
      select: { id: true, name: true, isAuto: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getSnapshot(householdId: string, id: string) {
    const snapshot = await prisma.snapshot.findUnique({ where: { id } });
    if (!snapshot || snapshot.householdId !== householdId) {
      throw new NotFoundError("Snapshot not found");
    }
    return snapshot;
  },

  async createSnapshot(householdId: string, input: CreateSnapshotInput) {
    const data = await waterfallService.getWaterfallSummary(householdId);
    try {
      return await prisma.snapshot.create({
        data: {
          householdId,
          name: input.name,
          isAuto: input.isAuto ?? false,
          data: data as object,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A snapshot with that name already exists");
      }
      throw err;
    }
  },

  async renameSnapshot(householdId: string, id: string, input: RenameSnapshotInput) {
    const snapshot = await prisma.snapshot.findUnique({ where: { id } });
    if (!snapshot || snapshot.householdId !== householdId) {
      throw new NotFoundError("Snapshot not found");
    }
    try {
      return await prisma.snapshot.update({ where: { id }, data: { name: input.name } });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A snapshot with that name already exists");
      }
      throw err;
    }
  },

  async deleteSnapshot(householdId: string, id: string) {
    const snapshot = await prisma.snapshot.findUnique({ where: { id } });
    if (!snapshot || snapshot.householdId !== householdId) {
      throw new NotFoundError("Snapshot not found");
    }
    await prisma.snapshot.delete({ where: { id } });
  },

  async ensureJan1Snapshot(householdId: string) {
    const today = new Date();
    if (today.getMonth() !== 0 || today.getDate() !== 1) return;

    const year = today.getFullYear();
    const autoName = `January ${year} — Auto`;
    const exists = await prisma.snapshot.findUnique({
      where: { householdId_name: { householdId, name: autoName } },
    });
    if (!exists) {
      await snapshotService.createSnapshot(householdId, { name: autoName, isAuto: true });
    }
  },
};
