import { apiClient } from '../lib/api';
import type { DashboardSummary, TrendData } from '../types';
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const dashboardService = {
  async getSummary(options?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    const query = params.toString();
    return apiClient.get<DashboardSummary>(
      `/dashboard/summary${query ? `?${query}` : ''}`,
      getToken() || undefined
    );
  },

  async getNetWorthTrend(months: number = 6): Promise<{ trend: TrendData[] }> {
    return apiClient.get<{ trend: TrendData[] }>(
      `/dashboard/net-worth-trend?months=${months}`,
      getToken() || undefined
    );
  },

  async getIncomeExpenseTrend(months: number = 6): Promise<{ trend: TrendData[] }> {
    return apiClient.get<{ trend: TrendData[] }>(
      `/dashboard/income-expense-trend?months=${months}`,
      getToken() || undefined
    );
  },
};
