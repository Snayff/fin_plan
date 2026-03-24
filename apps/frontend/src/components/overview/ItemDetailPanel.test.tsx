import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { ItemDetailPanel } from "./ItemDetailPanel";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useItemHistory: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useConfirmItem: () => ({ mutate: () => {}, isPending: false }),
  useUpdateItem: () => ({ mutate: () => {}, isPending: false }),
  useEndIncome: () => ({ mutate: () => {}, isPending: false }),
  useCashflow: () => ({ data: undefined, isLoading: false, isError: false, refetch: () => {} }),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
  useSnapshot: () => ({ data: undefined }),
  useSnapshots: () => ({ data: undefined, isLoading: false }),
}));

const item = {
  id: "item-1",
  type: "income_source",
  name: "Salary",
  amount: 3000,
  lastReviewedAt: new Date(),
};

describe("ItemDetailPanel error state", () => {
  it("shows PanelError when item history query fails", () => {
    renderWithProviders(<ItemDetailPanel item={item} onBack={() => {}} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
