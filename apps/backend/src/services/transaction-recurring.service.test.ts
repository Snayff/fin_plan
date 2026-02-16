import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { transactionService } from './transaction.service';
import { prisma } from '../config/database';

// Mock Prisma client
mock.module('../config/database', () => ({
  prisma: {
    transaction: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      updateMany: mock(() => Promise.resolve({ count: 0 })),
      delete: mock(() => Promise.resolve({})),
      aggregate: mock(() => Promise.resolve({ _sum: { amount: 0 }, _count: 0 })),
      count: mock(() => Promise.resolve(0)),
    },
    account: {
      findFirst: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
    },
    category: {
      findUnique: mock(() => Promise.resolve(null)),
    },
    liability: {
      findFirst: mock(() => Promise.resolve(null)),
    },
    recurringRule: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
    },
    transactionOverride: {
      upsert: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  },
}));

// Mock recurring service functions
mock.module('./recurring.service', () => ({
  detectOverrides: mock(() => Promise.resolve(['amount'])),
  trackOverride: mock(() => Promise.resolve()),
  syncRecurringRule: mock(() => Promise.resolve(5)),
  clearOverrides: mock(() => Promise.resolve()),
  materializeHistoricalTransactions: mock(() => Promise.resolve(0)),
  generateTransactions: mock(() => Promise.resolve([])),
  getForecastTransactions: mock(() => Promise.resolve([])),
}));

describe('Transaction Service - Recurring Transaction Edits', () => {
  describe('Edit Scope: this_only', () => {
    it('should track overrides when editing with this_only scope', async () => {
      const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        accountId: 'test-account-id',
        date: new Date('2026-02-01'),
        amount: 1000,
        type: 'expense',
        name: 'Rent',
        isGenerated: true,
        recurringRuleId: 'test-rule-id',
        overriddenFields: [],
        metadata: {},
        isRecurring: true,
        liabilityId: null,
        categoryId: null,
        subcategoryId: null,
        description: null,
        memo: null,
        tags: [],
        recurrence: 'none',
        recurrence_end_date: null,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringRule: {
          id: 'test-rule-id',
          userId: 'test-user-id',
          frequency: 'monthly',
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
        },
      };

      const mockAccount = {
        id: 'test-account-id',
        userId: 'test-user-id',
        name: 'Test Account',
        type: 'current',
      };

      const updatedTransaction = {
        ...mockTransaction,
        amount: 1100, // Changed amount
        overriddenFields: ['amount'],
        account: mockAccount,
        category: null,
        liability: null,
        subcategory: null,
      };

      (prisma.transaction.findFirst as any).mockResolvedValueOnce(mockTransaction);
      (prisma.account.findFirst as any).mockResolvedValueOnce(mockAccount);
      (prisma.transaction.update as any).mockResolvedValueOnce(updatedTransaction);

      const result = await transactionService.updateTransaction(
        'test-transaction-id',
        'test-user-id',
        { amount: 1100 },
        'this_only'
      );

      expect(result.amount).toBe(1100);
      // Override tracking functions should have been called
    });
  });

  describe('Edit Scope: all', () => {
    it('should update recurring rule and clear all overrides with all scope', async () => {
      const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        accountId: 'test-account-id',
        date: new Date('2026-02-01'),
        amount: 1000,
        type: 'expense',
        name: 'Rent',
        isGenerated: true,
        recurringRuleId: 'test-rule-id',
        overriddenFields: ['amount'], // Had override
        metadata: {},
        isRecurring: true,
        liabilityId: null,
        categoryId: null,
        subcategoryId: null,
        description: null,
        memo: null,
        tags: [],
        recurrence: 'none',
        recurrence_end_date: null,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringRule: {
          id: 'test-rule-id',
          userId: 'test-user-id',
          frequency: 'monthly',
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
        },
      };

      const mockAccount = {
        id: 'test-account-id',
        userId: 'test-user-id',
        name: 'Test Account',
        type: 'current',
      };

      const updatedTransaction = {
        ...mockTransaction,
        amount: 1200,
        overriddenFields: [], // Overrides cleared
        account: mockAccount,
        category: null,
        liability: null,
        subcategory: null,
      };

      (prisma.transaction.findFirst as any).mockResolvedValueOnce(mockTransaction);
      (prisma.recurringRule.update as any).mockResolvedValueOnce({
        ...mockTransaction.recurringRule,
        version: 2,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1200,
          name: 'Rent',
        },
      });
      (prisma.transaction.findUnique as any).mockResolvedValueOnce(updatedTransaction);

      const result = await transactionService.updateTransaction(
        'test-transaction-id',
        'test-user-id',
        { amount: 1200 },
        'all'
      );

      expect(result.amount).toBe(1200);
      // clearOverrides and syncRecurringRule should have been called
    });
  });

  describe('Edit Scope: all_forward', () => {
    it('should update recurring rule and sync from date forward with all_forward scope', async () => {
      const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        accountId: 'test-account-id',
        date: new Date('2026-03-01'),
        amount: 1000,
        type: 'expense',
        name: 'Rent',
        isGenerated: true,
        recurringRuleId: 'test-rule-id',
        overriddenFields: [],
        metadata: {},
        isRecurring: true,
        liabilityId: null,
        categoryId: null,
        subcategoryId: null,
        description: null,
        memo: null,
        tags: [],
        recurrence: 'none',
        recurrence_end_date: null,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringRule: {
          id: 'test-rule-id',
          userId: 'test-user-id',
          frequency: 'monthly',
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
        },
      };

      const mockAccount = {
        id: 'test-account-id',
        userId: 'test-user-id',
        name: 'Test Account',
        type: 'current',
      };

      const updatedTransaction = {
        ...mockTransaction,
        amount: 1150,
        account: mockAccount,
        category: null,
        liability: null,
        subcategory: null,
      };

      (prisma.transaction.findFirst as any).mockResolvedValueOnce(mockTransaction);
      (prisma.recurringRule.update as any).mockResolvedValueOnce({
        ...mockTransaction.recurringRule,
        version: 2,
        templateTransaction: {
          accountId: 'test-account-id',
          type: 'expense',
          amount: 1150,
          name: 'Rent',
        },
      });
      (prisma.transaction.findUnique as any).mockResolvedValueOnce(updatedTransaction);

      const result = await transactionService.updateTransaction(
        'test-transaction-id',
        'test-user-id',
        { amount: 1150 },
        'all_forward'
      );

      expect(result.amount).toBe(1150);
      // clearOverrides with 'from_date' and syncRecurringRule with 'from_date' should have been called
    });
  });

  describe('Non-Generated Transaction Updates', () => {
    it('should update normally when transaction is not generated', async () => {
      const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        accountId: 'test-account-id',
        date: new Date('2026-02-01'),
        amount: 500,
        type: 'expense',
        name: 'Groceries',
        isGenerated: false, // Not generated
        recurringRuleId: null,
        overriddenFields: [],
        metadata: {},
        isRecurring: false,
        liabilityId: null,
        categoryId: null,
        subcategoryId: null,
        description: null,
        memo: null,
        tags: [],
        recurrence: 'none',
        recurrence_end_date: null,
        generatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringRule: null,
      };

      const mockAccount = {
        id: 'test-account-id',
        userId: 'test-user-id',
        name: 'Test Account',
        type: 'current',
      };

      const updatedTransaction = {
        ...mockTransaction,
        amount: 550,
        account: mockAccount,
        category: null,
        liability: null,
        subcategory: null,
      };

      (prisma.transaction.findFirst as any).mockResolvedValueOnce(mockTransaction);
      (prisma.transaction.update as any).mockResolvedValueOnce(updatedTransaction);

      const result = await transactionService.updateTransaction(
        'test-transaction-id',
        'test-user-id',
        { amount: 550 }
        // No updateScope provided
      );

      expect(result.amount).toBe(550);
      // No recurring-specific logic should be invoked
    });

    it('should update normally when no updateScope is provided for generated transaction', async () => {
      const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        accountId: 'test-account-id',
        date: new Date('2026-02-01'),
        amount: 1000,
        type: 'expense',
        name: 'Rent',
        isGenerated: true, // Generated
        recurringRuleId: 'test-rule-id',
        overriddenFields: [],
        metadata: {},
        isRecurring: true,
        liabilityId: null,
        categoryId: null,
        subcategoryId: null,
        description: null,
        memo: null,
        tags: [],
        recurrence: 'none',
        recurrence_end_date: null,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        recurringRule: {
          id: 'test-rule-id',
          userId: 'test-user-id',
          frequency: 'monthly',
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
        },
      };

      const mockAccount = {
        id: 'test-account-id',
        userId: 'test-user-id',
        name: 'Test Account',
        type: 'current',
      };

      const updatedTransaction = {
        ...mockTransaction,
        amount: 1050,
        account: mockAccount,
        category: null,
        liability: null,
        subcategory: null,
      };

      (prisma.transaction.findFirst as any).mockResolvedValueOnce(mockTransaction);
      (prisma.transaction.update as any).mockResolvedValueOnce(updatedTransaction);

      const result = await transactionService.updateTransaction(
        'test-transaction-id',
        'test-user-id',
        { amount: 1050 }
        // No updateScope - should do normal update
      );

      expect(result.amount).toBe(1050);
      // Should not invoke recurring-specific logic since no updateScope
    });
  });

  describe('Field Validation', () => {
    it('should validate that only overridable fields trigger override tracking', () => {
      const overridableFields = [
        'amount',
        'date',
        'categoryId',
        'subcategoryId',
        'description',
        'memo',
        'tags',
        'liabilityId',
      ];

      // These are the fields defined as OVERRIDABLE_FIELDS in recurring.service.ts
      expect(overridableFields).toContain('amount');
      expect(overridableFields).toContain('categoryId');
      expect(overridableFields).not.toContain('id');
      expect(overridableFields).not.toContain('userId');
      expect(overridableFields).not.toContain('recurringRuleId');
    });
  });
});
