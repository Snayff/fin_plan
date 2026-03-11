import { prisma } from '../config/database';
import { LiabilityType, InterestType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

const liabilityLinkedAssetSelect = {
  id: true,
  name: true,
  type: true,
  currentValue: true,
} as const;

function serializeLinkedAsset(linkedAsset: {
  id: string;
  name: string;
  type: LiabilitySummaryAsset['type'];
  currentValue: number | { toString(): string };
} | null) {
  if (!linkedAsset) {
    return null;
  }

  return {
    id: linkedAsset.id,
    name: linkedAsset.name,
    type: linkedAsset.type,
    currentValue: Number(linkedAsset.currentValue),
  };
}

type LiabilitySummaryAsset = {
  id: string;
  name: string;
  type: 'housing' | 'investment' | 'vehicle' | 'business' | 'personal_property' | 'crypto';
  currentValue: number;
};

export interface CreateLiabilityInput {
  name: string;
  type: LiabilityType;
  currentBalance: number;
  interestRate: number;
  interestType: InterestType;
  openDate: string | Date;
  termEndDate: string | Date;
  linkedAssetId?: string | null;
  metadata?: {
    lender?: string;
    notes?: string;
  };
}

export interface UpdateLiabilityInput {
  name?: string;
  type?: LiabilityType;
  currentBalance?: number;
  interestRate?: number;
  interestType?: InterestType;
  openDate?: string | Date;
  termEndDate?: string | Date;
  linkedAssetId?: string | null;
  metadata?: Record<string, any>;
}

type LiabilityForecastPoint = {
  date: string;
  balance: number;
  accruedInterest: number;
  paymentApplied: number;
  interestPaid: number;
  principalPaid: number;
};

function daysBetween(from: Date, to: Date) {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

async function validateLinkedAsset(
  householdId: string,
  linkedAssetId: string | null | undefined,
  currentLiabilityId?: string
) {
  if (linkedAssetId === undefined) {
    return undefined;
  }

  if (linkedAssetId === null) {
    return null;
  }

  const asset = await prisma.asset.findFirst({
    where: { id: linkedAssetId, householdId },
  });

  if (!asset) {
    throw new NotFoundError('Linked asset not found');
  }

  const existingLink = await prisma.liability.findFirst({
    where: {
      householdId,
      linkedAssetId,
      ...(currentLiabilityId ? { id: { not: currentLiabilityId } } : {}),
    },
    select: { id: true, name: true },
  });

  if (existingLink) {
    throw new ValidationError(`Asset is already linked to liability "${existingLink.name}"`);
  }

  return linkedAssetId;
}

function serializeLiability<T extends {
  currentBalance: number | { toString(): string };
  interestRate: number | { toString(): string };
  linkedAsset?: {
    id: string;
    name: string;
    type: LiabilitySummaryAsset['type'];
    currentValue: number | { toString(): string };
  } | null;
}>(liability: T) {
  return {
    ...liability,
    currentBalance: Number(liability.currentBalance),
    interestRate: Number(liability.interestRate),
    linkedAsset: serializeLinkedAsset(liability.linkedAsset ?? null),
  };
}

function simulateProjection(
  currentBalance: number,
  annualRate: number,
  startDate: Date,
  termEndDate: Date,
  payments: Array<{ date: Date; amount: number }>
) {
  let principal = currentBalance;
  let accruedInterest = 0;
  let totalInterestAccrued = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let totalPaymentApplied = 0;
  let cursor = new Date(startDate);

  const points: LiabilityForecastPoint[] = [
    {
      date: cursor.toISOString(),
      balance: round2(principal),
      accruedInterest: 0,
      paymentApplied: 0,
      interestPaid: 0,
      principalPaid: 0,
    },
  ];

  const dailyRate = annualRate / 100 / 365;
  const paymentEvents = payments
    .filter((p) => p.amount > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((p) => p.date.getTime() >= startDate.getTime() && p.date.getTime() <= termEndDate.getTime());

  for (const payment of paymentEvents) {
    const paymentDate = payment.date;
    const days = daysBetween(cursor, paymentDate);
    if (days > 0 && principal > 0) {
      const accrued = principal * dailyRate * days;
      accruedInterest += accrued;
      totalInterestAccrued += accrued;
    }

    let remainingPayment = payment.amount;
    const paidToInterest = Math.min(remainingPayment, accruedInterest);
    accruedInterest -= paidToInterest;
    remainingPayment -= paidToInterest;
    totalInterestPaid += paidToInterest;

    const paidToPrincipal = Math.min(remainingPayment, principal);
    principal -= paidToPrincipal;
    totalPrincipalPaid += paidToPrincipal;

    const applied = paidToInterest + paidToPrincipal;
    totalPaymentApplied += applied;

    cursor = paymentDate;

    points.push({
      date: cursor.toISOString(),
      balance: round2(principal),
      accruedInterest: round2(accruedInterest),
      paymentApplied: round2(applied),
      interestPaid: round2(paidToInterest),
      principalPaid: round2(paidToPrincipal),
    });
  }

  const finalDays = daysBetween(cursor, termEndDate);
  if (finalDays > 0 && principal > 0) {
    const accrued = principal * dailyRate * finalDays;
    accruedInterest += accrued;
    totalInterestAccrued += accrued;
  }

  const projectedBalanceAtTermEnd = principal + accruedInterest;

  points.push({
    date: termEndDate.toISOString(),
    balance: round2(projectedBalanceAtTermEnd),
    accruedInterest: round2(accruedInterest),
    paymentApplied: 0,
    interestPaid: 0,
    principalPaid: 0,
  });

  return {
    projectedBalanceAtTermEnd: round2(projectedBalanceAtTermEnd),
    projectedInterestAccrued: round2(totalInterestAccrued),
    projectedTransactionImpact: round2(totalPaymentApplied),
    totalInterestPaid: round2(totalInterestPaid),
    totalPrincipalPaid: round2(totalPrincipalPaid),
    schedule: points,
  };
}

export const liabilityService = {
  async createLiability(householdId: string, data: CreateLiabilityInput) {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Liability name is required');
    }

    if (data.currentBalance < 0) {
      throw new ValidationError('Current balance must be non-negative');
    }

    const openDate = new Date(data.openDate);
    const termEndDate = new Date(data.termEndDate);

    if (termEndDate.getTime() < openDate.getTime()) {
      throw new ValidationError('Term end date must be on or after open date');
    }

    const linkedAssetId = await validateLinkedAsset(householdId, data.linkedAssetId);

    const liability = await prisma.liability.create({
      data: {
        householdId,
        name: data.name.trim(),
        linkedAssetId: linkedAssetId ?? null,
        type: data.type,
        currentBalance: data.currentBalance,
        interestRate: data.interestRate,
        interestType: data.interestType,
        openDate,
        termEndDate,
        metadata: data.metadata || {},
      },
      include: {
        linkedAsset: {
          select: liabilityLinkedAssetSelect,
        },
      },
    });

    return serializeLiability(liability);
  },

  async getLiabilityById(liabilityId: string, householdId: string) {
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, householdId },
      include: {
        linkedAsset: {
          select: liabilityLinkedAssetSelect,
        },
      },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    return serializeLiability(liability);
  },

  async getUserLiabilities(householdId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { householdId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        linkedAsset: {
          select: liabilityLinkedAssetSelect,
        },
      },
    });

    return liabilities.map((liability) => serializeLiability(liability));
  },

  async getUserLiabilitiesWithForecast(householdId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { householdId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        linkedAsset: {
          select: liabilityLinkedAssetSelect,
        },
        transactions: {
          where: { type: 'expense' },
          select: {
            id: true,
            date: true,
            amount: true,
            name: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    return liabilities.map((liability) => {
      const currentBalance = Number(liability.currentBalance);
      const interestRate = Number(liability.interestRate);
      const now = new Date();
      const termEndDate = new Date(liability.termEndDate);

      const projection = simulateProjection(
        currentBalance,
        interestRate,
        now,
        termEndDate,
        liability.transactions.map((t) => ({ date: new Date(t.date), amount: Number(t.amount) }))
      );

      const monthsRemaining = Math.max(
        0,
        Math.ceil((termEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
      );

      return {
        ...serializeLiability(liability),
        currentBalance,
        interestRate,
        transactions: liability.transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
        monthsRemaining,
        projectedBalanceAtTermEnd: projection.projectedBalanceAtTermEnd,
        projectedInterestAccrued: projection.projectedInterestAccrued,
        projectedTransactionImpact: projection.projectedTransactionImpact,
        projectionSchedule: projection.schedule,
      };
    });
  },

  async updateLiability(liabilityId: string, householdId: string, data: UpdateLiabilityInput) {
    const existingLiability = await prisma.liability.findFirst({
      where: { id: liabilityId, householdId },
    });

    if (!existingLiability) {
      throw new NotFoundError('Liability not found');
    }

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Liability name cannot be empty');
    }

    const openDate = data.openDate ? new Date(data.openDate) : existingLiability.openDate;
    const termEndDate = data.termEndDate ? new Date(data.termEndDate) : existingLiability.termEndDate;

    if (termEndDate.getTime() < openDate.getTime()) {
      throw new ValidationError('Term end date must be on or after open date');
    }

    const linkedAssetId = await validateLinkedAsset(
      householdId,
      data.linkedAssetId,
      liabilityId
    );

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currentBalance !== undefined) updateData.currentBalance = data.currentBalance;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.interestType !== undefined) updateData.interestType = data.interestType;
    if (data.openDate !== undefined) updateData.openDate = new Date(data.openDate);
    if (data.termEndDate !== undefined) updateData.termEndDate = new Date(data.termEndDate);
    if (linkedAssetId !== undefined) updateData.linkedAssetId = linkedAssetId;

    if (data.metadata !== undefined) {
      const existingMeta = (existingLiability.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    const liability = await prisma.liability.update({
      where: { id: liabilityId },
      data: updateData,
      include: {
        linkedAsset: {
          select: liabilityLinkedAssetSelect,
        },
      },
    });

    return serializeLiability(liability);
  },

  async deleteLiability(liabilityId: string, householdId: string) {
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, householdId },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    await prisma.liability.delete({
      where: { id: liabilityId },
    });

    return { message: 'Liability deleted successfully' };
  },

  async calculateLiabilityProjection(liabilityId: string, householdId: string) {
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, householdId },
      include: {
        transactions: {
          where: { type: 'expense' },
          select: { id: true, date: true, amount: true, name: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    const now = new Date();
    const projection = simulateProjection(
      Number(liability.currentBalance),
      Number(liability.interestRate),
      now,
      new Date(liability.termEndDate),
      liability.transactions.map((t) => ({ date: new Date(t.date), amount: Number(t.amount) }))
    );

    return {
      liabilityId,
      currentBalance: Number(liability.currentBalance),
      interestRate: Number(liability.interestRate),
      openDate: liability.openDate.toISOString(),
      termEndDate: liability.termEndDate.toISOString(),
      monthsRemaining: Math.max(
        0,
        Math.ceil((new Date(liability.termEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
      ),
      projectedBalanceAtTermEnd: projection.projectedBalanceAtTermEnd,
      projectedInterestAccrued: projection.projectedInterestAccrued,
      projectedTransactionImpact: projection.projectedTransactionImpact,
      totalInterestPaidByTransactions: projection.totalInterestPaid,
      totalPrincipalPaidByTransactions: projection.totalPrincipalPaid,
      schedule: projection.schedule,
    };
  },

  async getLiabilitySummary(householdId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { householdId },
    });

    if (liabilities.length === 0) {
      return {
        totalDebt: 0,
        byType: [],
        totalInterestRate: 0,
      };
    }

    let totalDebt = 0;
    let weightedInterestSum = 0;

    const byTypeMap = new Map<LiabilityType, { balance: number; count: number }>();

    liabilities.forEach((liability) => {
      const balance = Number(liability.currentBalance);
      const rate = Number(liability.interestRate);

      totalDebt += balance;
      weightedInterestSum += balance * rate;

      const existing = byTypeMap.get(liability.type) || { balance: 0, count: 0 };
      byTypeMap.set(liability.type, {
        balance: existing.balance + balance,
        count: existing.count + 1,
      });
    });

    const totalInterestRate = totalDebt > 0 ? weightedInterestSum / totalDebt : 0;

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      balance: data.balance,
      count: data.count,
    }));

    return {
      totalDebt,
      byType,
      totalInterestRate,
    };
  },

  async calculateTotalLiabilityValue(householdId: string, asOfDate: Date = new Date()) {
    const liabilities = await prisma.liability.findMany({
      where: {
        householdId,
        createdAt: { lte: asOfDate },
      },
    });

    return liabilities.reduce((sum, liability) => sum + Number(liability.currentBalance), 0);
  },
};
