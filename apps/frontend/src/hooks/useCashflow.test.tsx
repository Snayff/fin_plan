import { describe, it, expect } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/msw/server";
import { useCashflowProjection, useCashflowMonth, useLinkableAccounts } from "./useCashflow";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useCashflowProjection", () => {
  it("fetches projection from /api/cashflow/projection", async () => {
    server.use(
      http.get("/api/cashflow/projection", () =>
        HttpResponse.json({
          startingBalance: 1000,
          windowStart: { year: 2026, month: 4 },
          months: [],
          projectedEndBalance: 1000,
          tightestDip: { value: 1000, date: "2026-04-01" },
          avgMonthlySurplus: 0,
          oldestLinkedBalanceDate: "2026-04-01",
          youngestLinkedBalanceDate: "2026-04-01",
          linkedAccountCount: 1,
        })
      )
    );

    const { result } = renderHook(() => useCashflowProjection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.startingBalance).toBe(1000);
    expect(result.current.data?.linkedAccountCount).toBe(1);
  });
});

describe("useCashflowMonth", () => {
  it("fetches month detail from /api/cashflow/month", async () => {
    server.use(
      http.get("/api/cashflow/month", () =>
        HttpResponse.json({
          year: 2026,
          month: 4,
          startingBalance: 1000,
          endBalance: 1500,
          netChange: 500,
          tightestPoint: { value: 950, day: 15 },
          amortisedDailyDiscretionary: 10,
          monthlyDiscretionaryTotal: 300,
          dailyTrace: [],
          events: [],
        })
      )
    );

    const { result } = renderHook(() => useCashflowMonth(2026, 4), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.year).toBe(2026);
    expect(result.current.data?.month).toBe(4);
    expect(result.current.data?.netChange).toBe(500);
  });
});

describe("useLinkableAccounts", () => {
  it("fetches linkable accounts from /api/cashflow/linkable-accounts", async () => {
    server.use(
      http.get("/api/cashflow/linkable-accounts", () =>
        HttpResponse.json([
          {
            id: "acc-1",
            name: "Main Current",
            type: "Current",
            isCashflowLinked: true,
            latestBalance: 1234.56,
            latestBalanceDate: "2026-04-01",
          },
        ])
      )
    );

    const { result } = renderHook(() => useLinkableAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.name).toBe("Main Current");
  });
});
