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

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function tokenExpiringInMs(ms: number): string {
  const exp = Math.floor((Date.now() + ms) / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ sub: "user-1", exp }));
  return `${header}.${body}.signature`;
}

describe("ApiClient.resolveAccessToken (proactive pre-flight)", () => {
  beforeEach(() => {
    (apiClient as any).csrfToken = null;
    (apiClient as any).isRefreshing = false;
    (apiClient as any).refreshPromise = null;
    refreshTokenMock.mockReset();
    getCurrentUserMock.mockReset();
    refreshTokenMock.mockResolvedValue({ accessToken: "refreshed-token" });
    getCurrentUserMock.mockResolvedValue({ user: mockUser });
    (authService as any).refreshToken = refreshTokenMock;
    (authService as any).getCurrentUser = getCurrentUserMock;
  });

  it("returns null when no token is supplied and does not refresh", async () => {
    const result = await (apiClient as any).resolveAccessToken(null);
    expect(result).toBeNull();
    expect(refreshTokenMock).not.toHaveBeenCalled();
  });

  it("returns the same token when it is not near expiry", async () => {
    const token = tokenExpiringInMs(60 * 60 * 1000);
    useAuthStore.setState({
      user: mockUser,
      accessToken: token,
      isAuthenticated: true,
      authStatus: "authenticated",
    });

    const result = await (apiClient as any).resolveAccessToken(token);
    expect(result).toBe(token);
    expect(refreshTokenMock).not.toHaveBeenCalled();
  });

  it("refreshes and returns the new token when the supplied token is expired", async () => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: "stale",
      isAuthenticated: true,
      authStatus: "authenticated",
    });
    const expired = tokenExpiringInMs(-1000);

    const result = await (apiClient as any).resolveAccessToken(expired);

    expect(result).toBe("refreshed-token");
    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent pre-flight refreshes via handleTokenRefresh", async () => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: "stale",
      isAuthenticated: true,
      authStatus: "authenticated",
    });
    const expired = tokenExpiringInMs(-1000);

    const [a, b, c] = await Promise.all([
      (apiClient as any).resolveAccessToken(expired),
      (apiClient as any).resolveAccessToken(expired),
      (apiClient as any).resolveAccessToken(expired),
    ]);

    expect(a).toBe("refreshed-token");
    expect(b).toBe("refreshed-token");
    expect(c).toBe("refreshed-token");
    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
  });

  it("returns the original token when the token has no decodable exp", async () => {
    const opaque = "not-a-jwt";
    const result = await (apiClient as any).resolveAccessToken(opaque);
    expect(result).toBe(opaque);
    expect(refreshTokenMock).not.toHaveBeenCalled();
  });
});
