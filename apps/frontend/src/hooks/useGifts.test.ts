import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockCreatePerson = mock(async () => ({ id: "p1" }));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/gifts.service", () => ({
  giftsApi: {
    createPerson: mockCreatePerson,
    updatePerson: mock(async () => ({})),
    deletePerson: mock(async () => undefined),
    createEvent: mock(async () => ({})),
    updateEvent: mock(async () => ({})),
    deleteEvent: mock(async () => undefined),
    upsertAllocation: mock(async () => ({})),
    bulkUpsert: mock(async () => ({ count: 0 })),
    setBudget: mock(async () => ({})),
    setMode: mock(async () => ({})),
    dismissRollover: mock(async () => undefined),
  },
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useCreateGiftPerson } = await import("./useGifts");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCreateGiftPerson onError", () => {
  it("calls showError with the API error message on failure", async () => {
    mockCreatePerson.mockRejectedValueOnce(new Error("Person already exists"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useCreateGiftPerson(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ name: "Test" } as any);
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Person already exists");
  });
});
