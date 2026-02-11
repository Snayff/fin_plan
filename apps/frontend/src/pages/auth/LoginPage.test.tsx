import { describe, it, expect, mock, beforeEach } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers/render";
import { setUnauthenticated } from "../../test/helpers/auth";
import LoginPage from "./LoginPage";
import { useAuthStore } from "../../stores/authStore";

beforeEach(() => {
  setUnauthenticated();
});

describe("LoginPage", () => {
  it("renders email and password fields", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders link to register page", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
  });

  it("calls login on form submit", async () => {
    const user = userEvent.setup();
    const loginMock = mock(() => Promise.resolve(undefined));
    useAuthStore.setState({ login: loginMock } as any);

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123456",
      });
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    let resolveLogin: any;
    const loginMock = mock(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );
    useAuthStore.setState({ login: loginMock } as any);

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    resolveLogin();
  });

  it("displays error message on login failure", async () => {
    const user = userEvent.setup();
    const loginMock = mock(() => Promise.reject({ message: "Invalid email or password" }));
    useAuthStore.setState({ login: loginMock } as any);

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });
});
