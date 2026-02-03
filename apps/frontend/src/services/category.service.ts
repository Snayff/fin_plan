import { apiClient } from '../lib/api';
import type { Category, CategoryType } from '../types';
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const categoryService = {
  async getCategories(): Promise<{ categories: Category[] }> {
    return apiClient.get<{ categories: Category[] }>('/categories', getToken() || undefined);
  },

  async getCategoriesByType(type: CategoryType): Promise<{ categories: Category[] }> {
    return apiClient.get<{ categories: Category[] }>(`/categories/${type}`, getToken() || undefined);
  },
};
