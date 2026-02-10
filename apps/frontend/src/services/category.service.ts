import { apiClient } from '../lib/api';
import type { Category, CategoryType } from '../types';

export const categoryService = {
  async getCategories(): Promise<{ categories: Category[] }> {
    return apiClient.get<{ categories: Category[] }>('/api/categories');
  },

  async getCategoriesByType(type: CategoryType): Promise<{ categories: Category[] }> {
    return apiClient.get<{ categories: Category[] }>(`/api/categories/${type}`);
  },
};
