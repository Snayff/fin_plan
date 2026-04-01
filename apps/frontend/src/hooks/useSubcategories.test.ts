import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSubcategories } from "./useWaterfall";

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    getSubcategories: mock(async (tier: string) => [
      { id: "sub-1", tier, name: "Housing", sortOrder: 0, isLocked: false },
      { id: "sub-2", tier, name: "Utilities", sortOrder: 1, isLocked: false },
    ]),
  },
}));

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useSubcategories", () => {
  it("fetches subcategories for a tier", async () => {
    const { result } = renderHook(() => useSubcategories("committed"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe("Housing");
  });

  it("returns undefined data while loading", () => {
    const { result } = renderHook(() => useSubcategories("income"), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
