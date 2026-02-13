import { apiClient } from '../lib/api';
import type {
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalContributionInput,
  LinkTransactionToGoalInput,
} from '../types';

export const goalService = {
  /**
   * Get all goals with progress data
   */
  getGoals: () => apiClient.get('/api/goals').then((res: any) => res.data),

  /**
   * Get a single goal by ID
   */
  getGoalById: (id: string) => apiClient.get(`/api/goals/${id}`).then((res: any) => res.data),

  /**
   * Get contribution history for a goal
   */
  getGoalContributions: (id: string) =>
    apiClient.get(`/api/goals/${id}/contributions`).then((res: any) => res.data),

  /**
   * Create a new goal
   */
  createGoal: (data: CreateGoalInput) => apiClient.post('/api/goals', data).then((res: any) => res.data),

  /**
   * Update goal properties
   */
  updateGoal: (id: string, data: UpdateGoalInput) =>
    apiClient.put(`/api/goals/${id}`, data).then((res: any) => res.data),

  /**
   * Add a manual contribution to a goal
   */
  addContribution: (goalId: string, data: CreateGoalContributionInput) =>
    apiClient.post(`/api/goals/${goalId}/contributions`, data).then((res: any) => res.data),

  /**
   * Link an existing transaction to a goal as a contribution
   */
  linkTransaction: (goalId: string, data: LinkTransactionToGoalInput) =>
    apiClient.post(`/api/goals/${goalId}/link-transaction`, data).then((res: any) => res.data),

  /**
   * Delete a goal
   */
  deleteGoal: (id: string) => apiClient.delete(`/api/goals/${id}`).then((res: any) => res.data),

  /**
   * Get goal summary statistics
   */
  getSummary: () => apiClient.get('/api/goals/summary').then((res: any) => res.data),
};
