import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { AccountAccumulationChart } from "./AccountAccumulationChart";
import type { AccountBalancePoint } from "@finplan/shared";

const mockData: AccountBalancePoint[] = [
  { year: 2026, balance: 10000 },
  { year: 2027, balance: 11600 },
  { year: 2028, balance: 13264 },
];

const accent = { stroke: "#6366f1", gradId: "savingsGradTest" };

describe("AccountAccumulationChart", () => {
  it("renders the supplied label", () => {
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={mockData}
        accent={accent}
        emptyMessage="Add a savings account to see your projection"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/savings accumulation/i)).toBeTruthy();
  });

  it("shows stat row with Today and Projected labels", () => {
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={mockData}
        accent={accent}
        emptyMessage="Add a savings account"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/today/i)).toBeTruthy();
    expect(screen.getByText(/projected \(2028\)/i)).toBeTruthy();
  });

  it("renders the monthly contribution badge when > 0", () => {
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={mockData}
        monthlyContributions={100}
        accent={accent}
        emptyMessage="Add a savings account"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/\/mo/i)).toBeTruthy();
  });

  it("hides the monthly contribution badge when 0 or undefined", () => {
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={mockData}
        accent={accent}
        emptyMessage="Add a savings account"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.queryByText(/\/mo/i)).toBeNull();
  });

  it("shows empty message when all balances are zero and no contributions", () => {
    const zeroData: AccountBalancePoint[] = [
      { year: 2026, balance: 0 },
      { year: 2027, balance: 0 },
    ];
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={zeroData}
        accent={accent}
        emptyMessage="Add a savings account to see your projection"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/add a savings account/i)).toBeTruthy();
  });

  it("renders chart (not empty) when balances are zero but contributions exist", () => {
    const zeroData: AccountBalancePoint[] = [
      { year: 2026, balance: 0 },
      { year: 2027, balance: 1200 },
    ];
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={zeroData}
        monthlyContributions={100}
        accent={accent}
        emptyMessage="Add a savings account"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.queryByText(/add a savings account/i)).toBeNull();
  });

  it("shows empty message when fewer than 2 data points", () => {
    renderWithProviders(
      <AccountAccumulationChart
        label="Savings Accumulation"
        data={[{ year: 2026, balance: 5000 }]}
        accent={accent}
        emptyMessage="Add a savings account to see your projection"
      />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/add a savings account/i)).toBeTruthy();
  });
});
