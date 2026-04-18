import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import HouseholdSettingsPage from "./HouseholdSettingsPage";

function mockRole(role: "owner" | "admin" | "member") {
  const useAuthStore = (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: "u1", name: "Josh", email: "j@x", activeHouseholdId: "h1" },
      accessToken: "t",
      setUser: () => {},
      setState: () => {},
    });
  // Setup teardown in setup.ts calls useAuthStore.setState — attach a no-op so it doesn't throw
  (useAuthStore as unknown as { setState: () => void }).setState = () => {};
  mock.module("@/stores/authStore", () => ({ useAuthStore }));
  mock.module("@/hooks/useSettings", () => ({
    useSettings: () => ({
      data: { surplusBenchmarkPct: 10 },
      isLoading: false,
      isError: false,
      refetch: () => {},
    }),
    useUpdateSettings: () => ({
      mutate: () => {},
      mutateAsync: async () => ({}),
      isPending: false,
    }),
    useHouseholdDetails: () => ({
      data: {
        household: {
          id: "h1",
          name: "Snaith",
          memberProfiles: [{ userId: "u1", id: "m1", role, name: "Josh" }],
          invites: [],
        },
      },
      isLoading: false,
    }),
    useRenameHousehold: () => ({
      mutateAsync: async () => ({}),
      isPending: false,
    }),
  }));
}

describe("HouseholdSettingsPage role-based visibility", () => {
  it("owner sees Data, Growth rates, Audit log entries", () => {
    mockRole("owner");
    renderWithProviders(<HouseholdSettingsPage />);
    expect(screen.getByRole("button", { name: "Data" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Growth rates" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audit log" })).toBeTruthy();
  });

  it("admin sees Growth rates and Audit log but not Data", () => {
    mockRole("admin");
    renderWithProviders(<HouseholdSettingsPage />);
    expect(screen.queryByRole("button", { name: "Data" })).toBeNull();
    expect(screen.getByRole("button", { name: "Growth rates" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audit log" })).toBeTruthy();
  });

  it("member sees neither Data, Growth rates, nor Audit log", () => {
    mockRole("member");
    renderWithProviders(<HouseholdSettingsPage />);
    expect(screen.queryByRole("button", { name: "Data" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Growth rates" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Audit log" })).toBeNull();
  });
});
