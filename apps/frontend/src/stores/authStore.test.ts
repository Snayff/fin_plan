import { describe, it, expect, mock, beforeEach } from "bun:test";
import { useAuthStore } from "./authStore";
import { setAuthenticated, mockUser } from "../test/helpers/auth";
import { authService } from "../services/auth.service";

const loginMock = mock(() => {});
const registerMock = mock(() => {});
const logoutMock = mock(() => {});
const refreshTokenMock = mock(() => {});
const getCurrentUserMock = mock(() => {});

beforeEach(() => {
  loginMock.mockReset();
  registerMock.mockReset();
  logoutMock.mockReset();
  refreshTokenMock.mockReset();
  getCurrentUserMock.mockReset();

  (authService as any).login = loginMock;
  (authService as any).register = registerMock;
  (authService as any).logout = logoutMock;
  (authService as any).refreshToken = refreshTokenMock;
  (authService as any).getCurrentUser = getCurrentUserMock;

  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    authStatus: "initializing",
    isLoading: false,
    error: null,
  });
});

describe("useAuthStore", () => {
  describe("initial state", () => {
    it("has correct initial state", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authStatus).toBe("initializing");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("setUser", () => {
    it("sets user and token", () => {
      useAuthStore.getState().setUser(mockUser, "test-token");
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("test-token");
    });

    it("sets authenticated status", () => {
      useAuthStore.getState().setUser(mockUser, "test-token");
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.authStatus).toBe("authenticated");
    });

    it("clears error", () => {
      useAuthStore.setState({ error: "some error" });
      useAuthStore.getState().setUser(mockUser, "test-token");
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("initializeAuth", () => {
    it("hydrates auth state on refresh-token success", async () => {
      (authService.refreshToken as any).mockResolvedValue({ accessToken: "new-access-token" });
      (authService.getCurrentUser as any).mockResolvedValue({ user: mockUser });

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("new-access-token");
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.authStatus).toBe("authenticated");
    });

    it("sets unauthenticated state when refresh fails", async () => {
      (authService.refreshToken as any).mockRejectedValue({ message: "Refresh failed" });

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authStatus).toBe("unauthenticated");
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
      expect(state.authStatus).toBe("authenticated");
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
      expect(state.authStatus).toBe("unauthenticated");
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

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().authStatus).toBe("unauthenticated");
    });
  });

  describe("setUnauthenticated", () => {
    it("clears state and sets unauthenticated status", () => {
      setAuthenticated();
      useAuthStore.getState().setUnauthenticated();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authStatus).toBe("unauthenticated");
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
