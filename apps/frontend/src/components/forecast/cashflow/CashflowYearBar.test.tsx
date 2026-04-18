import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
}));

import { CashflowYearBar } from "./CashflowYearBar";

describe("CashflowYearBar", () => {
  const month = {
    year: 2026,
    month: 4,
    netChange: 500,
    openingBalance: 1000,
    closingBalance: 1500,
    dipBelowZero: false,
    tightestPoint: { value: 1000, day: 1 },
  };

  it("uses page-accent violet when no dip", () => {
    render(<CashflowYearBar month={month} maxAbsNet={1000} onClick={() => {}} />);
    const bar = screen.getByRole("button");
    expect(bar.className).toMatch(/page-accent/);
    expect(bar.className).not.toMatch(/bg-attention/);
  });

  it("uses amber when dipBelowZero", () => {
    render(
      <CashflowYearBar
        month={{ ...month, dipBelowZero: true }}
        maxAbsNet={1000}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button").className).toMatch(/attention/);
  });

  it("dispatches click", () => {
    const handler = mock(() => {});
    render(<CashflowYearBar month={month} maxAbsNet={1000} onClick={handler} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledWith(month);
  });
});
