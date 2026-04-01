import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { useForecast } from "./useForecast";

function ForecastConsumer({ horizonYears }: { horizonYears: number }) {
  const { data, isLoading, isError } = useForecast(horizonYears as any);
  if (isLoading) return <div>loading</div>;
  if (isError) return <div>error</div>;
  return <div data-testid="result">{data ? "loaded" : "empty"}</div>;
}

describe("useForecast", () => {
  it("returns forecast data on success", async () => {
    server.use(
      http.get("/api/forecast", () =>
        HttpResponse.json({
          netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
          surplus: [{ year: 2026, cumulative: 0 }],
          retirement: [],
        })
      )
    );

    renderWithProviders(<ForecastConsumer horizonYears={10} />, {
      initialEntries: ["/forecast"],
    });

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("loaded");
    });
  });

  it("exposes error state on fetch failure", async () => {
    server.use(http.get("/api/forecast", () => HttpResponse.error()));

    renderWithProviders(<ForecastConsumer horizonYears={10} />, {
      initialEntries: ["/forecast"],
    });

    await waitFor(() => {
      expect(screen.getByText("error")).toBeTruthy();
    });
  });
});
