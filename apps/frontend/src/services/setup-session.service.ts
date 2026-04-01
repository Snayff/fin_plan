import { apiClient } from "@/lib/api";

export interface SetupSession {
  id: string;
  householdId: string;
  currentStep: number;
  startedAt: string;
  updatedAt: string;
}

export const setupSessionService = {
  getSession: () => apiClient.get<SetupSession | null>("/api/setup-session"),
  createSession: () => apiClient.post<SetupSession>("/api/setup-session", {}),
  updateSession: (data: { currentStep: number }) =>
    apiClient.patch<SetupSession>("/api/setup-session", data),
  deleteSession: () => apiClient.delete<void>("/api/setup-session"),
};
