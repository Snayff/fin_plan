import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TierPage from "./TierPage";

let _searchParams = new URLSearchParams();

mock.module("react-router-dom", () => ({
  useSearchParams: () => [_searchParams, () => {}],
}));

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: mock(() => ({
    isLoading: false,
    data: [
      { id: "sub-housing", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false },
      { id: "sub-utilities", name: "Utilities", tier: "committed", sortOrder: 1, isLocked: false },
    ],
  })),
  useTierItems: mock(() => ({
    isLoading: false,
    data: [],
  })),
}));

function renderTierPage(searchParams = new URLSearchParams()) {
  _searchParams = searchParams;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TierPage tier="committed" />
    </QueryClientProvider>
  );
}

describe("TierPage", () => {
  it("renders the page shell with data-testid", () => {
    renderTierPage();
    expect(screen.getByTestId("tier-page-committed")).toBeTruthy();
  });

  it("renders subcategory names in the left panel", () => {
    renderTierPage();
    expect(screen.getAllByText("Housing").length).toBeGreaterThan(0);
    expect(screen.getByText("Utilities")).toBeTruthy();
  });

  it("selects the first subcategory by default", () => {
    renderTierPage();
    const housing = screen.getByTestId("subcategory-row-sub-housing");
    expect(housing.getAttribute("aria-selected")).toBe("true");
  });

  it("selects a subcategory from the URL ?subcategory= param", () => {
    renderTierPage(new URLSearchParams("subcategory=sub-utilities"));
    const utilities = screen.getByTestId("subcategory-row-sub-utilities");
    expect(utilities.getAttribute("aria-selected")).toBe("true");
  });
});
