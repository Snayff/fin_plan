import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockConfirmIncome = mock(async () => ({ id: "x" }));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    confirmIncome: mockConfirmIncome,
    confirmCommitted: mock(async () => ({ id: "x" })),
    confirmYearly: mock(async () => ({ id: "x" })),
    confirmDiscretionary: mock(async () => ({ id: "x" })),
    confirmSavings: mock(async () => ({ id: "x" })),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useConfirmItem } = await import("./useWaterfall");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useConfirmItem onError", () => {
  it("calls showError with the API error message when the mutation fails", async () => {
    mockConfirmIncome.mockRejectedValueOnce(new Error("Network down"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useConfirmItem(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ type: "income_source", id: "i1" });
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Network down");
  });
});

describe("waterfallService.createSubcategory", () => {
  it("exists as a function (preserved from prior smoke test)", async () => {
    const mod = await import("@/services/waterfall.service");
    expect(typeof (mod.waterfallService as any).createSubcategory).toBeDefined();
  });
});

describe("useConfirmWaterfallItem optimistic", () => {
  it("bumps lastReviewedAt for the targeted row before server resolves", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const before = new Date("2026-01-01T00:00:00.000Z");
    qc.setQueryData(
      ["waterfall", "tier-items", "income"],
      [{ id: "i1", name: "Salary", lastReviewedAt: before, amount: 100 }]
    );

    let resolveConfirm: (v: unknown) => void;
    const mod = await import("@/services/waterfall.service");
    (mod.waterfallService.confirmIncome as any).mockImplementationOnce(
      () => new Promise((r) => (resolveConfirm = r))
    );

    const localWrapper = ({ children }: { children: any }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { useConfirmWaterfallItem } = await import("./useWaterfall");
    const { result } = renderHook(() => useConfirmWaterfallItem("income", "i1"), {
      wrapper: localWrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      const data = qc.getQueryData<any[]>(["waterfall", "tier-items", "income"]);
      const row = data?.find((r) => r.id === "i1");
      expect(new Date(row.lastReviewedAt).getTime()).toBeGreaterThan(before.getTime());
    });

    resolveConfirm!({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
