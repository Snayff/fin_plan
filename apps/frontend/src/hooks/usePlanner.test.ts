import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockCreatePurchase = mock(async () => ({ id: "p1" }));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/planner.service", () => ({
  plannerService: {
    listPurchases: mock(async () => []),
    createPurchase: mockCreatePurchase,
    updatePurchase: mock(async () => ({})),
    deletePurchase: mock(async () => undefined),
  },
}));

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    getYearBudget: mock(async () => ({})),
    upsertYearBudget: mock(async () => ({})),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useCreatePurchase } = await import("./usePlanner");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCreatePurchase onError", () => {
  it("calls showError with the API error message on failure", async () => {
    mockCreatePurchase.mockRejectedValueOnce(new Error("Bad data"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useCreatePurchase(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ name: "Bike" } as any);
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Bad data");
  });
});
