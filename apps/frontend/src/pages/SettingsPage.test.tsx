import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import SettingsPage from "./SettingsPage";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useUpdateSettings: () => ({ mutate: () => {}, isPending: false }),
  useUpdateProfile: () => ({ mutate: () => {}, isPending: false }),
  useHousehold: () => ({ data: undefined, isLoading: false }),
  useHouseholdMembers: () => ({ data: undefined, isLoading: false }),
  useInviteMember: () => ({ mutate: () => {}, isPending: false }),
  useRemoveMember: () => ({ mutate: () => {}, isPending: false }),
}));

mock.module("@/hooks/useWealth", () => ({
  useIsaAllowance: () => ({ data: undefined }),
  useWealthSummary: () => ({ data: undefined, isLoading: false, isError: false }),
  useWealthAccounts: () => ({ data: undefined, isLoading: false }),
  useAccountHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useUpdateValuation: () => ({ mutate: () => {}, isPending: false }),
  useConfirmAccount: () => ({ mutate: () => {}, isPending: false }),
  useUpdateAccount: () => ({ mutate: () => {}, isPending: false }),
}));

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({ data: undefined, isLoading: false, isError: false }),
  useCashflow: () => ({ data: undefined, isLoading: false, isError: false }),
  useItemHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
  useCreateSetupSession: () => ({ mutate: () => {}, isPending: false }),
  useUpdateSetupSession: () => ({ mutate: () => {}, isPending: false }),
}));

describe("SettingsPage error state", () => {
  it("shows PanelError in content area when settings query fails", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
