import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSecurityActivity } from "./useSettings";

mock.module("@/services/securityActivity.service", () => ({
  fetchSecurityActivity: mock(async () => ({
    entries: [
      {
        id: "sa-1",
        action: "LOGIN_SUCCESS",
        createdAt: "2025-01-01T00:00:00.000Z",
        metadata: null,
      },
    ],
    nextCursor: null,
  })),
}));

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useSecurityActivity", () => {
  it("fetches security activity entries successfully", async () => {
    const { result } = renderHook(() => useSecurityActivity(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const pages = result.current.data?.pages ?? [];
    expect(pages).toHaveLength(1);
    expect(pages[0]!.entries).toHaveLength(1);
    expect(pages[0]!.entries[0]!.action).toBe("LOGIN_SUCCESS");
    expect(pages[0]!.nextCursor).toBeNull();
  });

  it("returns undefined data while loading", () => {
    const { result } = renderHook(() => useSecurityActivity(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
