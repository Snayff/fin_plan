import { describe, it, expect } from "bun:test";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import ItemRow from "./ItemRow";
import { TIER_CONFIGS } from "./tierConfig";

const baseItem = {
  id: "item-1",
  name: "Rent",
  amount: 1200,
  spendType: "monthly" as const,
  subcategoryId: "sub-housing",
  subcategoryName: "Housing",
  notes: null,
  lastReviewedAt: new Date("2025-01-15T00:00:00Z"),
  sortOrder: 0,
};

describe("ItemRow", () => {
  it("renders item name", () => {
    renderWithProviders(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("Rent")).toBeTruthy();
  });

  it("shows monthly amount with /mo suffix", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, spendType: "monthly", amount: 350 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("£350/mo")).toBeTruthy();
  });

  it("shows yearly amount with /yr suffix", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, spendType: "monthly", amount: 350 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("£4,200/yr")).toBeTruthy();
  });

  it("shows type and category on second line", () => {
    renderWithProviders(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText(/Monthly/)).toBeTruthy();
    expect(screen.getByText(/Housing/)).toBeTruthy();
  });

  it("shows 'Household' on metadata line when memberId is null", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, memberId: null }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText(/Household/)).toBeTruthy();
  });

  it("resolves member firstName from memberId", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, memberId: "m1" }}
        config={TIER_CONFIGS.income}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        members={[{ id: "m1", firstName: "Alice" }]}
      />
    );
    expect(screen.getByText(/Alice/)).toBeTruthy();
  });

  it("one-off item shows single amount without /mo suffix and no yearly", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, spendType: "one_off", amount: 3200 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("£3,200")).toBeTruthy();
    expect(screen.queryByText(/\/yr/)).toBeNull();
  });

  it("does not show staleness age text in collapsed row", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, lastReviewedAt: new Date("2024-06-01T00:00:00Z") }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        stalenessMonths={6}
      />
    );
    expect(screen.queryByTestId("stale-age")).toBeNull();
  });

  it("shows stale dot when item is stale", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, lastReviewedAt: new Date("2024-06-01T00:00:00Z") }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        stalenessMonths={6}
      />
    );
    expect(screen.getByTestId("stale-dot")).toBeTruthy();
  });

  it("does not show stale dot when item is fresh", () => {
    renderWithProviders(
      <ItemRow
        item={{ ...baseItem, lastReviewedAt: new Date("2025-12-01T00:00:00Z") }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
        stalenessMonths={6}
      />
    );
    expect(screen.queryByTestId("stale-dot")).toBeNull();
  });

  it("applies selected highlight when expanded", () => {
    const { container: _container } = renderWithProviders(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={true}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    const button = screen.getByTestId("item-row-item-1");
    expect(button.className).toContain("border-l-2");
    expect(button.className).toContain("border-tier-committed");
  });

  it("calls onToggle when clicked", () => {
    let called = false;
    renderWithProviders(
      <ItemRow
        item={baseItem}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {
          called = true;
        }}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    fireEvent.click(screen.getByTestId("item-row-item-1"));
    expect(called).toBe(true);
  });
});
