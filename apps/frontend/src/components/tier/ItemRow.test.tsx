import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
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
    render(
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
    render(
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
    render(
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
    render(
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

  it("one-off item shows single amount without /mo suffix and no yearly", () => {
    render(
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
    render(
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
    render(
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
    render(
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
    const { container } = render(
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
    render(
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
