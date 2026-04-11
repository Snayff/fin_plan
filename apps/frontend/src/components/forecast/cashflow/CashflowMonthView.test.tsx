import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { CashflowMonthView } from "./CashflowMonthView";
import type { CashflowMonthDetail } from "@finplan/shared";

const detail: CashflowMonthDetail = {
  year: 2026,
  month: 4,
  startingBalance: 1000,
  endBalance: 1500,
  netChange: 500,
  tightestPoint: { value: 800, day: 5 },
  amortisedDailyDiscretionary: 20,
  monthlyDiscretionaryTotal: 600,
  dailyTrace: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, balance: 1000 + i * 16 })),
  events: [
    {
      date: "2026-04-25",
      label: "Salary",
      amount: 3000,
      itemType: "income_source",
      runningBalanceAfter: 3000,
    },
  ],
};

describe("CashflowMonthView", () => {
  it("renders breadcrumb back to Cashflow", () => {
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        onBack={() => {}}
        onSelectMonth={() => {}}
      />
    );
    expect(screen.getByText(/cashflow/i)).toBeTruthy();
    expect(screen.getByText(/april 2026/i)).toBeTruthy();
  });

  it("renders the discretionary amortisation info chip", () => {
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        onBack={() => {}}
        onSelectMonth={() => {}}
      />
    );
    expect(screen.getByText(/£600\/mo amortised/i)).toBeTruthy();
  });

  it("calls onBack when breadcrumb clicked", () => {
    const handler = mock(() => {});
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        onBack={handler}
        onSelectMonth={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /← cashflow/i }));
    expect(handler).toHaveBeenCalled();
  });

  it("highlights amber months in the strip", () => {
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set([6, 9])}
        onBack={() => {}}
        onSelectMonth={() => {}}
      />
    );
    const jun = screen.getByRole("button", { name: /jun/i });
    expect(jun.className).toMatch(/attention/);
  });
});
