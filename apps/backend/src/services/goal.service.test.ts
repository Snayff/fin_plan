import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { goalService } from "./goal.service";
import { NotFoundError, ValidationError } from "../utils/errors";

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

describe("goalService.getGoalSummary", () => {
  it("returns zero summary for no goals", async () => {
    prismaMock.goal.findMany.mockResolvedValue([]);
    const result = await goalService.getGoalSummary("user-1");
    expect(result.totalSaved).toBe(0);
    expect(result.byType).toEqual([]);
  });

  it("aggregates totals and buckets", async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoal({ type: "savings", priority: "high", currentAmount: 200, targetAmount: 1000 }),
      buildGoal({ id: "goal-2", type: "investment", priority: "low", currentAmount: 500, targetAmount: 2000 }),
    ] as any);

    const result = await goalService.getGoalSummary("user-1");

    expect(result.totalSaved).toBe(700);
    expect(result.totalTarget).toBe(3000);
    expect(result.byType).toHaveLength(2);
    expect(result.byPriority).toHaveLength(2);
  });
});
