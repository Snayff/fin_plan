import { describe, it, expect, mock } from "bun:test";
import { http, HttpResponse } from "msw";

mock.module("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: undefined }),
}));
import { renderWithProviders } from "@/test/helpers/render";
import { server } from "@/test/msw/server";
import { CashflowSectionPanel } from "./CashflowSectionPanel";
import { fireEvent, screen, waitFor } from "@testing-library/react";

const projection = {
  startingBalance: 1000,
  latestKnownBalance: 1000,
  windowStart: { year: 2026, month: 4 },
  months: Array.from({ length: 12 }, (_, i) => ({
    year: 2026,
    month: ((i + 3) % 12) + 1,
    netChange: 100,
    openingBalance: 1000,
    closingBalance: 1100,
    dipBelowZero: false,
    tightestPoint: { value: 1000, day: 1 },
  })),
  projectedEndBalance: 2200,
  tightestDip: { value: 800, date: "2026-04-15" },
  avgMonthlySurplus: 100,
  oldestLinkedBalanceDate: "2026-04-01",
  youngestLinkedBalanceDate: "2026-04-01",
  linkedAccountCount: 1,
};

describe("CashflowSectionPanel", () => {
  it("renders year view by default", async () => {
    server.use(
      http.get("/api/cashflow/projection", () => HttpResponse.json(projection)),
      http.get("/api/cashflow/linkable-accounts", () => HttpResponse.json([]))
    );
    renderWithProviders(<CashflowSectionPanel />);
    await waitFor(() => expect(screen.getAllByText(/starting balance/i).length).toBeGreaterThan(0));
  });

  it("transitions to month detail when a bar is clicked", async () => {
    server.use(
      http.get("/api/cashflow/projection", () => HttpResponse.json(projection)),
      http.get("/api/cashflow/linkable-accounts", () => HttpResponse.json([])),
      http.get("/api/cashflow/month", () =>
        HttpResponse.json({
          year: 2026,
          month: 4,
          startingBalance: 1000,
          endBalance: 1500,
          netChange: 500,
          tightestPoint: { value: 800, day: 5 },
          amortisedDailyDiscretionary: 20,
          monthlyDiscretionaryTotal: 600,
          dailyTrace: [],
          events: [],
        })
      )
    );
    renderWithProviders(<CashflowSectionPanel />);
    const bar = await screen.findAllByRole("button", { name: /^[A-Z][a-z]{2} 2026/ });
    fireEvent.click(bar[0]!);
    await waitFor(() => expect(screen.getByText(/← cashflow/i)).toBeTruthy(), { timeout: 8000 });
  }, 10000);

  it("renders no-accounts callout when household has no linked accounts", async () => {
    server.use(
      http.get("/api/cashflow/projection", () =>
        HttpResponse.json({ ...projection, linkedAccountCount: 0, startingBalance: 0 })
      ),
      http.get("/api/cashflow/linkable-accounts", () => HttpResponse.json([]))
    );
    renderWithProviders(<CashflowSectionPanel />);
    await waitFor(() => expect(screen.getByText(/£0 starting balance/i)).toBeTruthy());
  });
});
