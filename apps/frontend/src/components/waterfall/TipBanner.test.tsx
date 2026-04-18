import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { TipBanner } from "./TipBanner";

describe("TipBanner", () => {
  it("renders tip text", () => {
    render(<TipBanner onDismiss={() => {}} />);
    expect(screen.getByText(/Start with your income/i)).toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const onDismiss = mock(() => {});
    render(<TipBanner onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
