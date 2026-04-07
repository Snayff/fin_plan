import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import SettingsPage from "./SettingsPage";

const mockUseSettings = {
  useSettings: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useUpdateSettings: () => ({ mutate: () => {}, isPending: false }),
  useUpdateProfile: () => ({ mutate: () => {}, isPending: false }),
  useHousehold: () => ({ data: undefined, isLoading: false }),
  useHouseholdDetails: () => ({ data: undefined, isLoading: false }),
  useHouseholdMembers: () => ({ data: [] }),
  useInviteMember: () => ({ mutate: () => {}, isPending: false }),
  useRemoveMember: () => ({ mutate: () => {}, isPending: false }),
};

mock.module("@/hooks/useSettings", () => mockUseSettings);

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

describe("SettingsPage loaded state", () => {
  it("renders Display nav item and Show pence toggle", () => {
    mock.module("@/hooks/useSettings", () => ({
      ...mockUseSettings,
      useSettings: () => ({
        data: { showPence: false },
        isLoading: false,
        isError: false,
        refetch: () => {},
      }),
    }));

    renderWithProviders(<SettingsPage />);
    // "Display" appears in both the nav sidebar and the section heading
    expect(screen.getAllByText("Display").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Show pence")).toBeTruthy();
  });
});
