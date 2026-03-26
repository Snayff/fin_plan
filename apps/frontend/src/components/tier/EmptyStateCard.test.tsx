import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyStateCard from "./EmptyStateCard";

describe("EmptyStateCard", () => {
  it("renders the header and body copy for a subcategory", () => {
    render(<EmptyStateCard subcategoryName="Housing" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByText("Add your housing costs")).toBeTruthy();
    expect(screen.getByText(/rent/i)).toBeTruthy();
  });

  it("renders the + Add item button", () => {
    render(<EmptyStateCard subcategoryName="Housing" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByRole("button", { name: /add item/i })).toBeTruthy();
  });

  it("calls onAddItem when the button is clicked", () => {
    let called = false;
    render(
      <EmptyStateCard
        subcategoryName="Housing"
        tier="committed"
        onAddItem={() => {
          called = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(called).toBe(true);
  });

  it("falls back gracefully for an unknown subcategory name", () => {
    render(<EmptyStateCard subcategoryName="Unknown" tier="committed" onAddItem={() => {}} />);
    expect(screen.getByRole("button", { name: /add item/i })).toBeTruthy();
  });
});
