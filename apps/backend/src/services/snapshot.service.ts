import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, AuthorizationError } from "../utils/errors.js";
import { waterfallService } from "./waterfall.service.js";
import { toGBP } from "@finplan/shared";
import type { CreateSnapshotInput, RenameSnapshotInput, FinancialSummary } from "@finplan/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildNetWorthSeries(
  accountIds: string[]
): Promise<Array<{ date: string; value: number }>> {
  if (accountIds.length === 0) return [];
  const history = await prisma.wealthAccountHistory.findMany({
    where: { wealthAccountId: { in: accountIds } },
    orderBy: { valuationDate: "asc" },
    select: { wealthAccountId: true, balance: true, valuationDate: true },
  });

  const accountBalances = new Map<string, number>();
  const dateMap = new Map<string, number>();

  for (const entry of history) {
    accountBalances.set(entry.wealthAccountId, entry.balance);
    const dateKey = entry.valuationDate.toISOString().slice(0, 10);
    const total = Array.from(accountBalances.values()).reduce((s, v) => s + v, 0);
    dateMap.set(dateKey, total);
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function buildTierSeries(snapshots: Array<{ data: unknown; createdAt: Date }>) {
  type Point = { date: string; value: number };
  const income: Point[] = [];
  const committed: Point[] = [];
  const discretionary: Point[] = [];
  const surplus: Point[] = [];

  for (const snap of snapshots) {
    const d = snap.data as Record<string, any>;
    const date = snap.createdAt.toISOString().slice(0, 10);
    if (d?.income?.total !== undefined) income.push({ date, value: d.income.total as number });
    if (d?.committed !== undefined) {
      const ct =
        ((d.committed.monthlyTotal as number) ?? 0) + ((d.committed.monthlyAvg12 as number) ?? 0);
      committed.push({ date, value: ct });
    }
    if (d?.discretionary?.total !== undefined)
      discretionary.push({ date, value: d.discretionary.total as number });
    if (d?.surplus?.amount !== undefined) surplus.push({ date, value: d.surplus.amount as number });
  }

  return { income, committed, discretionary, surplus };
}

// ─── Service ──────────────────────────────────────────────────────────────────

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
    if (snapshot.isAuto) {
      throw new AuthorizationError("Auto-snapshots cannot be renamed");
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
    if (snapshot.isAuto) {
      throw new AuthorizationError("Auto-snapshots cannot be deleted");
    }
    await prisma.snapshot.delete({ where: { id } });
  },

  async ensureJan1Snapshot(householdId: string, now: Date = new Date()) {
    const today = now;
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

  async ensureTodayAutoSnapshot(householdId: string, now: Date = new Date()) {
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const name = `auto:${dateKey}`;
    const data = await waterfallService.getWaterfallSummary(householdId);
    await prisma.snapshot.upsert({
      where: { householdId_name: { householdId, name } },
      create: { householdId, name, isAuto: true, data: data as object },
      update: { data: data as object },
    });
  },

  async getFinancialSummary(householdId: string): Promise<FinancialSummary> {
    const [summary, autoSnapshots, wealthAccountCount] = await Promise.all([
      waterfallService.getWaterfallSummary(householdId),
      prisma.snapshot.findMany({
        where: { householdId, isAuto: true },
        orderBy: { createdAt: "asc" },
        select: { data: true, createdAt: true },
      }),
      prisma.wealthAccount.count({ where: { householdId, isTrust: false } }),
    ]);

    let netWorth: number | null = null;
    let netWorthSeries: Array<{ date: string; value: number }> = [];

    if (wealthAccountCount > 0) {
      const accounts = await prisma.wealthAccount.findMany({
        where: { householdId, isTrust: false },
        select: { id: true, balance: true },
      });
      netWorth = toGBP(accounts.reduce((s, a) => s + a.balance, 0));
      netWorthSeries = await buildNetWorthSeries(accounts.map((a) => a.id));
    }

    const tierSeries = buildTierSeries(autoSnapshots);

    return {
      current: {
        netWorth,
        income: summary.income.total,
        committed: toGBP(summary.committed.monthlyTotal + summary.committed.monthlyAvg12),
        discretionary: summary.discretionary.total,
        surplus: summary.surplus.amount,
      },
      sparklines: {
        netWorth: netWorthSeries,
        income: tierSeries.income,
        committed: tierSeries.committed,
        discretionary: tierSeries.discretionary,
        surplus: tierSeries.surplus,
      },
    };
  },
};
