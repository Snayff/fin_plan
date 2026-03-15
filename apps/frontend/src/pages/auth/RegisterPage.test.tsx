import { describe, it, expect, mock, beforeEach } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers/render";
import { setUnauthenticated } from "../../test/helpers/auth";
import RegisterPage from "./RegisterPage";
import { useAuthStore } from "../../stores/authStore";

const showErrorMock = mock(() => {});

mock.module("../../lib/toast", () => ({
  showError: showErrorMock,
  showSuccess: mock(() => {}),
}));

beforeEach(() => {
  setUnauthenticated();
  showErrorMock.mockReset();
});

describe("RegisterPage", () => {
  it("renders all form fields", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/^email$/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy();
  });

  it("renders create account button", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeTruthy();
  });

  it("renders link to login page", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole("link", { name: /sign in/i }).getAttribute("href")).toBe("/login");
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "differentpass12");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });
  });

  it("calls showError toast when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "differentpass12");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("Please fix the errors below.");
    });
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 12 characters/i)).toBeTruthy();
    });
  });

  it("calls showError toast when password is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("Please fix the errors below.");
    });
  });

  it("calls register on valid form submit", async () => {
    const user = userEvent.setup();
    const registerMock = mock(() => Promise.resolve(undefined));
    useAuthStore.setState({ register: registerMock } as any);

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@test.com",
        password: "password123456",
      });
    });
  });

  it("displays API error on registration failure", async () => {
    const user = userEvent.setup();
    const registerMock = mock(() => Promise.reject({ message: "Email already exists" }));
    useAuthStore.setState({ register: registerMock } as any);

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeTruthy();
    });
  });

  it("calls showError toast with API error message on registration failure", async () => {
    const user = userEvent.setup();
    const registerMock = mock(() => Promise.reject({ message: "Email already exists" }));
    useAuthStore.setState({ register: registerMock } as any);

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("calls showError toast with fallback message when API error has no message", async () => {
    const user = userEvent.setup();
    const registerMock = mock(() => Promise.reject({}));
    useAuthStore.setState({ register: registerMock } as any);

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123456");
    await user.type(screen.getByLabelText(/confirm password/i), "password123456");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("Registration failed");
    });
  });
});
