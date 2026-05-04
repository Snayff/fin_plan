import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { server } from "@/test/msw/server";
import { useSearchQuery } from "../useSearchQuery";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useSearchQuery", () => {
  it("returns grouped results: data + help + actions", async () => {
    server.use(
      http.get("http://localhost:3001/api/search", ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") ?? "";
        if (q.toLowerCase().includes("mortgage")) {
          return HttpResponse.json({
            results: [
              {
                kind: "committed_item",
                id: "1",
                name: "Mortgage",
                subtitle: "Committed · Item",
                route: "/committed",
                focusId: "1",
              },
            ],
          });
        }
        return HttpResponse.json({ results: [] });
      })
    );

    const { result } = renderHook(() => useSearchQuery("mortgage"), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.groups.data.length).toBeGreaterThan(0);
    expect(result.current.groups.data[0]!.name).toBe("Mortgage");
  });

  it("returns empty groups when query is empty", () => {
    const { result } = renderHook(() => useSearchQuery(""), { wrapper });
    expect(result.current.groups.data).toEqual([]);
    expect(result.current.groups.help).toEqual([]);
    expect(result.current.groups.actions).toEqual([]);
  });

  it("filters actions by label substring", async () => {
    server.use(
      http.get("http://localhost:3001/api/search", () => HttpResponse.json({ results: [] }))
    );

    const { result } = renderHook(() => useSearchQuery("settings"), { wrapper });
    await waitFor(() => expect(result.current.groups.actions.length).toBeGreaterThan(0));
    expect(result.current.groups.actions.some((a) => a.label.includes("Settings"))).toBe(true);
  });
});
