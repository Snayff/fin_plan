import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import WealthPage from "./WealthPage";

mock.module("@/hooks/useWealth", () => ({
  useWealthSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useWealthAccounts: () => ({ data: undefined, isLoading: false, isError: false }),
  useIsaAllowance: () => ({ data: undefined }),
  useAccountHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useUpdateValuation: () => ({ mutate: () => {}, isPending: false }),
  useConfirmAccount: () => ({ mutate: () => {}, isPending: false }),
  useUpdateAccount: () => ({ mutate: () => {}, isPending: false }),
}));

describe("WealthPage error state", () => {
  it("shows PanelError in left panel when summary query fails", () => {
    renderWithProviders(<WealthPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
