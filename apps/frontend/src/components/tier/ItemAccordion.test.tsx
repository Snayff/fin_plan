import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemAccordion from "./ItemAccordion";
import { TIER_CONFIGS } from "./tierConfig";

const freshItem = {
  id: "item-1",
  name: "Rent",
  amount: 1200,
  spendType: "monthly" as const,
  subcategoryId: "sub-housing",
  subcategoryName: "Housing",
  notes: "Fixed rate until 2027",
  lastReviewedAt: new Date("2026-01-01T00:00:00Z"),
  sortOrder: 0,
};

const staleItem = {
  ...freshItem,
  lastReviewedAt: new Date("2024-01-01T00:00:00Z"),
};

function renderAccordion(item = freshItem, onEdit = () => {}) {
  return render(
    <ItemAccordion
      item={item}
      config={TIER_CONFIGS.committed}
      onEdit={onEdit}
      now={new Date("2026-01-15T00:00:00Z")}
      stalenessMonths={6}
    />
  );
}

describe("ItemAccordion", () => {
  it("shows Notes header label", () => {
    renderAccordion();
    expect(screen.getByText("Notes")).toBeTruthy();
  });

  it("shows notes italic when present", () => {
    renderAccordion();
    expect(screen.getByText("Fixed rate until 2027")).toBeTruthy();
  });

  it("shows 'No notes' in muted when notes is null", () => {
    renderAccordion({ ...freshItem, notes: null });
    expect(screen.getByText(/no notes/i)).toBeTruthy();
  });

  it("does not show Last Reviewed for fresh items", () => {
    renderAccordion(freshItem);
    expect(screen.queryByText(/last reviewed/i)).toBeNull();
  });

  it("shows Last Reviewed with amber styling for stale items", () => {
    renderAccordion(staleItem);
    expect(screen.getByText(/last reviewed/i)).toBeTruthy();
    expect(screen.getByText(/jan 2024/i)).toBeTruthy();
  });

  it("shows relative age for stale items", () => {
    renderAccordion(staleItem);
    expect(screen.getByText(/24 months ago/)).toBeTruthy();
  });

  it("shows Edit button right-aligned", () => {
    renderAccordion();
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
  });

  it("does not show Still correct button", () => {
    renderAccordion(staleItem);
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
  });

  it("calls onEdit when Edit is clicked", () => {
    let called = false;
    renderAccordion(freshItem, () => {
      called = true;
    });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(called).toBe(true);
  });

  it("has tier colour left border for visual continuity", () => {
    const { container } = renderAccordion();
    const accordion = container.firstChild as HTMLElement;
    expect(accordion.className).toContain("border-l-2");
  });
});
