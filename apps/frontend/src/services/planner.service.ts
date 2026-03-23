import { apiClient } from "@/lib/api";
import type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  CreateGiftPersonInput,
  UpdateGiftPersonInput,
  CreateGiftEventInput,
  UpdateGiftEventInput,
  UpsertGiftYearRecordInput,
} from "@finplan/shared";

export const plannerService = {
  // Purchases
  listPurchases: (year: number) => apiClient.get<any[]>(`/api/planner/purchases?year=${year}`),
  createPurchase: (data: CreatePurchaseInput) =>
    apiClient.post<any>("/api/planner/purchases", data),
  updatePurchase: (id: string, data: UpdatePurchaseInput) =>
    apiClient.patch<any>(`/api/planner/purchases/${id}`, data),
  deletePurchase: (id: string) => apiClient.delete<void>(`/api/planner/purchases/${id}`),

  // Gift persons
  listGiftPersons: (year: number) =>
    apiClient.get<any[]>(`/api/planner/gifts/persons?year=${year}`),
  getGiftPerson: (id: string, year: number) =>
    apiClient.get<any>(`/api/planner/gifts/persons/${id}?year=${year}`),
  createGiftPerson: (data: CreateGiftPersonInput) =>
    apiClient.post<any>("/api/planner/gifts/persons", data),
  updateGiftPerson: (id: string, data: UpdateGiftPersonInput) =>
    apiClient.patch<any>(`/api/planner/gifts/persons/${id}`, data),
  deleteGiftPerson: (id: string) => apiClient.delete<void>(`/api/planner/gifts/persons/${id}`),

  // Gift events
  createGiftEvent: (personId: string, data: CreateGiftEventInput) =>
    apiClient.post<any>(`/api/planner/gifts/persons/${personId}/events`, data),
  updateGiftEvent: (id: string, data: UpdateGiftEventInput) =>
    apiClient.patch<any>(`/api/planner/gifts/events/${id}`, data),
  deleteGiftEvent: (id: string) => apiClient.delete<void>(`/api/planner/gifts/events/${id}`),

  // Gift year records
  upsertGiftYearRecord: (eventId: string, year: number, data: UpsertGiftYearRecordInput) =>
    apiClient.put<any>(`/api/planner/gifts/events/${eventId}/year/${year}`, data),

  // Upcoming
  getUpcomingGifts: (year: number) =>
    apiClient.get<any[]>(`/api/planner/gifts/upcoming?year=${year}`),
};
