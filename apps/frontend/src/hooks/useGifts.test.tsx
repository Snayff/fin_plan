import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const giftsApiMock = {
  getState: mock(() => Promise.resolve({ mode: "synced", year: 2026, people: [] } as any)),
  getPerson: mock(() => Promise.resolve({ person: { id: "p1" }, allocations: [] } as any)),
  getUpcoming: mock(() => Promise.resolve({ callouts: {}, groups: [] } as any)),
  setBudget: mock(() => Promise.resolve({ annualBudget: 1000 })),
  upsertAllocation: mock(() => Promise.resolve({})),
  setMode: mock(() => Promise.resolve({})),
  createPerson: mock(() => Promise.resolve({})),
  deletePerson: mock(() => Promise.resolve()),
};
mock.module("@/services/gifts.service", () => ({ giftsApi: giftsApiMock }));

const { useGiftsState, useGiftPerson, useGiftsUpcoming, GIFTS_KEYS } = await import("./useGifts");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  giftsApiMock.getState.mockClear();
  giftsApiMock.getPerson.mockClear();
  giftsApiMock.getUpcoming.mockClear();
  giftsApiMock.setBudget.mockClear();
  giftsApiMock.upsertAllocation.mockClear();
  giftsApiMock.setMode.mockClear();
  giftsApiMock.createPerson.mockClear();
  giftsApiMock.deletePerson.mockClear();
});

describe("GIFTS_KEYS", () => {
  it("namespace is 'gifts'", () => {
    expect(GIFTS_KEYS.state(2026)[0]).toBe("gifts");
  });

  it("state key includes year", () => {
    expect(GIFTS_KEYS.state(2026)).toEqual(["gifts", "state", 2026]);
  });

  it("person key includes id and year", () => {
    expect(GIFTS_KEYS.person("p1", 2026)).toEqual(["gifts", "person", "p1", 2026]);
  });
});

describe("useGiftsState", () => {
  it("queries getState with the year", async () => {
    const { result } = renderHook(() => useGiftsState(2026), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(giftsApiMock.getState).toHaveBeenCalledWith(2026);
  });
});

describe("useGiftPerson", () => {
  it("queries getPerson with id and year", async () => {
    const { result } = renderHook(() => useGiftPerson("p1", 2026), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(giftsApiMock.getPerson).toHaveBeenCalledWith("p1", 2026);
  });
});

describe("useGiftsUpcoming", () => {
  it("queries getUpcoming with year", async () => {
    const { result } = renderHook(() => useGiftsUpcoming(2026), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(giftsApiMock.getUpcoming).toHaveBeenCalledWith(2026);
  });
});
