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
    expect(screen.getByRole("button", { name: "10y" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1y" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "30y" })).toBeTruthy();
  });
});
