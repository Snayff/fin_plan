import { apiClient } from '../lib/api';
import type { Account, CreateAccountInput, EnhancedAccount } from '../types';

export const accountService = {
  // Get all accounts with enhanced data (balance, history, monthly flow)
  async getAccounts(): Promise<{ accounts: EnhancedAccount[] }> {
    return apiClient.get<{ accounts: EnhancedAccount[] }>('/api/accounts');
  },

  // Alias for backward compatibility - both return same enhanced data
  async getEnhancedAccounts(): Promise<{ accounts: EnhancedAccount[] }> {
    return this.getAccounts();
  },

  async getAccount(id: string): Promise<{ account: Account }> {
    return apiClient.get<{ account: Account }>(`/api/accounts/${id}`);
  },

  async getAccountSummary(id: string): Promise<any> {
    return apiClient.get<any>(`/api/accounts/${id}/summary`);
  },

  async createAccount(data: CreateAccountInput): Promise<{ account: Account }> {
    return apiClient.post<{ account: Account }>('/api/accounts', data);
  },

  async updateAccount(id: string, data: Partial<CreateAccountInput>): Promise<{ account: Account }> {
    return apiClient.put<{ account: Account }>(`/api/accounts/${id}`, data);
  },

  async deleteAccount(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/accounts/${id}`);
  },
};
