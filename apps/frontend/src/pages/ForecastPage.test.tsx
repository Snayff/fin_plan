import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import ForecastPage from "./ForecastPage";

describe("ForecastPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });
    expect(screen.getByRole("heading", { name: /forecast/i })).toBeTruthy();
  });

  it("renders the time horizon selector with all five options", () => {
    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });
    for (const label of ["1y", "3y", "10y", "20y", "30y"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });
});
