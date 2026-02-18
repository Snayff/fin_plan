import { apiClient } from '../lib/api';
import type {
  Liability,
  EnhancedLiability,
  LiabilitySummary,
  PayoffProjection,
  CreateLiabilityInput,
  UpdateLiabilityInput,
} from '../types';

export const liabilityService = {
  async getLiabilities(): Promise<{ liabilities: Liability[] }> {
    return apiClient.get<{ liabilities: Liability[] }>('/api/liabilities');
  },

  async getEnhancedLiabilities(): Promise<{ liabilities: EnhancedLiability[] }> {
    return apiClient.get<{ liabilities: EnhancedLiability[] }>('/api/liabilities?enhanced=true');
  },

  async getLiability(id: string): Promise<{ liability: Liability }> {
    return apiClient.get<{ liability: Liability }>(`/api/liabilities/${id}`);
  },

  async getPayoffProjection(id: string): Promise<{ projection: PayoffProjection }> {
    return apiClient.get<{ projection: PayoffProjection }>(`/api/liabilities/${id}/projection`);
  },

  async createLiability(data: CreateLiabilityInput): Promise<{ liability: Liability }> {
    return apiClient.post<{ liability: Liability }>('/api/liabilities', data);
  },

  async updateLiability(id: string, data: UpdateLiabilityInput): Promise<{ liability: Liability }> {
    return apiClient.put<{ liability: Liability }>(`/api/liabilities/${id}`, data);
  },

  async deleteLiability(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/liabilities/${id}`);
  },

  async getLiabilitySummary(): Promise<LiabilitySummary> {
    return apiClient.get<LiabilitySummary>('/api/liabilities/summary');
  },
};
