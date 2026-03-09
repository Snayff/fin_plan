import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../utils/balance.utils", () => ({
  calculateAccountBalances: mock(() => Promise.resolve(new Map<string, number>())),
  endOfDay: (d: Date) => d,
}));

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { goalService } from "./goal.service";
import { NotFoundError, ValidationError } from "../utils/errors";
import { calculateAccountBalances } from "../utils/balance.utils";

function buildGoal(overrides: Record<string, any> = {}) {
  return {
    id: "goal-1",
    userId: "user-1",
    name: "Emergency Fund",
    description: null,
    type: "savings",
    targetAmount: 1000,
    currentAmount: 100,
    targetDate: null,
    priority: "medium",
    status: "active",
    icon: null,
    linkedAccountId: null,
    incomePeriod: null,
    metadata: {},
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  resetPrismaMocks();
});

describe("goalService.createGoal", () => {
  it("creates goal with default milestones", async () => {
    prismaMock.goal.create.mockResolvedValue(buildGoal());

    const result = await goalService.createGoal("user-1", {
      name: "Emergency Fund",
      type: "savings" as any,
      targetAmount: 1000,
    });

    expect(prismaMock.goal.create).toHaveBeenCalled();
    expect(prismaMock.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priority: "medium",
          metadata: expect.objectContaining({
            milestones: expect.any(Array),
          }),
        }),
      })
    );
    expect(result.name).toBe("Emergency Fund");
  });

  it("throws ValidationError for empty name", async () => {
    await expect(
      goalService.createGoal("user-1", {
        name: "",
        type: "savings" as any,
        targetAmount: 100,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for negative target", async () => {
    await expect(
      goalService.createGoal("user-1", {
        name: "Bad goal",
        type: "savings" as any,
        targetAmount: -1,
      })
    ).rejects.toThrow("Target amount must be non-negative");
  });

});

describe("goalService.getGoalById", () => {
  it("returns goal when found", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(buildGoal());
    const result = await goalService.getGoalById("goal-1", "user-1");
    expect(result.id).toBe("goal-1");
  });

  it("throws NotFoundError when missing", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(null);
    await expect(goalService.getGoalById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });
});

describe("goalService.updateGoal", () => {
  it("updates fields and merges metadata", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(buildGoal({ metadata: { foo: 1 } }));
    prismaMock.goal.update.mockResolvedValue(buildGoal({ name: "Updated" }));

    const result = await goalService.updateGoal("goal-1", "user-1", {
      name: "Updated",
      metadata: { bar: 2 },
    });

    expect(prismaMock.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Updated",
          metadata: { foo: 1, bar: 2 },
        }),
      })
    );
    expect(result.name).toBe("Updated");
  });

  it("throws NotFoundError when goal missing", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(null);
    await expect(goalService.updateGoal("missing", "user-1", { name: "X" })).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("goalService.addContribution", () => {
  it("creates contribution and updates amount", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(buildGoal({ currentAmount: 100, targetAmount: 1000 }));
    prismaMock.goalContribution.create.mockResolvedValue({ id: "contrib-1", amount: 50 } as any);
    prismaMock.goal.update.mockResolvedValue(buildGoal({ currentAmount: 150 }));

    const result = await goalService.addContribution("goal-1", "user-1", { amount: 50 });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.goalContribution.create).toHaveBeenCalled();
    expect(prismaMock.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentAmount: 150 }),
      })
    );
    expect(result).toHaveProperty("goal");
  });

  it("auto-completes when target reached", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(buildGoal({ currentAmount: 900, targetAmount: 1000 }));
    prismaMock.goalContribution.create.mockResolvedValue({ id: "contrib-1", amount: 100 } as any);
    prismaMock.goal.update.mockResolvedValue(buildGoal({ currentAmount: 1000, status: "completed" }));

    await goalService.addContribution("goal-1", "user-1", { amount: 100 });

    expect(prismaMock.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      })
    );
  });
});

describe("goalService.linkTransactionToGoal", () => {
  it("throws NotFoundError when transaction missing", async () => {
    prismaMock.goal.findFirst.mockResolvedValue(buildGoal());
    prismaMock.transaction.findFirst.mockResolvedValue(null);

    await expect(
      goalService.linkTransactionToGoal("goal-1", "user-1", {
        transactionId: "tx-1",
        amount: 10,
      })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('goalService.createGoal — linkedAccountId and incomePeriod', () => {
  it('saves linkedAccountId when provided', async () => {
    const accountId = 'a0000000-0000-0000-0000-000000000001';
    prismaMock.account.findFirst.mockResolvedValue({ id: accountId, householdId: 'household-1' } as any);
    prismaMock.goal.create.mockResolvedValue(
      buildGoal({ linkedAccountId: accountId })
    );

    await goalService.createGoal('household-1', {
      name: 'Pay off loan',
      type: 'debt_payoff' as any,
      targetAmount: 5000,
      linkedAccountId: accountId,
    });

    expect(prismaMock.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ linkedAccountId: accountId }),
      })
    );
  });

  it('saves incomePeriod when provided', async () => {
    prismaMock.goal.create.mockResolvedValue(
      buildGoal({ incomePeriod: 'month' })
    );

    await goalService.createGoal('household-1', {
      name: 'Monthly income',
      type: 'income' as any,
      targetAmount: 5000,
      incomePeriod: 'month',
    });

    expect(prismaMock.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ incomePeriod: 'month' }),
      })
    );
  });
});

describe('goalService.createGoal — household ownership check', () => {
  it('throws ValidationError if linkedAccountId belongs to different household', async () => {
    prismaMock.account.findFirst.mockResolvedValue(null); // no match for householdId

    await expect(
      goalService.createGoal('household-1', {
        name: 'Pay off loan',
        type: 'debt_payoff' as any,
        targetAmount: 5000,
        linkedAccountId: 'a0000000-0000-0000-0000-000000000001',
      })
    ).rejects.toThrow(ValidationError);
  });
});

describe("goalService.getGoalSummary", () => {
  it("returns zero summary for no goals", async () => {
    prismaMock.goal.findMany.mockResolvedValue([]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());

    const result = await goalService.getGoalSummary("user-1");
    expect(result.totalSaved).toBe(0);
    expect(result.byType).toEqual([]);
  });

  it("aggregates totals and buckets", async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoal({ type: "savings", priority: "high", currentAmount: 0, targetAmount: 1000 }),
      buildGoal({ id: "goal-2", type: "investment", priority: "low", currentAmount: 0, targetAmount: 2000 }),
    ] as any);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-savings', type: 'savings', isActive: true },
      { id: 'acc-investment', type: 'investment', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-savings', 200], ['acc-investment', 500]])
    );

    const result = await goalService.getGoalSummary("user-1");

    expect(result.totalSaved).toBe(700);
    expect(result.totalTarget).toBe(3000);
    expect(result.byType).toHaveLength(2);
    expect(result.byPriority).toHaveLength(2);
  });
});

describe('goalService.getUserGoalsWithProgress — calculatedProgress', () => {
  function buildGoalWithContributions(overrides: Record<string, any> = {}) {
    return {
      ...buildGoal(overrides),
      contributions: [],
    };
  }

  it('computes savings progress from savings+isa account balances (excludes current)', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'savings', targetAmount: 1000, currentAmount: 0 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-savings', type: 'savings', isActive: true },
      { id: 'acc-isa', type: 'isa', isActive: true },
      { id: 'acc-current', type: 'current', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-savings', 300], ['acc-isa', 100], ['acc-current', 500]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(400); // 300 + 100, NOT 500 (current excluded)
    expect(results[0].progressPercentage).toBe(40);
  });

  it('computes debt_payoff progress as targetAmount minus linkedAccount balance', async () => {
    const accountId = 'acc-credit';
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'debt_payoff', targetAmount: 10000, currentAmount: 0, linkedAccountId: accountId }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: accountId, type: 'credit', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([[accountId, 6000]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(4000); // 10000 - 6000
    expect(results[0].progressPercentage).toBe(40);
  });

  it('sets linkedAccountMissing=true when linkedAccount not found in balanceMap', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'debt_payoff', targetAmount: 10000, currentAmount: 0, linkedAccountId: 'deleted-acc' }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]); // no accounts returned
    (calculateAccountBalances as any).mockResolvedValue(new Map());

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].linkedAccountMissing).toBe(true);
    expect(results[0].calculatedProgress).toBe(0);
  });

  it('computes income progress from income transactions this month when incomePeriod is month', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'income', targetAmount: 3000, currentAmount: 0, incomePeriod: 'month' }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 1500 } }) // monthly income
      .mockResolvedValueOnce({ _sum: { amount: 18000 } }); // yearly income

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(1500);
    expect(results[0].progressPercentage).toBeCloseTo(50);
  });

  it('uses currentAmount for manual purchase goals (no linkedAccountId)', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'purchase', targetAmount: 2000, currentAmount: 500, linkedAccountId: null }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(500);
  });
});

describe('goalService.getUserGoalsWithProgress — additional computeGoalProgress cases', () => {
  function buildGoalWithContributions(overrides: Record<string, any> = {}) {
    return { ...buildGoal(overrides), contributions: [] };
  }

  it('computes investment progress from investment+stocks_and_shares_isa balances', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'investment', targetAmount: 5000, currentAmount: 0 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-investment', type: 'investment', isActive: true },
      { id: 'acc-isa', type: 'stocks_and_shares_isa', isActive: true },
      { id: 'acc-savings', type: 'savings', isActive: true }, // excluded
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-investment', 2000], ['acc-isa', 500], ['acc-savings', 300]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(2500); // 2000 + 500, NOT 300
    expect(results[0].progressPercentage).toBe(50);
  });

  it('computes net_worth progress as assets minus liabilities', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'net_worth', targetAmount: 10000, currentAmount: 0 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-current', type: 'current', isActive: true },
      { id: 'acc-savings', type: 'savings', isActive: true },
      { id: 'acc-credit', type: 'credit', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-current', 3000], ['acc-savings', 2000], ['acc-credit', 1000]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(4000); // (3000+2000) - 1000
    expect(results[0].progressPercentage).toBe(40);
  });

  it('computes purchase progress from linked account balance', async () => {
    const accountId = 'acc-purchase';
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'purchase', targetAmount: 2000, currentAmount: 0, linkedAccountId: accountId }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: accountId, type: 'savings', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([[accountId, 500]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(500);
    expect(results[0].progressPercentage).toBe(25);
  });

  it('computes income progress from annual income transactions when incomePeriod is year', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'income', targetAmount: 36000, currentAmount: 0, incomePeriod: 'year' }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 3000 } })  // monthly (called first)
      .mockResolvedValueOnce({ _sum: { amount: 18000 } }); // yearly (called second)

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(18000);
    expect(results[0].progressPercentage).toBeCloseTo(50);
  });

  it('caps progressPercentage at 100 when calculatedProgress exceeds targetAmount', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'savings', targetAmount: 1000, currentAmount: 0 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-savings', type: 'savings', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-savings', 1500]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(1500);
    expect(results[0].progressPercentage).toBe(100); // capped
  });
});
