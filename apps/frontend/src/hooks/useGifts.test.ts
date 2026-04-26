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

describe("useUpsertAllocation invalidation scope", () => {
  it("invalidates only allocation-affected query keys, not all gift queries", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Seed 8 gift queries
    qc.setQueryData(["gifts", "state", 2026], { sentinel: "state" });
    qc.setQueryData(["gifts", "quickAddMatrix", 2026], { sentinel: "matrix" });
    qc.setQueryData(["gifts", "person", "p1", 2026], { sentinel: "person" });
    qc.setQueryData(["gifts", "upcoming", 2026], { sentinel: "upcoming" });
    qc.setQueryData(["gifts", "settings"], { sentinel: "settings" });
    qc.setQueryData(["gifts", "years"], { sentinel: "years" });
    qc.setQueryData(["gifts", "configEvents"], { sentinel: "configEvents" });
    qc.setQueryData(["gifts", "configPeople", "all", 2026], { sentinel: "configPeople" });

    const invalidated = new Set<string>();
    const orig = qc.invalidateQueries.bind(qc);
    qc.invalidateQueries = (filters: any) => {
      invalidated.add(JSON.stringify(filters?.queryKey));
      return orig(filters);
    };

    const localWrapper = ({ children }: { children: any }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { useUpsertAllocation: hook } = await import("./useGifts");
    const { result } = renderHook(() => hook(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.mutateAsync({
        personId: "p1",
        eventId: "e1",
        year: 2026,
        data: { planned: 50 } as any,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should NOT have invalidated `["gifts"]` blanket key
    expect(invalidated.has(JSON.stringify(["gifts"]))).toBe(false);
    // Should have invalidated each narrow key
    expect(invalidated.has(JSON.stringify(["gifts", "state", 2026]))).toBe(true);
    expect(invalidated.has(JSON.stringify(["gifts", "quickAddMatrix", 2026]))).toBe(true);
  });
});
