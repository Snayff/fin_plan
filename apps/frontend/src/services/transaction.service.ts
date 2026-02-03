import { apiClient } from '../lib/api';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  TransactionListResponse,
  TransactionSummary,
} from '../types';
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const transactionService = {
  async getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const query = params.toString();
    return apiClient.get<TransactionListResponse>(
      `/transactions${query ? `?${query}` : ''}`,
      getToken() || undefined
    );
  },

  async getTransaction(id: string): Promise<{ transaction: Transaction }> {
    return apiClient.get<{ transaction: Transaction }>(`/transactions/${id}`, getToken() || undefined);
  },

  async getTransactionSummary(filters?: Partial<TransactionFilters>): Promise<TransactionSummary> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const query = params.toString();
    return apiClient.get<TransactionSummary>(
      `/transactions/summary${query ? `?${query}` : ''}`,
      getToken() || undefined
    );
  },

  async createTransaction(data: CreateTransactionInput): Promise<{ transaction: Transaction }> {
    return apiClient.post<{ transaction: Transaction }>('/transactions', data, getToken() || undefined);
  },

  async updateTransaction(
    id: string,
    data: Partial<CreateTransactionInput>
  ): Promise<{ transaction: Transaction }> {
    return apiClient.put<{ transaction: Transaction }>(`/transactions/${id}`, data, getToken() || undefined);
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/transactions/${id}`, getToken() || undefined);
  },
};
