import { apiClient } from '../lib/api';
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
  AddBudgetItemInput,
  UpdateBudgetItemInput,
  BudgetSummary,
  EnhancedBudget,
  BudgetItem,
} from '../types';

interface BudgetsResponse {
  budgets: BudgetSummary[];
}

interface BudgetResponse {
  budget: EnhancedBudget;
}

interface BudgetItemResponse {
  item: BudgetItem;
}

interface DeleteResponse {
  message: string;
}

export const budgetService = {
  /**
   * Get all budgets with summary data
   */
  async getBudgets(): Promise<BudgetsResponse> {
    return apiClient.get<BudgetsResponse>('/api/budgets');
  },

  /**
   * Get a single budget by ID with tracking data
   */
  async getBudgetById(id: string): Promise<BudgetResponse> {
    return apiClient.get<BudgetResponse>(`/api/budgets/${id}`);
  },

  /**
   * Create a new budget
   */
  async createBudget(data: CreateBudgetInput): Promise<BudgetResponse> {
    return apiClient.post<BudgetResponse>('/api/budgets', data);
  },

  /**
   * Update budget properties
   */
  async updateBudget(id: string, data: UpdateBudgetInput): Promise<BudgetResponse> {
    return apiClient.put<BudgetResponse>(`/api/budgets/${id}`, data);
  },

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/api/budgets/${id}`);
  },

  /**
   * Add a line item to a budget
   */
  async addBudgetItem(budgetId: string, data: AddBudgetItemInput): Promise<BudgetItemResponse> {
    return apiClient.post<BudgetItemResponse>(`/api/budgets/${budgetId}/items`, data);
  },

  /**
   * Update a budget line item
   */
  async updateBudgetItem(budgetId: string, itemId: string, data: UpdateBudgetItemInput): Promise<BudgetItemResponse> {
    return apiClient.put<BudgetItemResponse>(`/api/budgets/${budgetId}/items/${itemId}`, data);
  },

  /**
   * Delete a budget line item
   */
  async deleteBudgetItem(budgetId: string, itemId: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/api/budgets/${budgetId}/items/${itemId}`);
  },

  /**
   * Remove all items for a category from a budget
   */
  async removeCategoryFromBudget(budgetId: string, categoryId: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/api/budgets/${budgetId}/categories/${categoryId}`);
  },
};
