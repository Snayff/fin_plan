import { describe, it, expect, beforeEach, mock } from "bun:test";

const apiClientMock = {
  get: mock(() => Promise.resolve({ items: [], nextCursor: null } as any)),
};
mock.module("@/lib/api", () => ({ apiClient: apiClientMock }));

const { fetchSecurityActivity } = await import("./securityActivity.service");

beforeEach(() => {
  apiClientMock.get.mockClear();
});

describe("fetchSecurityActivity", () => {
  it("requests the bare endpoint when no params are given", async () => {
    await fetchSecurityActivity({});
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/security-activity");
  });

  it("appends a cursor query param", async () => {
    await fetchSecurityActivity({ cursor: "abc" });
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/security-activity?cursor=abc");
  });

  it("appends a limit query param", async () => {
    await fetchSecurityActivity({ limit: 25 });
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/security-activity?limit=25");
  });

  it("combines cursor and limit", async () => {
    await fetchSecurityActivity({ cursor: "abc", limit: 25 });
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/security-activity?cursor=abc&limit=25");
  });

  it("returns the response from the API client", async () => {
    const payload = { items: [{ id: "evt-1" }], nextCursor: "next" };
    apiClientMock.get.mockResolvedValueOnce(payload as any);
    const result = await fetchSecurityActivity({});
    expect(result).toEqual(payload as any);
  });
});
