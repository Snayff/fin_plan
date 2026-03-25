import { describe, it, expect, mock, beforeAll } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { ItemDetailPanel } from "./ItemDetailPanel";

let mockHistoryResult = {
  data: undefined as { recordedAt: string; value: number; id: string }[] | undefined,
  isLoading: false,
  isError: true,
  refetch: () => {},
};

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useItemHistory: () => mockHistoryResult,
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
  beforeAll(() => {
    mockHistoryResult = { data: undefined, isLoading: false, isError: true, refetch: () => {} };
  });

  it("shows PanelError when item history query fails", () => {
    renderWithProviders(<ItemDetailPanel item={item} onBack={() => {}} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});

describe("ItemDetailPanel isReadOnly", () => {
  beforeAll(() => {
    mockHistoryResult = { data: [], isLoading: false, isError: false, refetch: () => {} };
  });

  it("hides Edit button when isReadOnly", () => {
    renderWithProviders(<ItemDetailPanel item={item} onBack={() => {}} isReadOnly={true} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.queryByText("Edit")).toBeNull();
  });

  it("shows Edit button when not isReadOnly", () => {
    renderWithProviders(<ItemDetailPanel item={item} onBack={() => {}} isReadOnly={false} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.getByText("Edit")).toBeTruthy();
  });
});
