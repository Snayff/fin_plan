import { describe, it, expect } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/msw/server";
import { useShortfall, useTierShortfall } from "./useShortfall";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const samplePayload = {
  items: [
    {
      itemType: "committed_item",
      itemId: "c1",
      itemName: "Council Tax",
      tierKey: "committed",
      dueDate: "2026-05-08",
      amount: 420,
    },
    {
      itemType: "discretionary_item",
      itemId: "d1",
      itemName: "Holiday",
      tierKey: "discretionary",
      dueDate: "2026-05-15",
      amount: 600,
    },
  ],
  balanceToday: 540,
  lowest: { value: -123, date: "2026-05-08" },
  linkedAccountCount: 2,
};

describe("useShortfall", () => {
  it("fetches and returns the shortfall payload", async () => {
    server.use(http.get("/api/cashflow/shortfall", () => HttpResponse.json(samplePayload)));
    const { result } = renderHook(() => useShortfall(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.items).toHaveLength(2);
  });
});

describe("useTierShortfall", () => {
  it("filters items to the requested tier and computes daysToFirst", async () => {
    server.use(http.get("/api/cashflow/shortfall", () => HttpResponse.json(samplePayload)));
    const { result } = renderHook(() => useTierShortfall("committed"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.itemId).toBe("c1");
    expect(result.current.count).toBe(1);
    expect(typeof result.current.daysToFirst).toBe("number");
    expect(result.current.isLive).toBe(true);
  });

  it("returns isLive=false when there are no linked accounts", async () => {
    server.use(
      http.get("/api/cashflow/shortfall", () =>
        HttpResponse.json({ ...samplePayload, items: [], linkedAccountCount: 0 })
      )
    );
    const { result } = renderHook(() => useTierShortfall("committed"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLive).toBe(false));
    expect(result.current.count).toBe(0);
  });

  it("returns isLive=false when isSnapshot=true (does not fetch)", () => {
    const { result } = renderHook(() => useTierShortfall("committed", { isSnapshot: true }), {
      wrapper: wrapper(),
    });
    expect(result.current.isLive).toBe(false);
    expect(result.current.count).toBe(0);
  });
});
