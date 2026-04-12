import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CashflowStaleBanner } from "./CashflowStaleBanner";

describe("CashflowStaleBanner", () => {
  it("renders months range and Refresh accounts link", () => {
    render(<CashflowStaleBanner oldestMonths={4} youngestMonths={1} onRefresh={() => {}} />);
    expect(screen.getByText(/1–4 months old/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /refresh accounts/i })).toBeTruthy();
  });
});
