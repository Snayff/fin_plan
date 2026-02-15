import { apiClient } from '../lib/api';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  TransactionListResponse,
  TransactionSummary,
} from '../types';

function toAmountNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    amount: toAmountNumber(transaction.amount),
  };
}

function normalizeTransactionListResponse(response: TransactionListResponse): TransactionListResponse {
  return {
    ...response,
    transactions: response.transactions.map(normalizeTransaction),
  };
}

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
    const response = await apiClient.get<TransactionListResponse>(
      `/api/transactions${query ? `?${query}` : ''}`
    );
    return normalizeTransactionListResponse(response);
  },

  async getAllTransactions(): Promise<TransactionListResponse> {
    const response = await apiClient.get<TransactionListResponse>('/api/transactions?limit=10000');
    return normalizeTransactionListResponse(response);
  },

  async getTransaction(id: string): Promise<{ transaction: Transaction }> {
    const response = await apiClient.get<{ transaction: Transaction }>(`/api/transactions/${id}`);
    return { transaction: normalizeTransaction(response.transaction) };
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
    const response = await apiClient.post<{ transaction: Transaction }>('/api/transactions', data);
    return { transaction: normalizeTransaction(response.transaction) };
  },

  async updateTransaction(
    id: string,
    data: Partial<CreateTransactionInput>
  ): Promise<{ transaction: Transaction }> {
    const response = await apiClient.put<{ transaction: Transaction }>(`/api/transactions/${id}`, data);
    return { transaction: normalizeTransaction(response.transaction) };
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/transactions/${id}`);
  },
};
