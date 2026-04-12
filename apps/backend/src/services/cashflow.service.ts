import { prisma } from "../config/database.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { audited, computeDiff } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import { findEffectivePeriod } from "./period.service.js";
import type {
  LinkableAccountRow,
  BulkUpdateLinkedAccountsInput,
  CashflowProjection,
  CashflowMonthDetail,
} from "@finplan/shared";

const LINKABLE_TYPES = ["Current", "Savings"] as const;
const MAX_PROJECTION_MONTHS = 24;

function toLinkableRow(account: {
  id: string;
  name: string;
  type: string;
  isCashflowLinked: boolean;
}): Omit<LinkableAccountRow, "latestBalance" | "latestBalanceDate"> {
  return {
    id: account.id,
    name: account.name,
    type: account.type as "Current" | "Savings",
    isCashflowLinked: account.isCashflowLinked,
  };
}

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ProjectionEvent {
  date: Date;
  amount: number; // signed
  itemType: "income_source" | "committed_item" | "discretionary_item";
  label: string;
}

interface ProjectionInput {
  startYear?: number;
  startMonth?: number;
  monthCount: number;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function startOfMonth(y: number, m: number): Date {
  return new Date(Date.UTC(y, m - 1, 1));
}

function periodActiveOn(periods: Array<any>, date: Date): number {
  const eff = findEffectivePeriod(periods, date);
  return eff?.amount ?? 0;
}

function buildEvents(
  from: Date,
  to: Date,
  income: Array<any>,
  committed: Array<any>,
  discretionary: Array<any>,
  periodsByKey: Map<string, any[]>
): ProjectionEvent[] {
  const events: ProjectionEvent[] = [];

  function expandRecurring(
    item: any,
    itemType: "income_source" | "committed_item",
    sign: 1 | -1,
    frequencyKey: "monthly" | "annual" | "yearly" | "one_off"
  ) {
    const periods = periodsByKey.get(`${itemType}:${item.id}`) ?? [];
    const due: Date = item.dueDate;
    if (frequencyKey === "monthly") {
      const day = due.getUTCDate();
      const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day));
      while (cursor < to) {
        if (cursor >= from) {
          const amount = periodActiveOn(periods, cursor);
          if (amount > 0)
            events.push({
              date: new Date(cursor),
              amount: sign * amount,
              itemType,
              label: item.name,
            });
        }
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    } else if (frequencyKey === "annual" || frequencyKey === "yearly") {
      const month = due.getUTCMonth();
      const day = due.getUTCDate();
      // Anchor at the later of (visible window start year, item's first occurrence year)
      // so a future-dated annual bill never emits phantom past occurrences.
      let year = Math.max(from.getUTCFullYear(), due.getUTCFullYear());
      while (true) {
        const occ = new Date(Date.UTC(year, month, day));
        if (occ >= to) break;
        if (occ >= from && occ >= due) {
          const amount = periodActiveOn(periods, occ);
          if (amount > 0)
            events.push({ date: occ, amount: sign * amount, itemType, label: item.name });
        }
        year++;
      }
    } else {
      // one_off
      if (due >= from && due < to) {
        const amount = periodActiveOn(periods, due);
        if (amount > 0)
          events.push({ date: due, amount: sign * amount, itemType, label: item.name });
      }
    }
  }

  for (const i of income) expandRecurring(i, "income_source", 1, i.frequency);
  for (const c of committed) expandRecurring(c, "committed_item", -1, c.spendType);

  for (const d of discretionary) {
    if (d.spendType !== "one_off" || !d.dueDate) continue;
    if (d.dueDate >= from && d.dueDate < to) {
      const periods = periodsByKey.get(`discretionary_item:${d.id}`) ?? [];
      const amount = periodActiveOn(periods, d.dueDate);
      if (amount > 0)
        events.push({
          date: d.dueDate,
          amount: -amount,
          itemType: "discretionary_item",
          label: d.name,
        });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

function computeMonthlyDiscretionaryBaseline(
  discretionary: Array<any>,
  periodsByKey: Map<string, any[]>,
  refDate: Date
): number {
  let total = 0;
  for (const d of discretionary) {
    if (d.spendType === "one_off") continue;
    const periods = periodsByKey.get(`discretionary_item:${d.id}`) ?? [];
    const amount = periodActiveOn(periods, refDate);
    if (d.spendType === "monthly") total += amount;
    else if (d.spendType === "yearly") total += amount / 12;
  }
  return total;
}

async function loadPlanContext(householdId: string) {
  const [income, committed, discretionary] = await Promise.all([
    prisma.incomeSource.findMany({ where: { householdId } }),
    prisma.committedItem.findMany({ where: { householdId } }),
    prisma.discretionaryItem.findMany({ where: { householdId } }),
  ]);
  const allRefs = [
    ...income.map((i) => ({ type: "income_source", id: i.id })),
    ...committed.map((c) => ({ type: "committed_item", id: c.id })),
    ...discretionary.map((d) => ({ type: "discretionary_item", id: d.id })),
  ];
  const periods =
    allRefs.length > 0
      ? await prisma.itemAmountPeriod.findMany({
          where: { OR: allRefs.map((r) => ({ itemType: r.type as any, itemId: r.id })) },
          orderBy: { startDate: "asc" },
        })
      : [];
  const periodsByKey = new Map<string, any[]>();
  for (const p of periods) {
    const k = `${p.itemType}:${p.itemId}`;
    const arr = periodsByKey.get(k) ?? [];
    arr.push(p);
    periodsByKey.set(k, arr);
  }
  return { income, committed, discretionary, periodsByKey };
}

export const cashflowService = {
  async listLinkableAccounts(householdId: string): Promise<LinkableAccountRow[]> {
    const accounts = await prisma.account.findMany({
      where: { householdId, type: { in: ["Current", "Savings"] } },
      include: {
        balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 1 },
      },
      orderBy: { name: "asc" },
    });

    return accounts.map((a) => {
      const latest = a.balances[0] ?? null;
      return {
        id: a.id,
        name: a.name,
        type: a.type as "Current" | "Savings",
        isCashflowLinked: a.isCashflowLinked,
        latestBalance: latest?.value ?? null,
        latestBalanceDate: latest ? toIsoDate(latest.date) : null,
      };
    });
  },

  async updateAccountCashflowLink(
    householdId: string,
    accountId: string,
    isCashflowLinked: boolean,
    ctx: ActorCtx
  ): Promise<Omit<LinkableAccountRow, "latestBalance" | "latestBalanceDate">> {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.householdId !== householdId) {
      throw new NotFoundError("Account not found");
    }
    if (!LINKABLE_TYPES.includes(account.type as (typeof LINKABLE_TYPES)[number])) {
      throw new ValidationError("Only Current and Savings accounts can be linked to Cashflow");
    }

    const updated = await audited({
      db: prisma,
      ctx,
      action: "UPDATE_ACCOUNT_CASHFLOW_LINK",
      resource: "account",
      resourceId: accountId,
      beforeFetch: async (tx) =>
        tx.account.findUnique({
          where: { id: accountId },
          select: { isCashflowLinked: true },
        }) as Promise<Record<string, unknown> | null>,
      mutation: async (tx) =>
        tx.account.update({
          where: { id: accountId },
          data: { isCashflowLinked },
        }),
    });

    return toLinkableRow(updated);
  },

  async bulkUpdateLinkedAccounts(
    householdId: string,
    input: BulkUpdateLinkedAccountsInput,
    ctx: ActorCtx
  ): Promise<Array<Omit<LinkableAccountRow, "latestBalance" | "latestBalanceDate">>> {
    const ids = input.updates.map((u) => u.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: ids }, householdId },
    });

    if (accounts.length !== ids.length) {
      throw new NotFoundError("One or more accounts not found");
    }
    for (const acc of accounts) {
      if (!LINKABLE_TYPES.includes(acc.type as (typeof LINKABLE_TYPES)[number])) {
        throw new ValidationError("One or more accounts cannot be linked to Cashflow");
      }
    }

    return prisma.$transaction(async (tx) => {
      const results: Array<Omit<LinkableAccountRow, "latestBalance" | "latestBalanceDate">> = [];
      for (const update of input.updates) {
        const beforeState = (await tx.account.findUnique({
          where: { id: update.accountId },
          select: { isCashflowLinked: true },
        })) as Record<string, unknown> | null;

        const updated = await tx.account.update({
          where: { id: update.accountId },
          data: { isCashflowLinked: update.isCashflowLinked },
        });

        const changes = computeDiff(beforeState, {
          isCashflowLinked: updated.isCashflowLinked,
        });

        await (tx as any).auditLog.create({
          data: {
            householdId,
            actorId: ctx.actorId,
            actorName: ctx.actorName,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
            action: "UPDATE_ACCOUNT_CASHFLOW_LINK",
            resource: "account",
            resourceId: update.accountId,
            changes,
          },
        });

        results.push(toLinkableRow(updated));
      }
      return results;
    });
  },

  async getProjection(householdId: string, input: ProjectionInput): Promise<CashflowProjection> {
    const linked = await prisma.account.findMany({
      where: { householdId, isCashflowLinked: true, type: { in: ["Current", "Savings"] } },
      include: {
        balances: { orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 1 },
      },
    });
    const latestBalances = linked
      .map((a) => a.balances[0])
      .filter((b): b is NonNullable<typeof b> => b != null);
    const startingBalance = latestBalances.reduce((s, b) => s + b.value, 0);

    const youngest =
      latestBalances.length > 0 ? latestBalances.reduce((y, b) => (b.date > y.date ? b : y)) : null;
    const oldest =
      latestBalances.length > 0 ? latestBalances.reduce((o, b) => (b.date < o.date ? b : o)) : null;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const anchor = youngest?.date ?? today;

    const { income, committed, discretionary, periodsByKey } = await loadPlanContext(householdId);

    const startYear = input.startYear ?? today.getUTCFullYear();
    const startMonth = input.startMonth ?? today.getUTCMonth() + 1;
    const monthCount = input.monthCount;

    // Replay anchor → start of visible window so month 1 always opens at the
    // start-of-month balance. Two symmetric branches:
    //   - anchor < window start: walk forward, applying events.
    //   - anchor > window start: walk backward, inverting events. The user
    //     just updated their balance mid-month, and we need to derive the
    //     hypothetical 1st-of-month figure so the current month renders
    //     identically to every other month.
    const visibleWindowStart = startOfMonth(startYear, startMonth);
    let balance = startingBalance;
    if (anchor < visibleWindowStart) {
      const replayEvents = buildEvents(
        anchor,
        visibleWindowStart,
        income,
        committed,
        discretionary,
        periodsByKey
      );
      const cursor = new Date(anchor);
      for (const e of replayEvents) {
        while (cursor < e.date) {
          const baseline = computeMonthlyDiscretionaryBaseline(discretionary, periodsByKey, cursor);
          balance -= baseline / daysInMonth(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1);
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        balance += e.amount;
      }
      while (cursor < visibleWindowStart) {
        const baseline = computeMonthlyDiscretionaryBaseline(discretionary, periodsByKey, cursor);
        balance -= baseline / daysInMonth(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    } else if (anchor > visibleWindowStart) {
      const replayEvents = buildEvents(
        visibleWindowStart,
        anchor,
        income,
        committed,
        discretionary,
        periodsByKey
      );
      const eventsByDay = new Map<number, number>();
      for (const e of replayEvents) {
        const key = e.date.getTime();
        eventsByDay.set(key, (eventsByDay.get(key) ?? 0) + e.amount);
      }
      const cursor = new Date(anchor);
      while (cursor > visibleWindowStart) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const baseline = computeMonthlyDiscretionaryBaseline(discretionary, periodsByKey, cursor);
        balance += baseline / daysInMonth(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1);
        const evAmount = eventsByDay.get(cursor.getTime());
        if (evAmount !== undefined) {
          balance -= evAmount;
        }
      }
    }

    const months: CashflowProjection["months"] = [];
    let tightestDipValue = Infinity;
    let tightestDipDate: Date | null = null;
    let cursorYear = startYear;
    let cursorMonth = startMonth;
    let runningOpening = balance;

    for (let i = 0; i < monthCount; i++) {
      const monthStart = startOfMonth(cursorYear, cursorMonth);
      const monthEnd = new Date(Date.UTC(cursorYear, cursorMonth, 1));
      const monthEvents = buildEvents(
        monthStart,
        monthEnd,
        income,
        committed,
        discretionary,
        periodsByKey
      );

      const dailyBaseline =
        computeMonthlyDiscretionaryBaseline(discretionary, periodsByKey, monthStart) /
        daysInMonth(cursorYear, cursorMonth);

      let intra = runningOpening;
      let monthLow = intra;
      let monthLowDay = 1;
      let eIdx = 0;
      const days = daysInMonth(cursorYear, cursorMonth);
      for (let day = 1; day <= days; day++) {
        const dayDate = new Date(Date.UTC(cursorYear, cursorMonth - 1, day));
        intra -= dailyBaseline;
        while (
          eIdx < monthEvents.length &&
          monthEvents[eIdx]!.date.getTime() === dayDate.getTime()
        ) {
          intra += monthEvents[eIdx]!.amount;
          eIdx++;
        }
        if (intra < monthLow) {
          monthLow = intra;
          monthLowDay = day;
        }
        if (intra < tightestDipValue) {
          tightestDipValue = intra;
          tightestDipDate = new Date(dayDate);
        }
      }
      const closingBalance = intra;
      const netChange = closingBalance - runningOpening;
      months.push({
        year: cursorYear,
        month: cursorMonth,
        netChange,
        openingBalance: runningOpening,
        closingBalance,
        dipBelowZero: monthLow < 0,
        tightestPoint: { value: monthLow, day: monthLowDay },
      });
      runningOpening = closingBalance;
      cursorMonth++;
      if (cursorMonth > 12) {
        cursorMonth = 1;
        cursorYear++;
      }
    }

    const projectedEndBalance = months[months.length - 1]?.closingBalance ?? balance;
    const avgMonthlySurplus =
      months.length > 0 ? months.reduce((s, m) => s + m.netChange, 0) / months.length : 0;

    return {
      startingBalance: balance,
      latestKnownBalance: startingBalance,
      windowStart: { year: startYear, month: startMonth },
      months,
      projectedEndBalance,
      tightestDip: {
        value: tightestDipValue === Infinity ? balance : tightestDipValue,
        date: tightestDipDate ? toIsoDate(tightestDipDate) : toIsoDate(today),
      },
      avgMonthlySurplus,
      oldestLinkedBalanceDate: oldest ? toIsoDate(oldest.date) : null,
      youngestLinkedBalanceDate: youngest ? toIsoDate(youngest.date) : null,
      linkedAccountCount: linked.length,
    };
  },

  async getMonthDetail(
    householdId: string,
    targetYear: number,
    targetMonth: number
  ): Promise<CashflowMonthDetail> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startYear = today.getUTCFullYear();
    const startMonth = today.getUTCMonth() + 1;
    const monthOffset = (targetYear - startYear) * 12 + (targetMonth - startMonth);
    if (monthOffset < 0 || monthOffset >= MAX_PROJECTION_MONTHS) {
      throw new NotFoundError("Month is outside the projection window");
    }
    const monthCount = monthOffset + 1;

    const projection = await this.getProjection(householdId, {
      startYear,
      startMonth,
      monthCount,
    });
    const month = projection.months.find((m) => m.year === targetYear && m.month === targetMonth);
    if (!month) {
      throw new NotFoundError("Month is outside the projection window");
    }

    const { income, committed, discretionary, periodsByKey } = await loadPlanContext(householdId);

    const monthStart = startOfMonth(targetYear, targetMonth);
    const monthEnd = new Date(Date.UTC(targetYear, targetMonth, 1));
    const events = buildEvents(
      monthStart,
      monthEnd,
      income,
      committed,
      discretionary,
      periodsByKey
    );

    const monthlyDiscretionaryTotal = computeMonthlyDiscretionaryBaseline(
      discretionary,
      periodsByKey,
      monthStart
    );
    const days = daysInMonth(targetYear, targetMonth);
    const amortisedDailyDiscretionary = monthlyDiscretionaryTotal / days;

    const dailyTrace: Array<{ day: number; balance: number }> = [];
    let intra = month.openingBalance;
    let eIdx = 0;
    const eventRows: CashflowMonthDetail["events"] = [];
    for (let day = 1; day <= days; day++) {
      const dayDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
      intra -= amortisedDailyDiscretionary;
      while (eIdx < events.length && events[eIdx]!.date.getTime() === dayDate.getTime()) {
        const ev = events[eIdx]!;
        intra += ev.amount;
        eventRows.push({
          date: toIsoDate(ev.date),
          label: ev.label,
          amount: ev.amount,
          itemType: ev.itemType,
          runningBalanceAfter: intra,
        });
        eIdx++;
      }
      dailyTrace.push({ day, balance: intra });
    }

    return {
      year: targetYear,
      month: targetMonth,
      startingBalance: month.openingBalance,
      endBalance: month.closingBalance,
      netChange: month.netChange,
      tightestPoint: month.tightestPoint,
      amortisedDailyDiscretionary,
      monthlyDiscretionaryTotal,
      dailyTrace,
      events: eventRows,
    };
  },
};
