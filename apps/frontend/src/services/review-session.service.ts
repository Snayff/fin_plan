import { apiClient } from "@/lib/api";

export interface ReviewSession {
  id: string;
  householdId: string;
  currentStep: number;
  confirmedItems: Record<string, string[]>;
  updatedItems: Record<string, { from: number; to: number }>;
  startedAt: string;
  updatedAt: string;
}

export const reviewSessionService = {
  getSession: () => apiClient.get<ReviewSession | null>("/api/review-session"),
  createSession: () => apiClient.post<ReviewSession>("/api/review-session", {}),
  updateSession: (
    data: Partial<Pick<ReviewSession, "currentStep" | "confirmedItems" | "updatedItems">>
  ) => apiClient.patch<ReviewSession>("/api/review-session", data),
  deleteSession: () => apiClient.delete<void>("/api/review-session"),
};
