import { useAuthStore } from "../../stores/authStore";
import type { User } from "../../services/auth.service";

export const mockUser: User = {
  id: "user-1",
  email: "test@test.com",
  name: "Test User",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  preferences: {
    currency: "GBP",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    defaultInflationRate: 2.5,
  },
};

export function setAuthenticated(user = mockUser, token = "mock-access-token") {
  useAuthStore.setState({
    user,
    accessToken: token,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

export function setUnauthenticated() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}
