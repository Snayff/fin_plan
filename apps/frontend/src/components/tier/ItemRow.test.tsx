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

  it("shows monthly amount directly", () => {
    render(
      <ItemRow
        item={{ ...baseItem, spendType: "monthly", amount: 350 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText("£350")).toBeTruthy();
  });

  it("shows yearly amount with monthly equivalent", () => {
    render(
      <ItemRow
        item={{ ...baseItem, spendType: "yearly", amount: 840 }}
        config={TIER_CONFIGS.committed}
        isExpanded={false}
        onToggle={() => {}}
        now={new Date("2026-01-15T00:00:00Z")}
      />
    );
    expect(screen.getByText(/840/)).toBeTruthy();
    expect(screen.getByText(/70\/mo/)).toBeTruthy();
  });

  it("shows stale age in amber when item is stale (>6 months for committed)", () => {
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
    expect(screen.getByTestId("stale-age")).toBeTruthy();
  });

  it("does not show stale indicator when item is fresh", () => {
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
    expect(screen.queryByTestId("stale-age")).toBeNull();
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
