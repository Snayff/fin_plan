import { apiClient } from "@/lib/api";
import type {
  WaterfallSummary,
  CashflowMonth,
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
  EndIncomeSourceInput,
  CreateCommittedBillInput,
  UpdateCommittedBillInput,
  CreateYearlyBillInput,
  UpdateYearlyBillInput,
  CreateDiscretionaryCategoryInput,
  UpdateDiscretionaryCategoryInput,
  CreateSavingsAllocationInput,
  UpdateSavingsAllocationInput,
  ConfirmBatchInput,
  UpsertYearBudgetInput,
} from "@finplan/shared";

export const waterfallService = {
  getSummary: () => apiClient.get<WaterfallSummary>("/api/waterfall"),
  getCashflow: (year: number) =>
    apiClient.get<CashflowMonth[]>(`/api/waterfall/cashflow?year=${year}`),

  // Income
  listIncome: () => apiClient.get<any[]>("/api/waterfall/income"),
  listEndedIncome: () => apiClient.get<any[]>("/api/waterfall/income/ended"),
  createIncome: (data: CreateIncomeSourceInput) =>
    apiClient.post<any>("/api/waterfall/income", data),
  updateIncome: (id: string, data: UpdateIncomeSourceInput) =>
    apiClient.patch<any>(`/api/waterfall/income/${id}`, data),
  deleteIncome: (id: string) => apiClient.delete<void>(`/api/waterfall/income/${id}`),
  endIncome: (id: string, data: EndIncomeSourceInput) =>
    apiClient.post<any>(`/api/waterfall/income/${id}/end`, data),
  reactivateIncome: (id: string) => apiClient.post<any>(`/api/waterfall/income/${id}/reactivate`),
  confirmIncome: (id: string) => apiClient.post<any>(`/api/waterfall/income/${id}/confirm`),

  // Committed bills
  listCommitted: () => apiClient.get<any[]>("/api/waterfall/committed"),
  createCommitted: (data: CreateCommittedBillInput) =>
    apiClient.post<any>("/api/waterfall/committed", data),
  updateCommitted: (id: string, data: UpdateCommittedBillInput) =>
    apiClient.patch<any>(`/api/waterfall/committed/${id}`, data),
  deleteCommitted: (id: string) => apiClient.delete<void>(`/api/waterfall/committed/${id}`),
  confirmCommitted: (id: string) => apiClient.post<any>(`/api/waterfall/committed/${id}/confirm`),

  // Yearly bills
  listYearly: () => apiClient.get<any[]>("/api/waterfall/yearly"),
  createYearly: (data: CreateYearlyBillInput) => apiClient.post<any>("/api/waterfall/yearly", data),
  updateYearly: (id: string, data: UpdateYearlyBillInput) =>
    apiClient.patch<any>(`/api/waterfall/yearly/${id}`, data),
  deleteYearly: (id: string) => apiClient.delete<void>(`/api/waterfall/yearly/${id}`),
  confirmYearly: (id: string) => apiClient.post<any>(`/api/waterfall/yearly/${id}/confirm`),

  // Discretionary
  listDiscretionary: () => apiClient.get<any[]>("/api/waterfall/discretionary"),
  createDiscretionary: (data: CreateDiscretionaryCategoryInput) =>
    apiClient.post<any>("/api/waterfall/discretionary", data),
  updateDiscretionary: (id: string, data: UpdateDiscretionaryCategoryInput) =>
    apiClient.patch<any>(`/api/waterfall/discretionary/${id}`, data),
  deleteDiscretionary: (id: string) => apiClient.delete<void>(`/api/waterfall/discretionary/${id}`),
  confirmDiscretionary: (id: string) =>
    apiClient.post<any>(`/api/waterfall/discretionary/${id}/confirm`),

  // Savings
  listSavings: () => apiClient.get<any[]>("/api/waterfall/savings"),
  createSavings: (data: CreateSavingsAllocationInput) =>
    apiClient.post<any>("/api/waterfall/savings", data),
  updateSavings: (id: string, data: UpdateSavingsAllocationInput) =>
    apiClient.patch<any>(`/api/waterfall/savings/${id}`, data),
  deleteSavings: (id: string) => apiClient.delete<void>(`/api/waterfall/savings/${id}`),
  confirmSavings: (id: string) => apiClient.post<any>(`/api/waterfall/savings/${id}/confirm`),

  // History + batch
  getHistory: (type: string, id: string) =>
    apiClient.get<any[]>(`/api/waterfall/history/${type}/${id}`),
  confirmBatch: (data: ConfirmBatchInput) =>
    apiClient.post<void>("/api/waterfall/confirm-batch", data),
  deleteAll: () => apiClient.delete<void>("/api/waterfall/all", { confirm: true }),

  // Planner year budget (waterfall-adjacent)
  getYearBudget: (year: number) => apiClient.get<any>(`/api/planner/budget/${year}`),
  upsertYearBudget: (year: number, data: UpsertYearBudgetInput) =>
    apiClient.put<any>(`/api/planner/budget/${year}`, data),
};
