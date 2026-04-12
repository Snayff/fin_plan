import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { CashflowYearView } from "./CashflowYearView";
import type { CashflowProjection } from "@finplan/shared";

const fixture: CashflowProjection = {
  startingBalance: 1000,
  latestKnownBalance: 4200,
  windowStart: { year: 2026, month: 4 },
  months: Array.from({ length: 12 }, (_, i) => ({
    year: 2026,
    month: ((i + 3) % 12) + 1,
    netChange: 100,
    openingBalance: 1000 + i * 100,
    closingBalance: 1100 + i * 100,
    dipBelowZero: i === 5,
    tightestPoint: { value: 0, day: 15 },
  })),
  projectedEndBalance: 2200,
  tightestDip: { value: -200, date: "2026-09-15" },
  avgMonthlySurplus: 100,
  oldestLinkedBalanceDate: "2026-04-01",
  youngestLinkedBalanceDate: "2026-04-01",
  linkedAccountCount: 1,
};

describe("CashflowYearView", () => {
  it("renders four headline cards", () => {
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={() => {}}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    expect(screen.getByText(/starting balance/i)).toBeTruthy();
    expect(screen.getByText(/projected end/i)).toBeTruthy();
    expect(screen.getByText(/tightest dip/i)).toBeTruthy();
    expect(screen.getByText(/average monthly surplus/i)).toBeTruthy();
  });

  it("renders 12 bars", () => {
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={() => {}}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    expect(screen.getAllByRole("button", { name: /^[A-Z][a-z]{2} 2026/ })).toHaveLength(12);
  });

  it("calls onSelectMonth when a bar is clicked", () => {
    const handler = mock(() => {});
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={handler}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^[A-Z][a-z]{2} 2026/ })[0]!);
    expect(handler).toHaveBeenCalled();
  });

  it("renders amber tightest dip when value < 0", () => {
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={() => {}}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    const dip = screen.getByText(/-£200/);
    expect(dip.className).toMatch(/attention/);
  });

  it("renders the headline using latestKnownBalance with an as-of sub-line", () => {
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={() => {}}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    // latestKnownBalance is 4200, startingBalance (window opening) is 1000.
    expect(screen.getByText(/£4,200/)).toBeTruthy();
    expect(screen.queryByText(/^£1,000$/)).toBeNull();
    expect(screen.getByText(/^as of /i)).toBeTruthy();
  });

  it("renders a today marker on the bar matching the current calendar month", () => {
    render(
      <CashflowYearView
        projection={fixture}
        onSelectMonth={() => {}}
        onShiftWindow={() => {}}
        canShiftBack={false}
      />
    );
    // Today is 2026-04-11; the fixture's first month (April 2026) should carry the marker.
    const markers = screen.getAllByTestId("today-marker");
    expect(markers).toHaveLength(1);
  });
});
