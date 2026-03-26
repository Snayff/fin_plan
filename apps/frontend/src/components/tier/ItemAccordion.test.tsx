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

function renderAccordion(item = freshItem, onEdit = () => {}, onConfirm = () => {}) {
  return render(
    <ItemAccordion
      item={item}
      config={TIER_CONFIGS.committed}
      onEdit={onEdit}
      onConfirm={onConfirm}
      now={new Date("2026-01-15T00:00:00Z")}
      stalenessMonths={6}
    />
  );
}

describe("ItemAccordion", () => {
  it("shows last reviewed date", () => {
    renderAccordion();
    expect(screen.getByText(/jan 2026/i)).toBeTruthy();
  });

  it("shows spend type", () => {
    renderAccordion();
    expect(screen.getByText(/monthly/i)).toBeTruthy();
  });

  it("shows subcategory name", () => {
    renderAccordion();
    expect(screen.getByText("Housing")).toBeTruthy();
  });

  it("shows notes italic when present", () => {
    renderAccordion();
    expect(screen.getByText("Fixed rate until 2027")).toBeTruthy();
  });

  it("shows 'No notes' in muted when notes is null", () => {
    renderAccordion({ ...freshItem, notes: null });
    expect(screen.getByText(/no notes/i)).toBeTruthy();
  });

  it("shows only Edit button for fresh items", () => {
    renderAccordion(freshItem);
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /still correct/i })).toBeNull();
  });

  it("shows Edit + Still correct for stale items", () => {
    renderAccordion(staleItem);
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /still correct/i })).toBeTruthy();
  });

  it("calls onEdit when Edit is clicked", () => {
    let called = false;
    renderAccordion(freshItem, () => {
      called = true;
    });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(called).toBe(true);
  });

  it("calls onConfirm when Still correct is clicked", () => {
    let called = false;
    renderAccordion(
      staleItem,
      () => {},
      () => {
        called = true;
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /still correct/i }));
    expect(called).toBe(true);
  });
});
