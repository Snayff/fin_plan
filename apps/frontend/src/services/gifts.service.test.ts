import { describe, it, expect, beforeEach, mock } from "bun:test";

const apiClientMock = {
  get: mock(() => Promise.resolve({} as any)),
  post: mock(() => Promise.resolve({} as any)),
  put: mock(() => Promise.resolve({} as any)),
  patch: mock(() => Promise.resolve({} as any)),
  delete: mock(() => Promise.resolve({} as any)),
};
mock.module("@/lib/api", () => ({ apiClient: apiClientMock }));

const { giftsApi } = await import("./gifts.service");

beforeEach(() => {
  apiClientMock.get.mockClear();
  apiClientMock.post.mockClear();
  apiClientMock.put.mockClear();
  apiClientMock.patch.mockClear();
  apiClientMock.delete.mockClear();
});

describe("giftsApi", () => {
  it("getState passes year query", () => {
    giftsApi.getState(2026);
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/gifts/state?year=2026");
  });

  it("getPerson passes id and year", () => {
    giftsApi.getPerson("p1", 2026);
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/gifts/people/p1?year=2026");
  });

  it("getUpcoming passes year", () => {
    giftsApi.getUpcoming(2026);
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/gifts/upcoming?year=2026");
  });

  it("upsertAllocation hits the right URL", () => {
    giftsApi.upsertAllocation("p1", "e1", 2026, { planned: 50 });
    expect(apiClientMock.put).toHaveBeenCalledWith("/api/gifts/allocations/p1/e1/2026", {
      planned: 50,
    });
  });

  it("setMode posts to /mode", () => {
    giftsApi.setMode({ mode: "independent" });
    expect(apiClientMock.put).toHaveBeenCalledWith("/api/gifts/mode", {
      mode: "independent",
    });
  });

  it("setBudget passes year in URL", () => {
    giftsApi.setBudget(2026, { annualBudget: 1000 });
    expect(apiClientMock.put).toHaveBeenCalledWith("/api/gifts/budget/2026", {
      annualBudget: 1000,
    });
  });

  it("createPerson posts data", () => {
    giftsApi.createPerson({ name: "Alice" });
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/gifts/people", {
      name: "Alice",
    });
  });

  it("deletePerson calls delete", () => {
    giftsApi.deletePerson("p1");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/gifts/people/p1");
  });

  it("bulkUpsert posts to /allocations/bulk", () => {
    const cells = [{ personId: "p1", eventId: "e1", year: 2026, planned: 50 }];
    giftsApi.bulkUpsert({ cells });
    expect(apiClientMock.post).toHaveBeenCalledWith("/api/gifts/allocations/bulk", { cells });
  });

  it("dismissRollover calls delete", () => {
    giftsApi.dismissRollover(2026);
    expect(apiClientMock.delete).toHaveBeenCalledWith("/api/gifts/rollover-banner/2026");
  });
});
