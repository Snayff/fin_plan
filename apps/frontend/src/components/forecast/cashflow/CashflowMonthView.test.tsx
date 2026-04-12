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

// April 2026 → March 2028 inclusive: matches the runtime "today" of 2026-04-11.
const windowStart = { year: 2026, month: 4 };
const windowEnd = { year: 2028, month: 3 };

describe("CashflowMonthView", () => {
  it("renders breadcrumb back to Cashflow", () => {
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        windowStart={windowStart}
        windowEnd={windowEnd}
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
        windowStart={windowStart}
        windowEnd={windowEnd}
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
        windowStart={windowStart}
        windowEnd={windowEnd}
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
        windowStart={windowStart}
        windowEnd={windowEnd}
        onBack={() => {}}
        onSelectMonth={() => {}}
      />
    );
    const jun = screen.getByRole("button", { name: /jun/i });
    expect(jun.className).toMatch(/attention/);
  });

  it("renders Opening balance label with the first-of-month sub-line", () => {
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        windowStart={windowStart}
        windowEnd={windowEnd}
        onBack={() => {}}
        onSelectMonth={() => {}}
      />
    );
    expect(screen.getByText(/opening balance/i)).toBeTruthy();
    expect(screen.getByText(/1 apr 2026/i)).toBeTruthy();
  });

  it("disables strip months earlier than the projection window and exposes the title tooltip", () => {
    const handler = mock(() => {});
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        windowStart={windowStart}
        windowEnd={windowEnd}
        onBack={() => {}}
        onSelectMonth={handler}
      />
    );
    // March is before April (windowStart), so it must be disabled.
    const mar = screen.getByRole("button", { name: /mar/i });
    expect(mar.hasAttribute("disabled")).toBe(true);
    expect(mar.getAttribute("aria-disabled")).toBe("true");
    expect(mar.getAttribute("title")).toMatch(/outside the 24-month projection window/i);
    fireEvent.click(mar);
    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps in-window strip months clickable", () => {
    const handler = mock(() => {});
    render(
      <CashflowMonthView
        detail={detail}
        amberMonths={new Set()}
        windowStart={windowStart}
        windowEnd={windowEnd}
        onBack={() => {}}
        onSelectMonth={handler}
      />
    );
    // May 2026 is well inside the April 2026 → March 2028 window.
    const may = screen.getByRole("button", { name: /may/i });
    expect(may.hasAttribute("disabled")).toBe(false);
    fireEvent.click(may);
    expect(handler).toHaveBeenCalledWith(5);
  });
});
