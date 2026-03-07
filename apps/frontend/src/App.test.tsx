import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import App, { ProtectedAppRoutes } from "./App";
import { useAuthStore } from "./stores/authStore";
import { mockUser, setAuthenticated } from "./test/helpers/auth";
import { renderWithProviders } from "./test/helpers/render";

const originalInitializeAuth = useAuthStore.getState().initializeAuth;

describe("App auth bootstrap", () => {
  beforeEach(() => {
    (window.location as any).origin = "http://localhost:3001";
    (window.location as any).href = "http://localhost:3001/dashboard";
    (window.location as any).pathname = "/dashboard";
    useAuthStore.setState({ initializeAuth: originalInitializeAuth });
  });

  afterEach(() => {
    useAuthStore.setState({ initializeAuth: originalInitializeAuth });
  });

  it("shows initialization view and does not route to login while bootstrapping", async () => {
    const initializeAuthMock = mock(() => Promise.resolve());
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authStatus: "initializing",
      isLoading: false,
      error: null,
      initializeAuth: initializeAuthMock as any,
    });

    render(<App />);

    expect(screen.getByText("Restoring secure session...")).toBeTruthy();
    expect(screen.queryByText("Welcome Back")).toBeNull();

    await waitFor(() => {
      expect(initializeAuthMock).toHaveBeenCalled();
    });
  });
});

describe("App protected route handling", () => {
  beforeEach(() => {
    setAuthenticated(
      {
        ...mockUser,
        activeHouseholdId: "household-1",
      } as any,
      "mock-access-token"
    );
  });

  it("redirects legacy /settings/household route to /profile", async () => {
    renderWithProviders(<ProtectedAppRoutes />, {
      initialEntries: ["/settings/household"],
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /profile/i })).toBeTruthy();
    });
  });

  it("redirects unknown protected routes to /dashboard", async () => {
    renderWithProviders(<ProtectedAppRoutes />, {
      initialEntries: ["/not-a-real-route"],
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^dashboard$/i })).toBeTruthy();
    });
  });
});
