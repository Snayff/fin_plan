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

describe("useConfirmAsset optimistic", () => {
  it("bumps lastReviewedAt for the targeted asset row", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const before = new Date("2026-01-01T00:00:00.000Z");
    qc.setQueryData(
      ["assets", "assets", "property"],
      [{ id: "a1", name: "House", lastReviewedAt: before }]
    );

    let resolveConfirm: (v: unknown) => void;
    const mod = await import("../services/assets.service.js");
    (mod.assetsApiService.confirmAsset as any).mockImplementationOnce(
      () => new Promise((r) => (resolveConfirm = r))
    );

    const localWrapper = ({ children }: { children: any }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { useConfirmAsset } = await import("./useAssets");
    const { result } = renderHook(() => useConfirmAsset(), { wrapper: localWrapper });

    act(() => {
      result.current.mutate("a1" as any);
    });

    await waitFor(() => {
      const data = qc.getQueryData<any[]>(["assets", "assets", "property"]);
      const row = data?.find((r) => r.id === "a1");
      expect(new Date(row.lastReviewedAt).getTime()).toBeGreaterThan(before.getTime());
    });

    resolveConfirm!({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
