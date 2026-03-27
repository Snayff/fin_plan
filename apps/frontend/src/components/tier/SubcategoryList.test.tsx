import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import SubcategoryList from "./SubcategoryList";
import { TIER_CONFIGS } from "./tierConfig";

const subcategories = [
  { id: "sub-housing", name: "Housing", tier: "committed" as const, sortOrder: 0, isLocked: false },
  {
    id: "sub-utilities",
    name: "Utilities",
    tier: "committed" as const,
    sortOrder: 1,
    isLocked: false,
  },
];

const subcategoryTotals = {
  "sub-housing": { subcategoryId: "sub-housing", name: "Housing", total: 1200, items: [] },
  "sub-utilities": { subcategoryId: "sub-utilities", name: "Utilities", total: 300, items: [] },
};

function renderList(selectedId = "sub-housing", onSelect = mock(() => {})) {
  return render(
    <SubcategoryList
      tier="committed"
      config={TIER_CONFIGS.committed}
      subcategories={subcategories}
      subcategoryTotals={subcategoryTotals}
      tierTotal={1500}
      selectedId={selectedId}
      onSelect={onSelect}
      isLoading={false}
    />
  );
}

describe("SubcategoryList", () => {
  it("renders all subcategory rows", () => {
    renderList();
    expect(screen.getByTestId("subcategory-row-sub-housing")).toBeTruthy();
    expect(screen.getByTestId("subcategory-row-sub-utilities")).toBeTruthy();
  });

  it("marks the selected row with aria-selected", () => {
    renderList("sub-housing");
    expect(screen.getByTestId("subcategory-row-sub-housing").getAttribute("aria-selected")).toBe(
      "true"
    );
    expect(screen.getByTestId("subcategory-row-sub-utilities").getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("calls onSelect when a row is clicked", () => {
    const onSelect = mock(() => {});
    renderList("sub-housing", onSelect);
    fireEvent.click(screen.getByTestId("subcategory-row-sub-utilities"));
    expect(onSelect).toHaveBeenCalledWith("sub-utilities");
  });

  it("shows tier total at the bottom", () => {
    renderList();
    expect(screen.getByTestId("tier-total")).toBeTruthy();
    expect(screen.getByText(/1,500/)).toBeTruthy();
  });

  it("shows amounts for each subcategory", () => {
    renderList();
    expect(screen.getByText(/1,200/)).toBeTruthy();
    expect(screen.getByText(/300/)).toBeTruthy();
  });

  it("shows amber stale dot when any item in the subcategory is stale", () => {
    const staleItem = {
      id: "item-stale",
      lastReviewedAt: new Date("2024-01-01"),
      amount: 100,
      spendType: "monthly" as const,
      subcategoryId: "sub-housing",
      notes: null,
      sortOrder: 0,
    };
    const totalsWithStaleItem = {
      "sub-housing": {
        subcategoryId: "sub-housing",
        name: "Housing",
        total: 1200,
        items: [staleItem],
      },
      "sub-utilities": {
        subcategoryId: "sub-utilities",
        name: "Utilities",
        total: 300,
        items: [],
      },
    };
    render(
      <SubcategoryList
        tier="committed"
        config={TIER_CONFIGS.committed}
        subcategories={subcategories}
        subcategoryTotals={totalsWithStaleItem}
        tierTotal={1500}
        selectedId="sub-housing"
        onSelect={() => {}}
        isLoading={false}
        now={new Date("2026-01-15")}
        stalenessMonths={6}
      />
    );
    expect(screen.getByTestId("stale-dot-sub-housing")).toBeTruthy();
    expect(screen.queryByTestId("stale-dot-sub-utilities")).toBeNull();
  });
});
