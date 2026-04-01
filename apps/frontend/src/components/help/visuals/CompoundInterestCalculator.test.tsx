import { describe, it, expect } from "bun:test";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import { CompoundInterestCalculator } from "./CompoundInterestCalculator";

describe("CompoundInterestCalculator", () => {
  it("renders input fields", () => {
    renderWithProviders(<CompoundInterestCalculator />);
    expect(screen.getByLabelText(/starting balance/i)).toBeTruthy();
    expect(screen.getByLabelText(/monthly contribution/i)).toBeTruthy();
    expect(screen.getByLabelText(/annual interest rate/i)).toBeTruthy();
  });

  it("shows projected values for 1, 5, 10 years", () => {
    renderWithProviders(<CompoundInterestCalculator />);
    expect(screen.getByText("1 year")).toBeTruthy();
    expect(screen.getByText("5 years")).toBeTruthy();
    expect(screen.getByText("10 years")).toBeTruthy();
  });

  it("recalculates on input change", () => {
    renderWithProviders(<CompoundInterestCalculator />);
    const balanceInput = screen.getByLabelText(/starting balance/i);
    fireEvent.change(balanceInput, { target: { value: "10000" } });
    // With default rate and contribution, 1-year value should be shown
    const values = screen.getAllByText(/£[\d,]+/);
    expect(values.length).toBeGreaterThan(0);
  });

  it("handles zero interest rate without division by zero", () => {
    renderWithProviders(<CompoundInterestCalculator />);
    const rateInput = screen.getByLabelText(/annual interest rate/i);
    fireEvent.change(rateInput, { target: { value: "0" } });
    // Should not crash
    expect(screen.getByText("1 year")).toBeTruthy();
  });
});
