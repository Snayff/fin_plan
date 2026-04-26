import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockUpdateLinkedAccount = mock(async () => ({}));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/cashflow.service", () => ({
  cashflowService: {
    getProjection: mock(async () => ({})),
    getMonthDetail: mock(async () => ({})),
    listLinkableAccounts: mock(async () => []),
    updateLinkedAccount: mockUpdateLinkedAccount,
    bulkUpdateLinkedAccounts: mock(async () => ({})),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useUpdateLinkedAccount, CASHFLOW_KEYS } = await import("./useCashflow");

function makeWrapper(qc: QueryClient) {
  return ({ children }: { children: any }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUpdateLinkedAccount optimistic", () => {
  it("flips isCashflowLinked in cache before the server resolves", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(CASHFLOW_KEYS.linkable, [
      { id: "a1", name: "Bank", isCashflowLinked: false },
      { id: "a2", name: "Cash", isCashflowLinked: true },
    ]);

    let resolveUpdate: (v: unknown) => void;
    mockUpdateLinkedAccount.mockImplementationOnce(() => new Promise((r) => (resolveUpdate = r)));

    const { result } = renderHook(() => useUpdateLinkedAccount(), {
      wrapper: makeWrapper(qc),
    });

    act(() => {
      result.current.mutate({ accountId: "a1", isCashflowLinked: true });
    });

    // Cache flipped before mutation resolves
    await waitFor(() => {
      const data = qc.getQueryData<any[]>(CASHFLOW_KEYS.linkable);
      expect(data?.find((a) => a.id === "a1")?.isCashflowLinked).toBe(true);
    });

    resolveUpdate!({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the cache and shows an error toast when the mutation fails", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(CASHFLOW_KEYS.linkable, [{ id: "a1", name: "Bank", isCashflowLinked: false }]);

    mockUpdateLinkedAccount.mockRejectedValueOnce(new Error("Server boom"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useUpdateLinkedAccount(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ accountId: "a1", isCashflowLinked: true });
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const data = qc.getQueryData<any[]>(CASHFLOW_KEYS.linkable);
    expect(data?.find((a) => a.id === "a1")?.isCashflowLinked).toBe(false);
    expect(mockShowError).toHaveBeenCalledWith("Server boom");
  });
});
