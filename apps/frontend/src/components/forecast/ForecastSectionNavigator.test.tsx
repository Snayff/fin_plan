import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForecastSectionNavigator, type ForecastSection } from "./ForecastSectionNavigator";

describe("ForecastSectionNavigator", () => {
  it("renders Cashflow and Growth entries", () => {
    render(<ForecastSectionNavigator selected="cashflow" onSelect={() => {}} />);
    expect(screen.getByRole("tab", { name: /cashflow/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /growth/i })).toBeTruthy();
  });

  it("highlights the selected entry", () => {
    render(<ForecastSectionNavigator selected="growth" onSelect={() => {}} />);
    expect(screen.getByRole("tab", { name: /growth/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /cashflow/i }).getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("calls onSelect when an entry is clicked", () => {
    const handler = mock((section: ForecastSection) => section);
    render(<ForecastSectionNavigator selected="cashflow" onSelect={handler} />);
    fireEvent.click(screen.getByRole("tab", { name: /growth/i }));
    expect(handler).toHaveBeenCalledWith("growth");
  });
});
