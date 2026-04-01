import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { CashflowCalendar } from "./CashflowCalendar";

mock.module("@/hooks/useWaterfall", () => ({
  useWaterfallSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useCashflow: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: () => {},
  }),
}));

describe("CashflowCalendar error state", () => {
  it("shows PanelError when cashflow query fails", () => {
    renderWithProviders(<CashflowCalendar year={2026} onBack={() => {}} />, {
      initialEntries: ["/overview"],
    });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });
});
