import { prisma } from '../config/database';
import { LiabilityType, InterestType, PaymentFrequency } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  calculateAmortizationSchedule,
  calculatePayoffDate,
  calculateTotalInterest,
  validateMinimumPayment,
} from '../utils/liability.utils';

export interface CreateLiabilityInput {
  name: string;
  type: LiabilityType;
  currentBalance: number;
  originalAmount: number;
  interestRate: number;
  interestType: InterestType;
  minimumPayment: number;
  paymentFrequency: PaymentFrequency;
  payoffDate?: string | Date;
  accountId?: string;
  metadata?: {
    lender?: string;
    accountNumber?: string;
    notes?: string;
  };
}

export interface UpdateLiabilityInput {
  name?: string;
  type?: LiabilityType;
  currentBalance?: number;
  originalAmount?: number;
  interestRate?: number;
  interestType?: InterestType;
  minimumPayment?: number;
  paymentFrequency?: PaymentFrequency;
  payoffDate?: string | Date;
  metadata?: Record<string, any>;
}

export const liabilityService = {
  /**
   * Create a new liability
   */
  async createLiability(userId: string, data: CreateLiabilityInput) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Liability name is required');
    }

    if (data.currentBalance < 0) {
      throw new ValidationError('Current balance must be non-negative');
    }

    if (data.minimumPayment < 0) {
      throw new ValidationError('Minimum payment must be non-negative');
    }

    // Validate minimum payment is sufficient
    const validation = validateMinimumPayment(data.currentBalance, data.interestRate, data.minimumPayment);
    if (!validation.isValid) {
      throw new ValidationError(validation.message || 'Invalid minimum payment');
    }

    // If accountId provided, verify it exists and belongs to user
    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, userId },
      });
      if (!account) {
        throw new NotFoundError('Account not found');
      }
    }

    // Calculate payoff date if not provided
    let calculatedPayoffDate = data.payoffDate ? new Date(data.payoffDate) : null;
    if (!calculatedPayoffDate && data.currentBalance > 0 && data.minimumPayment > 0) {
      calculatedPayoffDate = calculatePayoffDate(data.currentBalance, data.interestRate, data.minimumPayment);
    }

    const liability = await prisma.liability.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type,
        currentBalance: data.currentBalance,
        originalAmount: data.originalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        minimumPayment: data.minimumPayment,
        paymentFrequency: data.paymentFrequency,
        payoffDate: calculatedPayoffDate,
        accountId: data.accountId,
        metadata: data.metadata || {},
      },
    });

    return liability;
  },

  /**
   * Get a single liability by ID with ownership check
   */
  async getLiabilityById(liabilityId: string, userId: string) {
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, userId },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    return liability;
  },

  /**
   * Get all liabilities for a user
   */
  async getUserLiabilities(userId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return liabilities;
  },

  /**
   * Get all liabilities for a user with enhanced data:
   * - Payment history
   * - Total paid, total interest paid
   * - Projected payoff date
   */
  async getUserLiabilitiesWithPayments(userId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        payments: {
          orderBy: { date: 'desc' },
          include: {
            transaction: {
              select: {
                id: true,
                date: true,
                amount: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Enrich with calculated data
    const enhancedLiabilities = liabilities.map(liability => {
      const totalPaid = liability.payments.reduce(
        (sum, p) => sum + Number(p.principalAmount) + Number(p.interestAmount),
        0
      );
      const totalInterestPaid = liability.payments.reduce((sum, p) => sum + Number(p.interestAmount), 0);

      // Calculate projected payoff date if not set
      let projectedPayoffDate = liability.payoffDate?.toISOString() || null;
      if (!projectedPayoffDate && Number(liability.currentBalance) > 0 && Number(liability.minimumPayment) > 0) {
        const payoffDate = calculatePayoffDate(
          Number(liability.currentBalance),
          Number(liability.interestRate),
          Number(liability.minimumPayment)
        );
        projectedPayoffDate = payoffDate?.toISOString() || null;
      }

      return {
        ...liability,
        currentBalance: Number(liability.currentBalance),
        originalAmount: Number(liability.originalAmount),
        interestRate: Number(liability.interestRate),
        minimumPayment: Number(liability.minimumPayment),
        payments: liability.payments.map(p => ({
          ...p,
          principalAmount: Number(p.principalAmount),
          interestAmount: Number(p.interestAmount),
        })),
        totalPaid,
        totalInterestPaid,
        projectedPayoffDate,
      };
    });

    return enhancedLiabilities;
  },

  /**
   * Update liability properties
   */
  async updateLiability(liabilityId: string, userId: string, data: UpdateLiabilityInput) {
    // Verify liability exists and belongs to user
    const existingLiability = await prisma.liability.findFirst({
      where: { id: liabilityId, userId },
    });

    if (!existingLiability) {
      throw new NotFoundError('Liability not found');
    }

    // Validate provided fields
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Liability name cannot be empty');
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currentBalance !== undefined) updateData.currentBalance = data.currentBalance;
    if (data.originalAmount !== undefined) updateData.originalAmount = data.originalAmount;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.interestType !== undefined) updateData.interestType = data.interestType;
    if (data.minimumPayment !== undefined) updateData.minimumPayment = data.minimumPayment;
    if (data.paymentFrequency !== undefined) updateData.paymentFrequency = data.paymentFrequency;
    if (data.payoffDate !== undefined) {
      updateData.payoffDate = data.payoffDate ? new Date(data.payoffDate) : null;
    }

    // Merge metadata if provided
    if (data.metadata !== undefined) {
      const existingMeta = (existingLiability.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    const liability = await prisma.liability.update({
      where: { id: liabilityId },
      data: updateData,
    });

    return liability;
  },

  /**
   * Delete a liability
   * Payment allocations are automatically deleted due to cascade
   */
  async deleteLiability(liabilityId: string, userId: string) {
    // Verify liability exists and belongs to user
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, userId },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    await prisma.liability.delete({
      where: { id: liabilityId },
    });

    return { message: 'Liability deleted successfully' };
  },

  /**
   * Allocate a transaction to a liability payment
   */
  async allocateTransactionToLiability(
    transactionId: string,
    liabilityId: string,
    userId: string,
    principalAmount: number,
    interestAmount: number
  ) {
    // Verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Verify transaction is an expense
    if (transaction.type !== 'expense') {
      throw new ValidationError('Only expense transactions can be allocated to liability payments');
    }

    // Verify transaction is not already allocated
    const existingPayment = await prisma.liabilityPayment.findFirst({
      where: { transactionId },
    });

    if (existingPayment) {
      throw new ValidationError('Transaction is already allocated to a liability payment');
    }

    // Verify liability exists and belongs to user
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, userId },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    // Validate principal + interest = transaction amount (with small tolerance)
    const transactionAmount = Number(transaction.amount);
    const totalPayment = principalAmount + interestAmount;
    const tolerance = 0.01;

    if (Math.abs(totalPayment - transactionAmount) > tolerance) {
      throw new ValidationError(
        `Principal + interest (${totalPayment.toFixed(2)}) must equal transaction amount (${transactionAmount.toFixed(2)})`
      );
    }

    // Use transaction to create payment and update balance atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create liability payment record
      const payment = await tx.liabilityPayment.create({
        data: {
          liabilityId,
          transactionId,
          principalAmount,
          interestAmount,
          date: transaction.date,
        },
      });

      // Update liability balance (reduce by principal only)
      await tx.liability.update({
        where: { id: liabilityId },
        data: {
          currentBalance: {
            decrement: principalAmount,
          },
        },
      });

      return payment;
    });

    return result;
  },

  /**
   * Remove payment allocation and restore balance
   */
  async removePaymentAllocation(paymentId: string, userId: string) {
    // Get payment with liability ownership check
    const payment = await prisma.liabilityPayment.findFirst({
      where: {
        id: paymentId,
        liability: { userId },
      },
      include: { liability: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment allocation not found');
    }

    const principalAmount = Number(payment.principalAmount);

    // Use transaction to delete payment and restore balance atomically
    await prisma.$transaction(async (tx) => {
      // Delete payment allocation
      await tx.liabilityPayment.delete({
        where: { id: paymentId },
      });

      // Restore liability balance (add back principal)
      await tx.liability.update({
        where: { id: payment.liabilityId },
        data: {
          currentBalance: {
            increment: principalAmount,
          },
        },
      });
    });

    return { message: 'Payment allocation removed successfully' };
  },

  /**
   * Get unallocated expense transactions for a liability
   */
  async getUnallocatedPayments(userId: string, liabilityId?: string) {
    // Verify liability if provided
    if (liabilityId) {
      const liability = await prisma.liability.findFirst({
        where: { id: liabilityId, userId },
      });
      if (!liability) {
        throw new NotFoundError('Liability not found');
      }
    }

    // Get all expense transactions not in LiabilityPayment table
    const allocatedTransactionIds = await prisma.liabilityPayment.findMany({
      select: { transactionId: true },
    });

    const allocatedIds = allocatedTransactionIds.map(p => p.transactionId);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        id: { notIn: allocatedIds },
      },
      orderBy: { date: 'desc' },
      include: {
        account: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });

    return transactions;
  },

  /**
   * Calculate payoff projection (amortization schedule)
   */
  async calculatePayoffProjection(liabilityId: string, userId: string) {
    const liability = await prisma.liability.findFirst({
      where: { id: liabilityId, userId },
    });

    if (!liability) {
      throw new NotFoundError('Liability not found');
    }

    const currentBalance = Number(liability.currentBalance);
    const interestRate = Number(liability.interestRate);
    const minimumPayment = Number(liability.minimumPayment);

    if (currentBalance <= 0) {
      return {
        liabilityId,
        currentBalance: 0,
        monthlyPayment: minimumPayment,
        interestRate,
        projectedPayoffDate: null,
        totalInterestToPay: 0,
        schedule: [],
      };
    }

    // Calculate amortization schedule
    const schedule = calculateAmortizationSchedule(currentBalance, interestRate, minimumPayment);

    const totalInterestToPay = calculateTotalInterest(currentBalance, interestRate, minimumPayment);
    const projectedPayoffDate = calculatePayoffDate(currentBalance, interestRate, minimumPayment);

    return {
      liabilityId,
      currentBalance,
      monthlyPayment: minimumPayment,
      interestRate,
      projectedPayoffDate: projectedPayoffDate?.toISOString() || null,
      totalInterestToPay,
      schedule,
    };
  },

  /**
   * Get liability summary statistics for a user
   */
  async getLiabilitySummary(userId: string) {
    const liabilities = await prisma.liability.findMany({
      where: { userId },
    });

    if (liabilities.length === 0) {
      return {
        totalDebt: 0,
        byType: [],
        monthlyMinimumPayment: 0,
        totalInterestRate: 0,
      };
    }

    let totalDebt = 0;
    let totalMinimumPayment = 0;
    let weightedInterestSum = 0;

    const byTypeMap = new Map<LiabilityType, { balance: number; count: number }>();

    liabilities.forEach(liability => {
      const balance = Number(liability.currentBalance);
      const minPayment = Number(liability.minimumPayment);
      const rate = Number(liability.interestRate);

      totalDebt += balance;
      totalMinimumPayment += minPayment;
      weightedInterestSum += balance * rate;

      // Group by type
      const existing = byTypeMap.get(liability.type) || { balance: 0, count: 0 };
      byTypeMap.set(liability.type, {
        balance: existing.balance + balance,
        count: existing.count + 1,
      });
    });

    // Calculate weighted average interest rate
    const totalInterestRate = totalDebt > 0 ? weightedInterestSum / totalDebt : 0;

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      balance: data.balance,
      count: data.count,
    }));

    return {
      totalDebt,
      byType,
      monthlyMinimumPayment: totalMinimumPayment,
      totalInterestRate,
    };
  },

  /**
   * Calculate total liability value as of a specific date
   */
  async calculateTotalLiabilityValue(userId: string, asOfDate: Date = new Date()) {
    const liabilities = await prisma.liability.findMany({
      where: {
        userId,
        createdAt: { lte: asOfDate },
      },
    });

    const total = liabilities.reduce((sum, liability) => sum + Number(liability.currentBalance), 0);
    return total;
  },
};
