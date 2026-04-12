import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CashflowEventList } from "./CashflowEventList";

describe("CashflowEventList", () => {
  it("renders one row per event with date, label, signed amount, and running balance", () => {
    render(
      <CashflowEventList
        events={[
          {
            date: "2026-04-05",
            label: "Rent",
            amount: -1000,
            itemType: "committed_item",
            runningBalanceAfter: 200,
          },
          {
            date: "2026-04-25",
            label: "Salary",
            amount: 3000,
            itemType: "income_source",
            runningBalanceAfter: 3200,
          },
        ]}
      />
    );
    expect(screen.getByText("Rent")).toBeTruthy();
    expect(screen.getByText("-£1,000")).toBeTruthy();
    expect(screen.getByText("Salary")).toBeTruthy();
    expect(screen.getByText("+£3,000")).toBeTruthy();
  });
});
