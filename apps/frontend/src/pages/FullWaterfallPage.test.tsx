import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, waitFor } from "@testing-library/react";
import FullWaterfallPage from "./FullWaterfallPage";

mock.module("@/hooks/useWaterfall", () => ({
  useFullWaterfall: () => ({
    summary: {
      data: null,
      isLoading: false,
      isError: false,
      refetch: () => {},
    },
    subcategories: { income: [], committed: [], discretionary: [] },
    items: { income: [], committed: [], discretionary: [] },
    isLoading: false,
    isError: false,
  }),
  useCreateSubcategory: () => ({ mutateAsync: async () => {} }),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: null, isLoading: false }),
  useDismissWaterfallTip: () => ({ mutate: () => {} }),
}));

describe("FullWaterfallPage", () => {
  it("is a valid React component (function)", () => {
    expect(typeof FullWaterfallPage).toBe("function");
  });

  it("renders without crashing at /waterfall", async () => {
    renderWithProviders(<FullWaterfallPage />, { initialEntries: ["/waterfall"] });
    await waitFor(() => {
      expect(screen.getByTestId("full-waterfall-page")).toBeTruthy();
    });
  });

  it("renders all three tier tables", async () => {
    renderWithProviders(<FullWaterfallPage />, { initialEntries: ["/waterfall"] });
    await waitFor(() => {
      expect(screen.getByTestId("waterfall-tier-income")).toBeTruthy();
      expect(screen.getByTestId("waterfall-tier-committed")).toBeTruthy();
      expect(screen.getByTestId("waterfall-tier-discretionary")).toBeTruthy();
    });
  });

  it("renders the surplus strip", async () => {
    renderWithProviders(<FullWaterfallPage />, { initialEntries: ["/waterfall"] });
    await waitFor(() => {
      expect(screen.getByTestId("surplus-strip")).toBeTruthy();
    });
  });
});
