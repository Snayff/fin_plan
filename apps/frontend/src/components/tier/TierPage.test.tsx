import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TierPage from "./TierPage";

let _searchParams = new URLSearchParams();

mock.module("react-router-dom", () => ({
  useSearchParams: () => [_searchParams, () => {}],
  useNavigate: () => () => {},
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

  it("sets data-page attribute matching the tier", () => {
    renderTierPage();
    const page = screen.getByTestId("tier-page-committed");
    expect(page.getAttribute("data-page")).toBe("committed");
  });

  it("renders subcategories inside a left aside panel", () => {
    renderTierPage();
    const aside = document.querySelector("aside");
    expect(aside).toBeTruthy();
    expect(aside!.querySelector("[role='tablist']")).toBeTruthy();
  });
});
