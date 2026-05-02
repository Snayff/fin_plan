import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { IsaMemberBar } from "../IsaMemberBar";

const base = {
  memberId: "m1",
  name: "Alice",
  used: 12400,
  forecast: 5600,
  forecastedYearTotal: 18000,
  monthlyPlanned: 500,
  estimatedFlag: false,
};

describe("IsaMemberBar", () => {
  it("renders used / remaining values in the meta row", () => {
    render(<IsaMemberBar pos={base} annualLimit={20000} showName showPence={false} />);
    expect(screen.getByText(/£12,400/)).toBeInTheDocument();
    expect(screen.getByText(/£2,000 remaining/)).toBeInTheDocument();
  });

  it("does not render the limit marker when forecast within cap", () => {
    const { container } = render(
      <IsaMemberBar pos={base} annualLimit={20000} showName showPence={false} />
    );
    expect(container.querySelector('[data-testid="limit-marker"]')).toBeNull();
  });

  it("renders the limit marker and amber meta when forecast exceeds cap", () => {
    const over = { ...base, forecast: 11000, forecastedYearTotal: 23400 };
    render(<IsaMemberBar pos={over} annualLimit={20000} showName showPence={false} />);
    expect(screen.getByTestId("limit-marker")).toBeInTheDocument();
    expect(screen.getByText(/over.*limit/i)).toBeInTheDocument();
  });

  it("appends '(estimated)' when estimatedFlag is true", () => {
    render(
      <IsaMemberBar
        pos={{ ...base, estimatedFlag: true }}
        annualLimit={20000}
        showName
        showPence={false}
      />
    );
    expect(screen.getByText(/\(estimated\)/i)).toBeInTheDocument();
  });

  it("hides member name when showName=false", () => {
    render(<IsaMemberBar pos={base} annualLimit={20000} showName={false} showPence={false} />);
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("renders amber over-allowance meta when used exceeds limit (past-tense)", () => {
    const overUsed = { ...base, used: 21000, forecast: 0, forecastedYearTotal: 21000 };
    render(<IsaMemberBar pos={overUsed} annualLimit={20000} showName showPence={false} />);
    expect(screen.getByText(/£1,000 over allowance/i)).toBeInTheDocument();
  });
});
