import { apiClient } from '../lib/api';
import type {
  Liability,
  LiabilityPayment,
  EnhancedLiability,
  LiabilitySummary,
  PayoffProjection,
  CreateLiabilityInput,
  UpdateLiabilityInput,
  AllocatePaymentInput,
  Transaction,
} from '../types';
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const liabilityService = {
  async getLiabilities(): Promise<{ liabilities: Liability[] }> {
    return apiClient.get<{ liabilities: Liability[] }>('/api/liabilities', getToken() || undefined);
  },

  async getEnhancedLiabilities(): Promise<{ liabilities: EnhancedLiability[] }> {
    return apiClient.get<{ liabilities: EnhancedLiability[] }>('/api/liabilities?enhanced=true', getToken() || undefined);
  },

  async getLiability(id: string): Promise<{ liability: Liability }> {
    return apiClient.get<{ liability: Liability }>(`/api/liabilities/${id}`, getToken() || undefined);
  },

  async getLiabilityPayments(id: string): Promise<{ payments: LiabilityPayment[] }> {
    return apiClient.get<{ payments: LiabilityPayment[] }>(`/api/liabilities/${id}/payments`, getToken() || undefined);
  },

  async getPayoffProjection(id: string): Promise<{ projection: PayoffProjection }> {
    return apiClient.get<{ projection: PayoffProjection }>(`/api/liabilities/${id}/projection`, getToken() || undefined);
  },

  async getUnallocatedTransactions(liabilityId: string): Promise<{ transactions: Transaction[] }> {
    return apiClient.get<{ transactions: Transaction[] }>(`/api/liabilities/${liabilityId}/unallocated`, getToken() || undefined);
  },

  async createLiability(data: CreateLiabilityInput): Promise<{ liability: Liability }> {
    return apiClient.post<{ liability: Liability }>('/api/liabilities', data, getToken() || undefined);
  },

  async updateLiability(id: string, data: UpdateLiabilityInput): Promise<{ liability: Liability }> {
    return apiClient.put<{ liability: Liability }>(`/api/liabilities/${id}`, data, getToken() || undefined);
  },

  async allocatePayment(liabilityId: string, data: AllocatePaymentInput): Promise<{ payment: LiabilityPayment }> {
    return apiClient.post<{ payment: LiabilityPayment }>(`/api/liabilities/${liabilityId}/allocate`, data, getToken() || undefined);
  },

  async removePaymentAllocation(paymentId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/liabilities/payments/${paymentId}`, getToken() || undefined);
  },

  async deleteLiability(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/liabilities/${id}`, getToken() || undefined);
  },

  async getLiabilitySummary(): Promise<LiabilitySummary> {
    return apiClient.get<LiabilitySummary>('/api/liabilities/summary', getToken() || undefined);
  },
};
