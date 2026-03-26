import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import SurplusPage from "./SurplusPage";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    isLoading: false,
    isError: false,
    data: {
      income: { total: 4000 },
      committed: { monthlyTotal: 1000, monthlyAvg12: 500 },
      discretionary: { total: 500, savings: { total: 300 } },
      surplus: { amount: 1700, percentOfIncome: 42.5 },
    },
  }),
}));

describe("SurplusPage", () => {
  it("renders the surplus page", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByTestId("surplus-page")).toBeTruthy();
  });

  it("shows the surplus amount", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getAllByText(/1,700/).length).toBeGreaterThan(0);
  });

  it("shows the waterfall breakdown line items", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByText(/income/i)).toBeTruthy();
    expect(screen.getByText(/committed/i)).toBeTruthy();
    expect(screen.getByText(/discretionary/i)).toBeTruthy();
  });

  it("shows the right-panel message", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByText(/at the end of each month/i)).toBeTruthy();
  });

  it("does not show benchmark warning when surplus is above threshold", () => {
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.queryByTestId("surplus-benchmark-warning")).toBeNull();
  });
});

describe("SurplusPage — benchmark warning", () => {
  it("shows amber benchmark warning when surplus is below threshold", () => {
    mock.module("@/hooks/useWaterfall", () => ({
      useWaterfallSummary: () => ({
        isLoading: false,
        data: {
          income: { total: 4000 },
          committed: { monthlyTotal: 3000, monthlyAvg12: 500 },
          discretionary: { total: 800, savings: { total: 0 } },
          surplus: { amount: -300, percentOfIncome: -7.5 },
        },
      }),
    }));
    renderWithProviders(<SurplusPage />, { initialEntries: ["/surplus"] });
    expect(screen.getByTestId("surplus-benchmark-warning")).toBeTruthy();
  });
});
