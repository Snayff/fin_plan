import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import OverviewPage from "./OverviewPage";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useItemHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
  useCashflow: () => ({ data: undefined, isLoading: false, isError: false }),
}));
mock.module("@/hooks/useSetupSession", () => ({
  useSetupSession: () => ({ data: undefined, isLoading: false }),
  useCreateSetupSession: () => ({ mutate: () => {} }),
  useUpdateSetupSession: () => ({ mutate: () => {} }),
}));
mock.module("@/hooks/useSettings", () => ({
  useSnapshot: () => ({ data: undefined }),
  useSnapshots: () => ({ data: [], isLoading: false }),
}));

describe("OverviewPage error state", () => {
  it("shows PanelError when waterfallSummary query fails with no data", () => {
    renderWithProviders(<OverviewPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
