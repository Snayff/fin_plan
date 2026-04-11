import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LinkedAccountsButton } from "./LinkedAccountsButton";

describe("LinkedAccountsButton", () => {
  it("renders STARTING BALANCE label, value and N linked accounts", () => {
    render(
      <LinkedAccountsButton
        startingBalance={4200}
        linkedCount={2}
        onClick={() => {}}
        isOpen={false}
      />
    );
    expect(screen.getByText(/starting balance/i)).toBeTruthy();
    expect(screen.getByText(/£4,200/)).toBeTruthy();
    expect(screen.getByText(/2 linked accounts/i)).toBeTruthy();
  });

  it("shows empty state copy when no accounts linked", () => {
    render(
      <LinkedAccountsButton startingBalance={0} linkedCount={0} onClick={() => {}} isOpen={false} />
    );
    expect(screen.getByText(/link accounts to anchor your cashflow/i)).toBeTruthy();
  });
});
