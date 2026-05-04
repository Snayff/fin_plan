import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockCreateSession = mock(async () => ({ id: "s1" }));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/review-session.service", () => ({
  reviewSessionService: {
    getSession: mock(async () => ({})),
    createSession: mockCreateSession,
    updateSession: mock(async () => ({})),
    deleteSession: mock(async () => undefined),
  },
}));

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    listIncome: mock(async () => []),
    listCommitted: mock(async () => []),
    listYearly: mock(async () => []),
    listDiscretionary: mock(async () => []),
    listSavings: mock(async () => []),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useCreateReviewSession } = await import("./useReviewSession");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCreateReviewSession onError", () => {
  it("calls showError on failure", async () => {
    mockCreateSession.mockRejectedValueOnce(new Error("Already running"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useCreateReviewSession(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Already running");
  });
});
