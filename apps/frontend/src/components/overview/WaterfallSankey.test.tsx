import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { WaterfallSankey } from "./WaterfallSankey";

describe("WaterfallSankey", () => {
  const defaultProps = {
    income: 5000,
    committed: 2000,
    discretionary: 1500,
    surplus: 1500,
  };

  it("renders the SVG with three column labels", () => {
    render(<WaterfallSankey {...defaultProps} />);
    expect(screen.getByText("Income")).toBeTruthy();
    expect(screen.getByText("Surplus")).toBeTruthy();
  });

  it("renders band paths for committed and discretionary", () => {
    const { container } = render(<WaterfallSankey {...defaultProps} />);
    const paths = container.querySelectorAll("path");
    // 3 bands: committed, discretionary, surplus
    expect(paths.length).toBe(3);
  });

  it("shows tooltip on band hover", () => {
    render(<WaterfallSankey {...defaultProps} />);
    const bands = screen.getAllByRole("img");
    fireEvent.mouseEnter(bands[0]);
    // Tooltip should appear with tier name and amount
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("renders nothing when income is zero", () => {
    const { container } = render(
      <WaterfallSankey income={0} committed={0} discretionary={0} surplus={0} />
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(0);
  });
});
