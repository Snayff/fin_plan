import { apiClient } from "@/lib/api";
import type { CreatePurchaseInput, UpdatePurchaseInput } from "@finplan/shared";

export const plannerService = {
  // Purchases
  listPurchases: (year: number) => apiClient.get<any[]>(`/api/planner/purchases?year=${year}`),
  createPurchase: (data: CreatePurchaseInput) =>
    apiClient.post<any>("/api/planner/purchases", data),
  updatePurchase: (id: string, data: UpdatePurchaseInput) =>
    apiClient.patch<any>(`/api/planner/purchases/${id}`, data),
  deletePurchase: (id: string) => apiClient.delete<void>(`/api/planner/purchases/${id}`),
};
