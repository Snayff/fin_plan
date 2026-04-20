import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ItemArea from "./ItemArea";
import { TIER_CONFIGS } from "./tierConfig";

mock.module("@/hooks/useWaterfall", () => ({
  useCreateItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
  useTierUpdateItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
  useConfirmWaterfallItem: mock(() => ({
    mutateAsync: mock(() => Promise.resolve()),
    isPending: false,
  })),
  useDeleteItem: mock(() => ({ mutateAsync: mock(() => Promise.resolve()), isPending: false })),
}));

const subcategory = {
  id: "sub-housing",
  name: "Housing",
  tier: "committed" as const,
  sortOrder: 0,
  isLocked: false,
};

const items = [
  {
    id: "item-rent",
    name: "Rent",
    amount: 1200,
    spendType: "monthly" as const,
    subcategoryId: "sub-housing",
    notes: null,
    lastReviewedAt: new Date("2025-12-01"),
    sortOrder: 0,
  },
];

const subcategories = [{ id: "sub-housing", name: "Housing" }];

function renderArea(itemList = items) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ItemArea
          tier="committed"
          config={TIER_CONFIGS.committed}
          subcategory={subcategory}
          subcategories={subcategories}
          items={itemList}
          isLoading={false}
          now={new Date("2026-01-15")}
        />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ItemArea", () => {
  it("renders the subcategory header", () => {
    renderArea();
    expect(screen.getByText("Housing")).toBeTruthy();
  });

  it("renders item count", () => {
    renderArea();
    expect(screen.getByText(/1 item/i)).toBeTruthy();
  });

  it("renders item rows", () => {
    renderArea();
    expect(screen.getByText("Rent")).toBeTruthy();
  });

  it("shows empty state when no items", () => {
    renderArea([]);
    expect(screen.getByText(/rent, mortgage, council tax/i)).toBeTruthy();
  });

  it("shows add form when GhostAddButton is clicked", async () => {
    renderArea();
    fireEvent.click(screen.getByRole("button", { name: /\+ add/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g. Mortgage, Council Tax")).toBeTruthy();
    });
  });

  it("expands accordion when item row is clicked", async () => {
    renderArea();
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeTruthy(); // accordion shows notes section
    });
  });

  it("empty state CTA card uses correct gradient opacity", () => {
    const { container } = renderArea([]);
    const allElements = container.querySelectorAll("*");
    const ctaCard = Array.from(allElements).find((el) =>
      (el as HTMLElement).style?.background?.includes("linear-gradient")
    ) as HTMLElement;
    expect(ctaCard).toBeTruthy();
    expect(ctaCard.style.background).toContain("0.08");
  });

  it("collapses accordion when same row is clicked again", async () => {
    renderArea();
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => expect(screen.getByText("Notes")).toBeTruthy());
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.queryByText("Notes")).toBeNull();
    });
  });

  it("renders a 'View all' link pointing to /waterfall#committed", () => {
    renderArea();
    const link = screen.getByRole("link", { name: /view all/i });
    expect(link.getAttribute("href")).toBe("/waterfall#committed");
  });
});

const giftsSubcategory = {
  id: "sub-gifts",
  name: "Gifts",
  tier: "discretionary" as const,
  sortOrder: 3,
  isLocked: true,
};

function renderLockedGifts(itemList: typeof items = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ItemArea
          tier="discretionary"
          config={TIER_CONFIGS.discretionary}
          subcategory={giftsSubcategory}
          subcategories={[{ id: "sub-gifts", name: "Gifts" }]}
          items={itemList}
          isLoading={false}
          now={new Date("2026-01-15")}
        />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ItemArea — locked Gifts subcategory", () => {
  it("renders a lock icon next to the title", () => {
    renderLockedGifts();
    expect(screen.getByLabelText(/synced subcategory/i)).toBeTruthy();
  });

  it("shows an 'Open Gift Planner' link in the header", () => {
    renderLockedGifts();
    const link = screen.getByRole("link", { name: /open gift planner/i });
    expect(link.getAttribute("href")).toBe("/gifts");
  });

  it("shows the locked empty-state card with an 'Open Gift Planner' button", () => {
    renderLockedGifts();
    expect(screen.getByText(/managed in the gift planner/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /open gift planner/i })).toBeTruthy();
  });
});
