import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAuditLog } from "./useSettings";

mock.module("@/services/auditLog.service", () => ({
  fetchAuditLog: mock(async () => ({
    entries: [
      {
        id: "entry-1",
        actorName: "Test User",
        action: "update",
        resource: "household-settings",
        resourceId: "household-1",
        changes: [{ field: "name", before: "Old Name", after: "New Name" }],
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    nextCursor: null,
  })),
  updateMemberRole: mock(async () => ({ success: true })),
}));

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAuditLog", () => {
  it("fetches audit log entries successfully", async () => {
    const { result } = renderHook(() => useAuditLog({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const pages = result.current.data?.pages ?? [];
    expect(pages).toHaveLength(1);
    expect(pages[0]!.entries).toHaveLength(1);
    expect(pages[0]!.entries[0]!.actorName).toBe("Test User");
    expect(pages[0]!.entries[0]!.action).toBe("update");
  });

  it("returns undefined data while loading", () => {
    const { result } = renderHook(() => useAuditLog({}), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
