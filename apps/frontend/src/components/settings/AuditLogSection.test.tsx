import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { AuditLogSection } from "./AuditLogSection";

function useAuthStoreMock(selector: (state: unknown) => unknown) {
  return selector({
    user: { id: "u1", name: "Test User", email: "t@example.com", activeHouseholdId: "h1" },
    accessToken: "t",
    setUser: () => {},
  });
}
useAuthStoreMock.setState = () => {};

mock.module("@/stores/authStore", () => ({ useAuthStore: useAuthStoreMock }));

mock.module("@/hooks/useSettings", () => ({
  useAuditLog: () => ({
    data: { pages: [{ entries: [], nextCursor: null }] },
    isLoading: false,
    isError: false,
    fetchNextPage: mock(() => {}),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
  useHouseholdDetails: () => ({
    data: { household: { name: "Test Household", memberProfiles: [], invites: [] } },
  }),
}));

describe("AuditLogSection", () => {
  it("shows 'Entries older than 180 days' retention footer", () => {
    renderWithProviders(<AuditLogSection />);
    expect(screen.getByText("Entries older than 180 days are automatically removed.")).toBeTruthy();
  });
});
