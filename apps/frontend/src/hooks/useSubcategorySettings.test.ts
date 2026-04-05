import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockSaveSubcategories = mock(async () => []);
const mockGetSubcategoryCounts = mock(async () => ({}));
const mockResetSubcategories = mock(async () => ({ success: true }));

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    getSubcategories: mock(async () => []),
    getSubcategoryCounts: mockGetSubcategoryCounts,
    saveSubcategories: mockSaveSubcategories,
    resetSubcategories: mockResetSubcategories,
  },
}));

const { useSubcategoryCounts, useSaveSubcategories, useResetSubcategories } =
  await import("./useSubcategorySettings");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useSubcategoryCounts", () => {
  it("fetches item counts for a tier", async () => {
    mockGetSubcategoryCounts.mockResolvedValue({ "sub-1": 3 });
    const { result } = renderHook(() => useSubcategoryCounts("income"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ "sub-1": 3 });
  });
});

describe("useSaveSubcategories", () => {
  it("calls saveSubcategories and invalidates queries", async () => {
    mockSaveSubcategories.mockResolvedValue([]);
    const { result } = renderHook(() => useSaveSubcategories(), { wrapper });

    await act(async () => {
      result.current.mutate({
        tier: "income",
        data: { subcategories: [{ name: "Other", sortOrder: 0 }], reassignments: [] },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSaveSubcategories).toHaveBeenCalled();
  });
});

describe("useResetSubcategories", () => {
  it("calls resetSubcategories", async () => {
    mockResetSubcategories.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useResetSubcategories(), { wrapper });

    await act(async () => {
      result.current.mutate({ reassignments: [] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockResetSubcategories).toHaveBeenCalled();
  });
});
