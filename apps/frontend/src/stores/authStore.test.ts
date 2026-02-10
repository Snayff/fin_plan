import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import { setAuthenticated, setUnauthenticated, mockUser } from "../test/helpers/auth";

vi.mock("../services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from "../services/auth.service";

beforeEach(() => {
  setUnauthenticated();
  vi.clearAllMocks();
});

describe("useAuthStore", () => {
  describe("initial state", () => {
    it("user is null", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("accessToken is null", () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it("isAuthenticated is false", () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("isLoading is false", () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("error is null", () => {
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("setUser", () => {
    it("sets user and token", () => {
      useAuthStore.getState().setUser(mockUser, "test-token");
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("test-token");
    });

    it("sets isAuthenticated to true", () => {
      useAuthStore.getState().setUser(mockUser, "test-token");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("clears error", () => {
      useAuthStore.setState({ error: "some error" });
      useAuthStore.getState().setUser(mockUser, "test-token");
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("login", () => {
    it("sets isLoading during request", async () => {
      let loadingDuringRequest = false;
      (authService.login as any).mockImplementation(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return { user: mockUser, accessToken: "token", refreshToken: "refresh" };
      });

      await useAuthStore.getState().login({ email: "test@test.com", password: "password123456" });
      expect(loadingDuringRequest).toBe(true);
    });

    it("sets user and token on success", async () => {
      (authService.login as any).mockResolvedValue({
        user: mockUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await useAuthStore.getState().login({ email: "test@test.com", password: "password123456" });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("access-token");
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("sets error on failure", async () => {
      (authService.login as any).mockRejectedValue({ message: "Invalid credentials" });

      try {
        await useAuthStore.getState().login({ email: "test@test.com", password: "wrong" });
      } catch {
        // expected
      }

      expect(useAuthStore.getState().error).toBe("Invalid credentials");
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("re-throws error for callers", async () => {
      const error = { message: "Invalid credentials" };
      (authService.login as any).mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login({ email: "test@test.com", password: "wrong" })
      ).rejects.toEqual(error);
    });
  });

  describe("logout", () => {
    it("clears all auth state", async () => {
      setAuthenticated();
      (authService.logout as any).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("calls authService.logout", async () => {
      setAuthenticated();
      (authService.logout as any).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();
      expect(authService.logout).toHaveBeenCalled();
    });

    it("handles logout API failure gracefully", async () => {
      setAuthenticated();
      (authService.logout as any).mockRejectedValue(new Error("Network error"));

      // Should not throw
      await useAuthStore.getState().logout();

      // Still clears state even if API call fails
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useAuthStore.setState({ error: "some error" });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("updateAccessToken", () => {
    it("updates the access token", () => {
      useAuthStore.getState().updateAccessToken("new-token");
      expect(useAuthStore.getState().accessToken).toBe("new-token");
    });
  });
});
