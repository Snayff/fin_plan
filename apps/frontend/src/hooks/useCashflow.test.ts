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

const { useUpdateLinkedAccount } = await import("./useCashflow");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUpdateLinkedAccount onError", () => {
  it("calls showError with the API error message on failure", async () => {
    mockUpdateLinkedAccount.mockRejectedValueOnce(new Error("Cannot link"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useUpdateLinkedAccount(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ accountId: "a1", isCashflowLinked: true });
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Cannot link");
  });
});
