import { apiClient } from "@/lib/api";
import type {
  CreateGiftPersonInput,
  UpdateGiftPersonInput,
  CreateGiftEventInput,
  UpdateGiftEventInput,
  UpsertGiftAllocationInput,
  BulkUpsertAllocationsInput,
  SetGiftBudgetInput,
  SetGiftPlannerModeInput,
  GiftPlannerStateResponse,
  GiftPersonDetailResponse,
  GiftUpcomingResponse,
} from "@finplan/shared";

export const giftsApi = {
  // ─── Queries ────────────────────────────────────────────────────────────────
  getState: (year: number) =>
    apiClient.get<GiftPlannerStateResponse>(`/api/gifts/state?year=${year}`),

  getPerson: (id: string, year: number) =>
    apiClient.get<GiftPersonDetailResponse>(`/api/gifts/people/${id}?year=${year}`),

  getUpcoming: (year: number) =>
    apiClient.get<GiftUpcomingResponse>(`/api/gifts/upcoming?year=${year}`),

  listYears: () => apiClient.get<number[]>(`/api/gifts/years`),

  listConfigPeople: (filter: "all" | "household" | "non-household", year: number) =>
    apiClient.get<any[]>(`/api/gifts/config/people?filter=${filter}&year=${year}`),

  listConfigEvents: () => apiClient.get<any[]>(`/api/gifts/config/events`),

  // ─── Person mutations ───────────────────────────────────────────────────────
  createPerson: (data: CreateGiftPersonInput) => apiClient.post<any>(`/api/gifts/people`, data),

  updatePerson: (id: string, data: UpdateGiftPersonInput) =>
    apiClient.patch<any>(`/api/gifts/people/${id}`, data),

  deletePerson: (id: string) => apiClient.delete<void>(`/api/gifts/people/${id}`),

  // ─── Event mutations ────────────────────────────────────────────────────────
  createEvent: (data: CreateGiftEventInput) => apiClient.post<any>(`/api/gifts/events`, data),

  updateEvent: (id: string, data: UpdateGiftEventInput) =>
    apiClient.patch<any>(`/api/gifts/events/${id}`, data),

  deleteEvent: (id: string) => apiClient.delete<void>(`/api/gifts/events/${id}`),

  // ─── Allocation mutations ───────────────────────────────────────────────────
  upsertAllocation: (
    personId: string,
    eventId: string,
    year: number,
    data: UpsertGiftAllocationInput
  ) => apiClient.put<any>(`/api/gifts/allocations/${personId}/${eventId}/${year}`, data),

  bulkUpsert: (data: BulkUpsertAllocationsInput) =>
    apiClient.post<{ count: number }>(`/api/gifts/allocations/bulk`, data),

  // ─── Budget & mode ──────────────────────────────────────────────────────────
  setBudget: (year: number, data: SetGiftBudgetInput) =>
    apiClient.put<any>(`/api/gifts/budget/${year}`, data),

  setMode: (data: SetGiftPlannerModeInput) => apiClient.put<any>(`/api/gifts/mode`, data),

  // ─── Rollover ───────────────────────────────────────────────────────────────
  dismissRollover: (year: number) => apiClient.delete<void>(`/api/gifts/rollover-banner/${year}`),
};
