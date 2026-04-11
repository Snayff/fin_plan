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
  useFinancialSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useItemHistory: () => ({ data: undefined, isLoading: false, isError: false }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
}));
mock.module("@/hooks/useSettings", () => ({
  useSnapshot: () => ({ data: undefined, isLoading: false, isError: false }),
  useSnapshots: () => ({ data: [], isLoading: false, isError: false, refetch: () => {} }),
  useSettings: () => ({ data: undefined }),
  useCreateSnapshot: () => ({ mutate: () => {}, isPending: false }),
}));

describe("OverviewPage", () => {
  it("shows PanelError when waterfallSummary query fails with no data", () => {
    renderWithProviders(<OverviewPage />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("shows Overview heading in live mode", () => {
    renderWithProviders(<OverviewPage />);
    expect(screen.getByText("Overview")).toBeTruthy();
  });

  it("shows timeline strip with Now button", () => {
    renderWithProviders(<OverviewPage />);
    expect(screen.getByText("Now")).toBeTruthy();
  });
});
