import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
      expect(screen.getByPlaceholderText(/name/i)).toBeTruthy();
    });
  });

  it("expands accordion when item row is clicked", async () => {
    renderArea();
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.getByText(/monthly/i)).toBeTruthy(); // accordion shows spend type
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
    await waitFor(() => expect(screen.getByText(/monthly/i)).toBeTruthy());
    fireEvent.click(screen.getByTestId("item-row-item-rent"));
    await waitFor(() => {
      expect(screen.queryByText(/monthly/i)).toBeNull();
    });
  });
});
