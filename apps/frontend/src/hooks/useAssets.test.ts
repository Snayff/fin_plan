import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockCreateAsset = mock(async () => ({ id: "a1" }));
const mockShowError = mock((_msg: string) => {});

mock.module("../services/assets.service.js", () => ({
  assetsApiService: {
    createAsset: mockCreateAsset,
    updateAsset: mock(async () => ({})),
    deleteAsset: mock(async () => undefined),
    recordAssetBalance: mock(async () => ({})),
    createAccount: mock(async () => ({})),
    updateAccount: mock(async () => ({})),
    deleteAccount: mock(async () => undefined),
    recordAccountBalance: mock(async () => ({})),
    confirmAsset: mock(async () => ({})),
    confirmAccount: mock(async () => ({})),
    getSummary: mock(async () => ({})),
    listAssetsByType: mock(async () => []),
    listAccountsByType: mock(async () => []),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useCreateAsset } = await import("./useAssets");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCreateAsset onError", () => {
  it("calls showError with the API error message on failure", async () => {
    mockCreateAsset.mockRejectedValueOnce(new Error("Validation failed"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useCreateAsset(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ name: "X" } as any);
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Validation failed");
  });
});
