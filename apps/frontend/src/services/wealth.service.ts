import { apiClient } from "@/lib/api";
import type {
  WealthSummary,
  IsaAllowance,
  CreateWealthAccountInput,
  UpdateWealthAccountInput,
  UpdateValuationInput,
  ConfirmBatchWealthInput,
} from "@finplan/shared";

export const wealthService = {
  getSummary: () => apiClient.get<WealthSummary>("/api/wealth/summary"),
  getIsaAllowance: () => apiClient.get<IsaAllowance[]>("/api/wealth/isa-allowance"),
  listAccounts: () => apiClient.get<any[]>("/api/wealth/accounts"),
  getAccount: (id: string) => apiClient.get<any>(`/api/wealth/accounts/${id}`),
  createAccount: (data: CreateWealthAccountInput) =>
    apiClient.post<any>("/api/wealth/accounts", data),
  updateAccount: (id: string, data: UpdateWealthAccountInput) =>
    apiClient.patch<any>(`/api/wealth/accounts/${id}`, data),
  deleteAccount: (id: string) => apiClient.delete<void>(`/api/wealth/accounts/${id}`),
  updateValuation: (id: string, data: UpdateValuationInput) =>
    apiClient.patch<any>(`/api/wealth/accounts/${id}/valuation`, data),
  confirmAccount: (id: string) => apiClient.post<any>(`/api/wealth/accounts/${id}/confirm`),
  confirmBatch: (data: ConfirmBatchWealthInput) =>
    apiClient.post<void>("/api/wealth/accounts/confirm-batch", data),
  getHistory: (id: string) => apiClient.get<any[]>(`/api/wealth/accounts/${id}/history`),
};
