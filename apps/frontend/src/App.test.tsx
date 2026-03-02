import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { useAuthStore } from "./stores/authStore";

const originalInitializeAuth = useAuthStore.getState().initializeAuth;

describe("App auth bootstrap", () => {
  beforeEach(() => {
    (window.location as any).origin = "http://localhost:3000";
    (window.location as any).href = "http://localhost:3000/dashboard";
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
