import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DoughnutLegend } from "./DoughnutLegend";

describe("DoughnutLegend", () => {
  it("renders entries with colour dots and labels", () => {
    const entries = [
      { colour: "#818cf8", label: "Mortgage" },
      { colour: "#6366f1", label: "Insurance" },
    ];
    render(<DoughnutLegend entries={entries} />);

    expect(screen.getByText("Mortgage")).toBeTruthy();
    expect(screen.getByText("Insurance")).toBeTruthy();
  });

  it("aggregates overflow entries as 'N others'", () => {
    const entries = Array.from({ length: 9 }, (_, i) => ({
      colour: `#${i}${i}${i}`,
      label: `Item ${i + 1}`,
    }));
    render(<DoughnutLegend entries={entries} />);

    // First 6 visible, 7th is "3 others"
    expect(screen.getByText("Item 1")).toBeTruthy();
    expect(screen.getByText("Item 6")).toBeTruthy();
    expect(screen.queryByText("Item 7")).toBeNull();
    expect(screen.getByText("3 others")).toBeTruthy();
  });

  it("renders all entries when exactly 7", () => {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      colour: `#${i}${i}${i}`,
      label: `Item ${i + 1}`,
    }));
    render(<DoughnutLegend entries={entries} />);

    expect(screen.getByText("Item 7")).toBeTruthy();
    expect(screen.queryByText("others")).toBeNull();
  });
});
