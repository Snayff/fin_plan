import { apiClient } from '../lib/api';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  TransactionListResponse,
  TransactionSummary,
} from '../types';

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
      `/api/transactions${query ? `?${query}` : ''}`
    );
  },

  async getAllTransactions(): Promise<TransactionListResponse> {
    return apiClient.get<TransactionListResponse>('/api/transactions?limit=10000');
  },

  async getTransaction(id: string): Promise<{ transaction: Transaction }> {
    return apiClient.get<{ transaction: Transaction }>(`/api/transactions/${id}`);
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
      `/api/transactions/summary${query ? `?${query}` : ''}`
    );
  },

  async createTransaction(data: CreateTransactionInput): Promise<{ transaction: Transaction }> {
    return apiClient.post<{ transaction: Transaction }>('/api/transactions', data);
  },

  async updateTransaction(
    id: string,
    data: Partial<CreateTransactionInput>
  ): Promise<{ transaction: Transaction }> {
    return apiClient.put<{ transaction: Transaction }>(`/api/transactions/${id}`, data);
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/transactions/${id}`);
  },
};
