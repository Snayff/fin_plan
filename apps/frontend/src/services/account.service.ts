import { apiClient } from '../lib/api';
import type { Account, CreateAccountInput } from '../types';
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const accountService = {
  async getAccounts(): Promise<{ accounts: Account[] }> {
    return apiClient.get<{ accounts: Account[] }>('/api/accounts', getToken() || undefined);
  },

  async getAccount(id: string): Promise<{ account: Account }> {
    return apiClient.get<{ account: Account }>(`/api/accounts/${id}`, getToken() || undefined);
  },

  async getAccountSummary(id: string): Promise<any> {
    return apiClient.get<any>(`/api/accounts/${id}/summary`, getToken() || undefined);
  },

  async createAccount(data: CreateAccountInput): Promise<{ account: Account }> {
    return apiClient.post<{ account: Account }>('/api/accounts', data, getToken() || undefined);
  },

  async updateAccount(id: string, data: Partial<CreateAccountInput>): Promise<{ account: Account }> {
    return apiClient.put<{ account: Account }>(`/api/accounts/${id}`, data, getToken() || undefined);
  },

  async deleteAccount(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/accounts/${id}`, getToken() || undefined);
  },
};
