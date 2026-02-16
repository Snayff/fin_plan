import { apiClient } from '../lib/api';
import type {
  RecurringRule,
  CreateRecurringRuleInput,
  UpdateRecurringRuleInput,
  PreviewOccurrencesInput,
} from '../types';

export const recurringService = {
  /**
   * Get all recurring rules for the current user
   */
  async getRecurringRules(): Promise<{ recurringRules: RecurringRule[] }> {
    return apiClient.get<{ recurringRules: RecurringRule[] }>('/api/recurring-rules');
  },

  /**
   * Get a single recurring rule by ID
   */
  async getRecurringRule(id: string): Promise<{ recurringRule: RecurringRule }> {
    return apiClient.get<{ recurringRule: RecurringRule }>(`/api/recurring-rules/${id}`);
  },

  /**
   * Create a new recurring rule
   */
  async createRecurringRule(data: CreateRecurringRuleInput): Promise<{ recurringRule: RecurringRule }> {
    return apiClient.post<{ recurringRule: RecurringRule }>('/api/recurring-rules', data);
  },

  /**
   * Update a recurring rule (triggers sync of generated transactions)
   */
  async updateRecurringRule(
    id: string,
    data: UpdateRecurringRuleInput
  ): Promise<{ recurringRule: RecurringRule }> {
    return apiClient.put<{ recurringRule: RecurringRule }>(`/api/recurring-rules/${id}`, data);
  },

  /**
   * Delete a recurring rule (keeps generated transactions)
   */
  async deleteRecurringRule(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/recurring-rules/${id}`);
  },

  /**
   * Preview occurrence dates for a recurring rule configuration
   */
  async previewOccurrences(data: PreviewOccurrencesInput): Promise<{ occurrences: string[] }> {
    return apiClient.post<{ occurrences: string[] }>('/api/recurring-rules/preview', data);
  },

  /**
   * Materialize today's transactions for all active rules
   */
  async materializeAll(): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>('/api/recurring-rules/materialize', {});
  },
};
