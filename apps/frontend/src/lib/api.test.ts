import { describe, it, expect, mock, beforeEach } from "bun:test";
import { useAuthStore } from "../stores/authStore";
import { mockUser } from "../test/helpers/auth";
import { authService } from "../services/auth.service";

const refreshTokenMock = mock(() => Promise.resolve({ accessToken: "new-token" }));
const getCurrentUserMock = mock(() => Promise.resolve({ user: mockUser }));

import { apiClient } from "./api";

describe("ApiClient token refresh", () => {
  beforeEach(() => {
    (apiClient as any).csrfToken = null;
    (apiClient as any).isRefreshing = false;
    (apiClient as any).refreshPromise = null;
    refreshTokenMock.mockReset();
    getCurrentUserMock.mockReset();
    refreshTokenMock.mockResolvedValue({ accessToken: "new-token" });
    getCurrentUserMock.mockResolvedValue({ user: mockUser });
    (authService as any).refreshToken = refreshTokenMock;
    (authService as any).getCurrentUser = getCurrentUserMock;
  });

  it("updates access token when user is already loaded", async () => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: "old-token",
      isAuthenticated: true,
      authStatus: "authenticated",
    });

    const token = await (apiClient as any).handleTokenRefresh();

    expect(token).toBe("new-token");
    expect(useAuthStore.getState().accessToken).toBe("new-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it("loads user profile when refresh succeeds on cold start", async () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authStatus: "initializing",
    });

    const token = await (apiClient as any).handleTokenRefresh();

    expect(token).toBe("new-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe("new-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getCurrentUserMock).toHaveBeenCalledWith("new-token");
  });
});
