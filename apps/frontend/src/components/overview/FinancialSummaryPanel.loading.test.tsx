import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

mock.module("@/hooks/useWaterfall", () => ({
  useFinancialSummary: () => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: () => {},
  }),
}));

import { FinancialSummaryPanel } from "./FinancialSummaryPanel";

describe("FinancialSummaryPanel loading state", () => {
  it("renders loading skeleton when data is not available", () => {
    renderWithProviders(<FinancialSummaryPanel waterfallSummary={undefined} isSnapshot={false} />);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
