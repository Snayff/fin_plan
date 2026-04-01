import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { waitFor } from "@testing-library/react";
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

const mockProjection = {
  netWorth: [
    { year: 2026, nominal: 50000, real: 50000 },
    { year: 2027, nominal: 55000, real: 53658 },
  ],
  surplus: [
    { year: 2026, cumulative: 0 },
    { year: 2027, cumulative: 12000 },
  ],
  retirement: [
    {
      memberId: "user-1",
      memberName: "Alice",
      retirementYear: 2055,
      series: [{ year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 }],
    },
  ],
};

describe("ForecastPage — with data", () => {
  it("renders all three chart panels after data loads", async () => {
    server.use(http.get("/api/forecast", () => HttpResponse.json(mockProjection)));

    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });

    await waitFor(() => {
      expect(screen.getByText(/net worth/i)).toBeTruthy();
      expect(screen.getByText(/surplus accumulation/i)).toBeTruthy();
      expect(screen.getByText(/retirement/i)).toBeTruthy();
    });
  });
});
