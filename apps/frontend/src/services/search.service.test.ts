import { describe, it, expect, vi, beforeEach } from "vitest";

const getMock = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { get: getMock },
}));

import { searchService } from "./search.service";

beforeEach(() => {
  getMock.mockReset();
});

describe("searchService.search", () => {
  it("calls GET /api/search with an encoded query and returns results", async () => {
    getMock.mockResolvedValue({
      results: [
        {
          kind: "income_source",
          id: "1",
          name: "Salary",
          subtitle: "Income · Source",
          route: "/income",
          focusId: "1",
        },
      ],
    });

    const res = await searchService.search("sal ary");

    expect(getMock).toHaveBeenCalledWith("/api/search?q=sal%20ary");
    expect(res.results).toHaveLength(1);
    expect(res.results[0]?.kind).toBe("income_source");
  });
});
