import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { TipBanner } from "./TipBanner";

describe("TipBanner", () => {
  it("renders tip text", () => {
    render(<TipBanner onDismiss={() => {}} />);
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName.toLowerCase() === "span" &&
          element.className.includes("flex-1") &&
          /Start with your income/i.test(element.textContent ?? "")
      )
    ).toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const onDismiss = mock(() => {});
    render(<TipBanner onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
