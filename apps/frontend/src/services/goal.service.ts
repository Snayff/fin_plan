import { apiClient } from '../lib/api';
import type {
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalContributionInput,
  LinkTransactionToGoalInput,
  EnhancedGoal,
  Goal,
  GoalContribution,
} from '../types';

interface GoalsResponse {
  goals: EnhancedGoal[];
}

interface GoalResponse {
  goal: Goal;
}

interface ContributionsResponse {
  contributions: GoalContribution[];
}

interface GoalActionResponse {
  contribution?: GoalContribution;
  goal: Goal;
}

interface DeleteResponse {
  message: string;
}

interface GoalSummaryResponse {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  byType: Array<{
    type: string;
    saved: number;
    target: number;
    count: number;
  }>;
  byPriority: Array<{
    priority: string;
    saved: number;
    target: number;
    count: number;
  }>;
}

export const goalService = {
  /**
   * Get all goals with progress data.
   * Passes local-timezone period boundaries so income goals are counted correctly.
   */
  async getGoals(): Promise<GoalsResponse> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    const params = new URLSearchParams({ monthStart, yearStart, periodEnd });
    return apiClient.get<GoalsResponse>(`/api/goals?${params}`);
  },

  /**
   * Get a single goal by ID
   */
  async getGoalById(id: string): Promise<GoalResponse> {
    return apiClient.get<GoalResponse>(`/api/goals/${id}`);
  },

  /**
   * Get contribution history for a goal
   */
  async getGoalContributions(id: string): Promise<ContributionsResponse> {
    return apiClient.get<ContributionsResponse>(`/api/goals/${id}/contributions`);
  },

  /**
   * Create a new goal
   */
  async createGoal(data: CreateGoalInput): Promise<GoalResponse> {
    return apiClient.post<GoalResponse>('/api/goals', data);
  },

  /**
   * Update goal properties
   */
  async updateGoal(id: string, data: UpdateGoalInput): Promise<GoalResponse> {
    return apiClient.put<GoalResponse>(`/api/goals/${id}`, data);
  },

  /**
   * Add a manual contribution to a goal
   */
  async addContribution(goalId: string, data: CreateGoalContributionInput): Promise<GoalActionResponse> {
    return apiClient.post<GoalActionResponse>(`/api/goals/${goalId}/contributions`, data);
  },

  /**
   * Link an existing transaction to a goal as a contribution
   */
  async linkTransaction(goalId: string, data: LinkTransactionToGoalInput): Promise<GoalActionResponse> {
    return apiClient.post<GoalActionResponse>(`/api/goals/${goalId}/link-transaction`, data);
  },

  /**
   * Delete a goal
   */
  async deleteGoal(id: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/api/goals/${id}`);
  },

  /**
   * Get goal summary statistics
   */
  async getSummary(): Promise<GoalSummaryResponse> {
    return apiClient.get<GoalSummaryResponse>('/api/goals/summary');
  },
};
