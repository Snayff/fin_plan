import { describe, it, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";
import type { SecurityActivityEntry } from "@finplan/shared";

function makeEntry(overrides: Partial<SecurityActivityEntry>): SecurityActivityEntry {
  return {
    id: "sa-1",
    action: "LOGIN_SUCCESS",
    createdAt: "2025-01-01T00:00:00.000Z",
    metadata: null,
    ...overrides,
  };
}

function mockHook(entries: SecurityActivityEntry[], extra?: object) {
  mock.module("@/hooks/useSettings", () => ({
    useSecurityActivity: () => ({
      data: { pages: [{ entries, nextCursor: null }] },
      isLoading: false,
      isError: false,
      fetchNextPage: mock(() => {}),
      hasNextPage: false,
      isFetchingNextPage: false,
      ...extra,
    }),
  }));
}

describe("SecurityActivitySection", () => {
  it("renders 'Signed in' for LOGIN_SUCCESS entries", async () => {
    mockHook([makeEntry({ action: "LOGIN_SUCCESS" })]);
    const { SecurityActivitySection: Section } = await import("./SecurityActivitySection");
    renderWithProviders(<Section />);
    expect(screen.getByText("Signed in")).toBeTruthy();
  });

  it("renders 'Sign-in attempt failed' for LOGIN_FAILED and does not leak email metadata", async () => {
    mockHook([
      makeEntry({
        id: "sa-2",
        action: "LOGIN_FAILED",
        metadata: { email: "secret@example.com" },
      }),
    ]);
    const { SecurityActivitySection: Section } = await import("./SecurityActivitySection");
    renderWithProviders(<Section />);
    expect(screen.getByText("Sign-in attempt failed")).toBeTruthy();
    expect(screen.queryByText("secret@example.com")).toBeNull();
  });

  it("renders 'Name changed from Old to New' for UPDATE_PROFILE", async () => {
    mockHook([
      makeEntry({
        id: "sa-3",
        action: "UPDATE_PROFILE",
        metadata: { before: { name: "Old" }, after: { name: "New" } },
      }),
    ]);
    const { SecurityActivitySection: Section } = await import("./SecurityActivitySection");
    renderWithProviders(<Section />);
    expect(screen.getByText("Name changed from Old to New")).toBeTruthy();
  });

  it("shows 'Entries older than 180 days' footer note", async () => {
    mockHook([]);
    const { SecurityActivitySection: Section } = await import("./SecurityActivitySection");
    renderWithProviders(<Section />);
    expect(screen.getByText("Entries older than 180 days are automatically removed.")).toBeTruthy();
  });

  it("shows 'No recent activity' when entries are empty", async () => {
    mockHook([]);
    const { SecurityActivitySection: Section } = await import("./SecurityActivitySection");
    renderWithProviders(<Section />);
    expect(screen.getByText("No recent activity")).toBeTruthy();
  });
});
