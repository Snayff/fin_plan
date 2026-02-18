import { apiClient } from '../lib/api';
import type { DashboardSummary, TrendData } from '../types';

export const dashboardService = {
  async getSummary(options?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    const query = params.toString();
    return apiClient.get<DashboardSummary>(
      `/api/dashboard/summary${query ? `?${query}` : ''}`
    );
  },

  async getNetWorthTrend(months: number = 6): Promise<{ trend: TrendData[] }> {
    return apiClient.get<{ trend: TrendData[] }>(
      `/api/dashboard/net-worth-trend?months=${months}`
    );
  },

  async getIncomeExpenseTrend(months: number = 6): Promise<{ trend: TrendData[] }> {
    return apiClient.get<{ trend: TrendData[] }>(
      `/api/dashboard/income-expense-trend?months=${months}`
    );
  },
};
