import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
}));

import { LinkedAccountsButton } from "./LinkedAccountsButton";

describe("LinkedAccountsButton", () => {
  it("renders ACCOUNT BALANCES label, value, as-of date and account count", () => {
    render(
      <LinkedAccountsButton
        startingBalance={4200}
        linkedCount={2}
        oldestBalanceDate="2026-04-03"
        onClick={() => {}}
        isOpen={false}
      />
    );
    expect(screen.getByText(/account balances/i)).toBeTruthy();
    expect(screen.getByText(/£4,200/)).toBeTruthy();
    expect(screen.getByText(/as of 3 Apr/)).toBeTruthy();
    expect(screen.getByText(/2 accounts/)).toBeTruthy();
  });

  it("omits as-of when oldestBalanceDate is null", () => {
    render(
      <LinkedAccountsButton
        startingBalance={500}
        linkedCount={1}
        oldestBalanceDate={null}
        onClick={() => {}}
        isOpen={false}
      />
    );
    expect(screen.getByText(/account balances/i)).toBeTruthy();
    expect(screen.queryByText(/as of/)).toBeNull();
    expect(screen.getByText(/1 accounts/)).toBeTruthy();
  });

  it("shows empty state copy when no accounts linked", () => {
    render(
      <LinkedAccountsButton
        startingBalance={0}
        linkedCount={0}
        oldestBalanceDate={null}
        onClick={() => {}}
        isOpen={false}
      />
    );
    expect(screen.getByText(/link accounts to anchor your cashflow/i)).toBeTruthy();
  });
});
