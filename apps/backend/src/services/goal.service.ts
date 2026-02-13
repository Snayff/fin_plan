import { prisma } from '../config/database';
import { GoalType, Priority, GoalStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { differenceInDays, addMonths } from 'date-fns';

export interface CreateGoalInput {
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  targetDate?: string | Date;
  priority?: Priority;
  icon?: string;
  linkedAccountId?: string;
  metadata?: {
    milestones?: Array<{
      percentage: number;
      label: string;
      reached: boolean;
    }>;
    notes?: string;
  };
}

export interface UpdateGoalInput {
  name?: string;
  description?: string;
  type?: GoalType;
  targetAmount?: number;
  targetDate?: string | Date;
  priority?: Priority;
  status?: GoalStatus;
  icon?: string;
  linkedAccountId?: string;
  metadata?: Record<string, any>;
}

export interface CreateGoalContributionInput {
  amount: number;
  date?: string | Date;
  notes?: string;
}

export interface LinkTransactionToGoalInput {
  transactionId: string;
  amount: number;
  notes?: string;
}

export const goalService = {
  /**
   * Create a new goal with default milestones
   */
  async createGoal(userId: string, data: CreateGoalInput) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Goal name is required');
    }

    if (data.targetAmount === undefined || data.targetAmount < 0) {
      throw new ValidationError('Target amount must be non-negative');
    }

    // If linkedAccountId provided, verify it exists and belongs to user
    if (data.linkedAccountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.linkedAccountId, userId },
      });
      if (!account) {
        throw new NotFoundError('Account not found');
      }
    }

    // Set default milestones if not provided
    const metadata = data.metadata || {};
    if (!metadata.milestones) {
      metadata.milestones = [
        { percentage: 25, label: '25% Complete', reached: false },
        { percentage: 50, label: '50% Complete', reached: false },
        { percentage: 75, label: '75% Complete', reached: false },
      ];
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description,
        type: data.type,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        priority: data.priority || 'medium',
        icon: data.icon,
        linkedAccountId: data.linkedAccountId,
        metadata,
      },
    });

    return goal;
  },

  /**
   * Get a single goal by ID with ownership check
   */
  async getGoalById(goalId: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: {
        linkedAccount: true,
      },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    return goal;
  },

  /**
   * Get all goals for a user
   */
  async getUserGoals(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { priority: 'asc' }, // high first (alphabetically)
        { createdAt: 'desc' },
      ],
      include: {
        linkedAccount: true,
      },
    });

    return goals;
  },

  /**
   * Get all goals for a user with enhanced progress data
   */
  async getUserGoalsWithProgress(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { priority: 'asc' }, // high first
        { createdAt: 'desc' },
      ],
      include: {
        linkedAccount: true,
        contributions: {
          orderBy: { date: 'desc' },
          include: {
            transaction: {
              select: {
                id: true,
                name: true,
                amount: true,
                date: true,
              },
            },
          },
        },
      },
    });

    // Enhance each goal with calculated data
    const enhancedGoals = goals.map((goal) => {
      const currentAmount = Number(goal.currentAmount);
      const targetAmount = Number(goal.targetAmount);

      // Calculate progress percentage
      const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      // Calculate days remaining
      const daysRemaining = goal.targetDate
        ? differenceInDays(new Date(goal.targetDate), new Date())
        : null;

      // Calculate average monthly contribution
      const contributions = goal.contributions;
      let averageMonthlyContribution = 0;
      if (contributions.length > 0) {
        const totalContributed = contributions.reduce(
          (sum, c) => sum + Number(c.amount),
          0
        );
        const firstContribution = contributions[contributions.length - 1];
        if (firstContribution) {
          const monthsSinceFirst = Math.max(
            1,
            differenceInDays(new Date(), new Date(firstContribution.date)) / 30
          );
          averageMonthlyContribution = totalContributed / monthsSinceFirst;
        }
      }

      // Calculate projected completion date
      let projectedCompletionDate: string | null = null;
      let recommendedMonthlyContribution: number | null = null;
      let isOnTrack = false;

      if (targetAmount > currentAmount) {
        const remaining = targetAmount - currentAmount;

        // Projected completion based on current contribution rate
        if (averageMonthlyContribution > 0) {
          const monthsToComplete = remaining / averageMonthlyContribution;
          projectedCompletionDate = addMonths(new Date(), monthsToComplete).toISOString();

          // Check if on track
          if (goal.targetDate && daysRemaining !== null) {
            const monthsRemaining = daysRemaining / 30;
            isOnTrack = monthsToComplete <= monthsRemaining;
          }
        }

        // Recommended monthly contribution to meet target date
        if (goal.targetDate && daysRemaining !== null && daysRemaining > 0) {
          const monthsRemaining = Math.max(1, daysRemaining / 30);
          recommendedMonthlyContribution = remaining / monthsRemaining;
          
          // If we have a contribution rate, check if on track
          if (averageMonthlyContribution > 0) {
            isOnTrack = averageMonthlyContribution >= recommendedMonthlyContribution;
          }
        }
      } else {
        // Goal is already complete or exceeded
        isOnTrack = true;
      }

      // Update milestone status in metadata
      const metadata = (goal.metadata as any) || {};
      if (metadata.milestones) {
        metadata.milestones = metadata.milestones.map((milestone: any) => ({
          ...milestone,
          reached: progressPercentage >= milestone.percentage,
        }));
      }

      return {
        ...goal,
        currentAmount,
        targetAmount,
        contributions: contributions.map((c) => ({
          ...c,
          amount: Number(c.amount),
        })),
        progressPercentage: Math.min(progressPercentage, 100),
        daysRemaining,
        averageMonthlyContribution,
        projectedCompletionDate,
        recommendedMonthlyContribution,
        isOnTrack,
        metadata,
      };
    });

    return enhancedGoals;
  },

  /**
   * Update goal properties
   */
  async updateGoal(goalId: string, userId: string, data: UpdateGoalInput) {
    // Verify goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existingGoal) {
      throw new NotFoundError('Goal not found');
    }

    // Validate provided fields
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Goal name cannot be empty');
    }

    if (data.targetAmount !== undefined && data.targetAmount < 0) {
      throw new ValidationError('Target amount must be non-negative');
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.linkedAccountId !== undefined) updateData.linkedAccountId = data.linkedAccountId;

    // Merge metadata if provided
    if (data.metadata !== undefined) {
      const existingMeta = (existingGoal.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        linkedAccount: true,
      },
    });

    return goal;
  },

  /**
   * Add a manual contribution to a goal
   */
  async addContribution(
    goalId: string,
    userId: string,
    data: CreateGoalContributionInput
  ) {
    // Verify goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    if (data.amount <= 0) {
      throw new ValidationError('Contribution amount must be greater than 0');
    }

    const contributionDate = data.date ? new Date(data.date) : new Date();

    // Use transaction to create contribution and update goal amount
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.goalContribution.create({
        data: {
          goalId,
          amount: data.amount,
          date: contributionDate,
          notes: data.notes,
        },
      });

      // Update goal current amount
      const newAmount = Number(goal.currentAmount) + data.amount;
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          // Auto-complete if target reached
          status:
            newAmount >= Number(goal.targetAmount) && goal.status === 'active'
              ? 'completed'
              : goal.status,
        },
      });

      return { contribution, goal: updatedGoal };
    });

    return result;
  },

  /**
   * Link an existing transaction to a goal as a contribution
   */
  async linkTransactionToGoal(
    goalId: string,
    userId: string,
    data: LinkTransactionToGoalInput
  ) {
    // Verify goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    // Verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id: data.transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (data.amount <= 0) {
      throw new ValidationError('Contribution amount must be greater than 0');
    }

    // Use transaction to create contribution and update goal amount
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution linked to transaction
      const contribution = await tx.goalContribution.create({
        data: {
          goalId,
          transactionId: data.transactionId,
          amount: data.amount,
          date: transaction.date,
          notes: data.notes,
        },
      });

      // Update goal current amount
      const newAmount = Number(goal.currentAmount) + data.amount;
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          // Auto-complete if target reached
          status:
            newAmount >= Number(goal.targetAmount) && goal.status === 'active'
              ? 'completed'
              : goal.status,
        },
      });

      return { contribution, goal: updatedGoal };
    });

    return result;
  },

  /**
   * Get contribution history for a goal
   */
  async getGoalContributions(goalId: string, userId: string) {
    // Verify goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    const contributions = await prisma.goalContribution.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
      include: {
        transaction: {
          select: {
            id: true,
            name: true,
            amount: true,
            date: true,
            type: true,
          },
        },
      },
    });

    return contributions.map((c) => ({
      ...c,
      amount: Number(c.amount),
    }));
  },

  /**
   * Delete a goal
   * Contributions are automatically deleted due to cascade
   */
  async deleteGoal(goalId: string, userId: string) {
    // Verify goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { message: 'Goal deleted successfully' };
  },

  /**
   * Get goal summary statistics for a user
   */
  async getGoalSummary(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        contributions: true,
      },
    });

    if (goals.length === 0) {
      return {
        totalSaved: 0,
        totalTarget: 0,
        activeGoals: 0,
        completedGoals: 0,
        byType: [],
        byPriority: [],
      };
    }

    let totalSaved = 0;
    let totalTarget = 0;
    let activeGoals = 0;
    let completedGoals = 0;

    const byTypeMap = new Map<GoalType, { saved: number; target: number; count: number }>();
    const byPriorityMap = new Map<Priority, { saved: number; target: number; count: number }>();

    goals.forEach((goal) => {
      const saved = Number(goal.currentAmount);
      const target = Number(goal.targetAmount);

      totalSaved += saved;
      totalTarget += target;

      if (goal.status === 'active') activeGoals++;
      if (goal.status === 'completed') completedGoals++;

      // Group by type
      const typeData = byTypeMap.get(goal.type) || { saved: 0, target: 0, count: 0 };
      byTypeMap.set(goal.type, {
        saved: typeData.saved + saved,
        target: typeData.target + target,
        count: typeData.count + 1,
      });

      // Group by priority
      const priorityData = byPriorityMap.get(goal.priority) || {
        saved: 0,
        target: 0,
        count: 0,
      };
      byPriorityMap.set(goal.priority, {
        saved: priorityData.saved + saved,
        target: priorityData.target + target,
        count: priorityData.count + 1,
      });
    });

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      saved: data.saved,
      target: data.target,
      count: data.count,
    }));

    const byPriority = Array.from(byPriorityMap.entries()).map(([priority, data]) => ({
      priority,
      saved: data.saved,
      target: data.target,
      count: data.count,
    }));

    return {
      totalSaved,
      totalTarget,
      activeGoals,
      completedGoals,
      byType,
      byPriority,
    };
  },
};
