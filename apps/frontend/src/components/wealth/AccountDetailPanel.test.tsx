import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { AccountDetailPanel } from "./AccountDetailPanel";

mock.module("@/hooks/useWealth", () => ({
  useAccountHistory: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
  useUpdateValuation: () => ({ mutate: () => {}, isPending: false }),
  useConfirmAccount: () => ({ mutate: () => {}, isPending: false }),
  useUpdateAccount: () => ({ mutate: () => {}, isPending: false }),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
  useSnapshot: () => ({ data: undefined }),
  useSnapshots: () => ({ data: undefined, isLoading: false }),
}));

const account = {
  id: "acc-1",
  name: "Savings Account",
  assetClass: "savings",
  balance: 5000,
  provider: "Monzo",
  interestRate: 4.5,
  valuationDate: new Date().toISOString(),
  lastReviewedAt: new Date().toISOString(),
  savingsAllocations: [],
};

describe("AccountDetailPanel error state", () => {
  it("shows PanelError when account history query fails", () => {
    renderWithProviders(<AccountDetailPanel account={account} onBack={() => {}} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
