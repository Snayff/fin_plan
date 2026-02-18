import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { generateOccurrences, recurringService } from './recurring.service';
import { prisma } from '../config/database';
import { RecurringFrequency } from '@prisma/client';

// Mock Prisma client
mock.module('../config/database', () => ({
  prisma: {
    recurringRule: {
      create: mock(() => Promise.resolve({
        id: 'test-rule-id',
        userId: 'test-user-id',
        frequency: 'monthly' as RecurringFrequency,
        interval: 1,
        startDate: new Date('2026-01-01'),
        endDate: null,
        occurrences: null,
        isActive: true,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1000,
          name: 'Rent',
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastGeneratedDate: null,
      })),
      findMany: mock(() => Promise.resolve([])),
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    transaction: {
      findMany: mock(() => Promise.resolve([])),
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({})),
      createMany: mock(() => Promise.resolve({ count: 0 })),
      update: mock(() => Promise.resolve({})),
      updateMany: mock(() => Promise.resolve({ count: 0 })),
      delete: mock(() => Promise.resolve({})),
    },
    transactionOverride: {
      upsert: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  },
}));

describe('RecurringService', () => {
  describe('generateOccurrences', () => {
    it('should generate daily occurrences', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-07');

      const occurrences = generateOccurrences('daily', 1, startDate, endDate, null);

      expect(occurrences.length).toBe(7);
      expect(occurrences[0].toISOString()).toContain('2026-01-01');
      expect(occurrences[6].toISOString()).toContain('2026-01-07');
    });

    it('should generate weekly occurrences', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-02-01');

      const occurrences = generateOccurrences('weekly', 1, startDate, endDate, null);

      expect(occurrences.length).toBeGreaterThanOrEqual(4);
      expect(occurrences.length).toBeLessThanOrEqual(5);

      // Check that occurrences are 7 days apart
      if (occurrences.length >= 2) {
        const diff = occurrences[1].getTime() - occurrences[0].getTime();
        expect(diff).toBe(7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
      }
    });

    it('should generate biweekly occurrences', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-03-01');

      const occurrences = generateOccurrences('biweekly', 2, startDate, endDate, null);

      expect(occurrences.length).toBeGreaterThanOrEqual(4);

      // Check that occurrences are 14 days apart
      if (occurrences.length >= 2) {
        const diff = occurrences[1].getTime() - occurrences[0].getTime();
        expect(diff).toBe(14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
      }
    });

    it('should generate monthly occurrences', () => {
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-06-15');

      const occurrences = generateOccurrences('monthly', 1, startDate, endDate, null);

      expect(occurrences.length).toBe(6); // Jan through June
      expect(occurrences[0].getDate()).toBe(15);
      expect(occurrences[1].getDate()).toBe(15);
    });

    it('should generate quarterly occurrences', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const occurrences = generateOccurrences('quarterly', 3, startDate, endDate, null);

      expect(occurrences.length).toBe(4); // Q1, Q2, Q3, Q4
    });

    it('should generate annually occurrences', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2028-12-31');

      const occurrences = generateOccurrences('annually', 1, startDate, endDate, null);

      expect(occurrences.length).toBe(3); // 2026, 2027, 2028
    });

    it('should limit occurrences by count', () => {
      const startDate = new Date('2026-01-01');

      const occurrences = generateOccurrences('monthly', 1, startDate, null, 5);

      expect(occurrences.length).toBe(5);
    });

    it('should respect custom interval', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-07-01');

      // Every 2 months
      const occurrences = generateOccurrences('monthly', 2, startDate, endDate, null);

      expect(occurrences.length).toBe(4); // Jan, Mar, May, Jul
    });
  });

  describe('Date Generation Edge Cases', () => {
    it('should handle month-end dates correctly', () => {
      const startDate = new Date('2026-01-31');
      const endDate = new Date('2026-04-30');

      const occurrences = generateOccurrences('monthly', 1, startDate, endDate, null);

      expect(occurrences.length).toBeGreaterThan(0);
      // rrule handles month-end dates intelligently
    });

    it('should handle leap year dates', () => {
      const startDate = new Date('2024-02-29'); // Leap year
      const endDate = new Date('2025-03-01');

      const occurrences = generateOccurrences('annually', 1, startDate, endDate, null);

      expect(occurrences.length).toBeGreaterThan(0);
    });

    it('should generate correct occurrences when start date is in the past', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-03-01');

      const occurrences = generateOccurrences('monthly', 1, startDate, endDate, null);

      expect(occurrences.length).toBeGreaterThan(12); // More than a year's worth
    });
  });

  describe('Preview Occurrences', () => {
    it('should preview limited number of occurrences', async () => {
      const dates = await recurringService.previewOccurrences(
        'monthly',
        1,
        new Date('2026-01-01'),
        new Date('2026-12-31'),
        null,
        5
      );

      expect(dates.length).toBe(5);
    });

    it('should use default limit of 10', async () => {
      const dates = await recurringService.previewOccurrences(
        'weekly',
        1,
        new Date('2026-01-01'),
        new Date('2026-12-31'),
        null
      );

      expect(dates.length).toBe(10);
    });
  });

  describe('Transaction Generation Logic', () => {
    it('should generate transactions within date range', async () => {
      // Mock a recurring rule
      const mockRule = {
        id: 'test-rule-id',
        userId: 'test-user-id',
        frequency: 'monthly' as RecurringFrequency,
        interval: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        occurrences: null,
        isActive: true,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1000,
          name: 'Rent',
          categoryId: 'test-category-id',
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastGeneratedDate: null,
      };

      // Mock prisma to return the rule
      (prisma.recurringRule.findUnique as any).mockResolvedValueOnce(mockRule);

      const transactions = await recurringService.generateTransactions(
        'test-rule-id',
        new Date('2026-01-01'),
        new Date('2026-03-31')
      );

      expect(transactions.length).toBe(3); // Jan, Feb, Mar
      expect(transactions[0].amount).toBe(1000);
      expect(transactions[0].name).toBe('Rent');
      expect(transactions[0].isGenerated).toBe(true);
      expect(transactions[0].recurringRuleId).toBe('test-rule-id');
    });

    it('should not generate transactions for inactive rules', async () => {
      const mockRule = {
        id: 'test-rule-id',
        userId: 'test-user-id',
        frequency: 'monthly' as RecurringFrequency,
        interval: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        occurrences: null,
        isActive: false, // Inactive
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1000,
          name: 'Rent',
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastGeneratedDate: null,
      };

      (prisma.recurringRule.findUnique as any).mockResolvedValueOnce(mockRule);

      const transactions = await recurringService.generateTransactions(
        'test-rule-id',
        new Date('2026-01-01'),
        new Date('2026-03-31')
      );

      expect(transactions.length).toBe(0);
    });
  });

  describe('Materialization Logic', () => {
    it('should skip already generated dates', async () => {
      const mockRule = {
        id: 'test-rule-id',
        userId: 'test-user-id',
        frequency: 'monthly' as RecurringFrequency,
        interval: 1,
        startDate: new Date('2026-01-01'),
        endDate: null,
        occurrences: null,
        isActive: true,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1000,
          name: 'Rent',
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastGeneratedDate: null,
      };

      // Mock existing transactions for Jan and Feb
      const existingTransactions = [
        { date: new Date('2026-01-01') },
        { date: new Date('2026-02-01') },
      ];

      // materializeHistoricalTransactions calls findUnique twice (once for itself, once in generateTransactions)
      (prisma.recurringRule.findUnique as any)
        .mockResolvedValueOnce(mockRule)
        .mockResolvedValueOnce(mockRule);
      (prisma.transaction.findMany as any).mockResolvedValueOnce(existingTransactions);
      (prisma.transaction.createMany as any).mockResolvedValueOnce({ count: 0 });
      (prisma.recurringRule.update as any).mockResolvedValueOnce(mockRule);

      const count = await recurringService.materializeHistoricalTransactions('test-rule-id');

      // Should not create duplicates
      expect(count).toBe(0);
    });
  });

  describe('Frequency Mapping', () => {
    it('should correctly map all frequency types', () => {
      const frequencies: RecurringFrequency[] = [
        'daily',
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'annually',
      ];

      frequencies.forEach((freq) => {
        const startDate = new Date('2026-01-01');
        const endDate = new Date('2026-12-31');

        // Should not throw
        expect(() => {
          generateOccurrences(freq, 1, startDate, endDate, null);
        }).not.toThrow();
      });
    });
  });

  describe('Template Transaction Validation', () => {
    it('should include all template fields in generated transactions', async () => {
      const mockRule = {
        id: 'test-rule-id',
        userId: 'test-user-id',
        frequency: 'monthly' as RecurringFrequency,
        interval: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        occurrences: null,
        isActive: true,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'income',
          amount: 5000,
          name: 'Salary',
          categoryId: 'salary-category-id',
          description: 'Monthly salary payment',
          tags: ['income', 'salary'],
          metadata: { source: 'employer' },
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastGeneratedDate: null,
      };

      (prisma.recurringRule.findUnique as any).mockResolvedValueOnce(mockRule);

      const transactions = await recurringService.generateTransactions(
        'test-rule-id',
        new Date('2026-01-01'),
        new Date('2026-03-31')
      );

      expect(transactions.length).toBe(3);

      const firstTx = transactions[0];
      expect(firstTx.accountId).toBe('test-account-id');
      expect(firstTx.type).toBe('income');
      expect(firstTx.amount).toBe(5000);
      expect(firstTx.name).toBe('Salary');
      expect(firstTx.categoryId).toBe('salary-category-id');
      expect(firstTx.description).toBe('Monthly salary payment');
      expect(firstTx.tags).toEqual(['income', 'salary']);
      expect(firstTx.metadata).toEqual({ source: 'employer' });
    });
  });

  describe('Performance Considerations', () => {
    it('should efficiently generate large number of occurrences', () => {
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2030-12-31');

      const start = Date.now();
      const occurrences = generateOccurrences('monthly', 1, startDate, endDate, null);
      const duration = Date.now() - start;

      expect(occurrences.length).toBeGreaterThan(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle very frequent recurrences efficiently', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const start = Date.now();
      const occurrences = generateOccurrences('daily', 1, startDate, endDate, null);
      const duration = Date.now() - start;

      expect(occurrences.length).toBeGreaterThan(300);
      expect(duration).toBeLessThan(1000);
    });
  });
});
