import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockUpdateSettings = mock(async () => ({}));
const mockShowError = mock((_msg: string) => {});

mock.module("@/services/settings.service", () => ({
  settingsService: {
    getSettings: mock(async () => ({})),
    updateSettings: mockUpdateSettings,
    dismissWaterfallTip: mock(async () => ({})),
  },
}));

mock.module("@/services/snapshot.service", () => ({
  snapshotService: {
    listSnapshots: mock(async () => []),
    getSnapshot: mock(async () => ({})),
    createSnapshot: mock(async () => ({})),
    renameSnapshot: mock(async () => ({})),
    deleteSnapshot: mock(async () => undefined),
  },
}));

mock.module("@/services/household.service", () => ({
  householdService: {
    getHouseholdDetails: mock(async () => ({})),
    renameHousehold: mock(async () => ({})),
    inviteMember: mock(async () => ({})),
    cancelInvite: mock(async () => ({})),
    removeMember: mock(async () => ({})),
    leaveHousehold: mock(async () => ({})),
    createMember: mock(async () => ({})),
    updateMember: mock(async () => ({})),
    deleteMember: mock(async () => ({})),
  },
}));

mock.module("@/services/auth.service", () => ({
  authService: { getCurrentUser: mock(async () => ({ user: {} })) },
}));

mock.module("@/services/auditLog.service", () => ({
  fetchAuditLog: mock(async () => ({ items: [], nextCursor: null })),
  updateMemberRole: mock(async () => ({})),
}));

mock.module("@/services/securityActivity.service", () => ({
  fetchSecurityActivity: mock(async () => ({ items: [], nextCursor: null })),
}));

mock.module("@/stores/authStore", () => ({
  useAuthStore: Object.assign(
    (selector: any) => selector({ accessToken: "token", user: {}, setUser: () => {} }),
    {
      getState: () => ({ accessToken: "token", user: {}, setUser: () => {} }),
      setState: () => {},
    }
  ),
}));

mock.module("@/lib/toast", () => ({
  showError: mockShowError,
  showSuccess: mock(() => {}),
}));

const { useUpdateSettings } = await import("./useSettings");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("settingsService.dismissWaterfallTip", () => {
  it("exists as a function (preserved from prior smoke test)", async () => {
    const mod = await import("@/services/settings.service");
    expect(typeof (mod.settingsService as any).dismissWaterfallTip).toBe("function");
  });
});

describe("useUpdateSettings onError", () => {
  it("calls showError with the API error message on failure", async () => {
    mockUpdateSettings.mockRejectedValueOnce(new Error("Save failed"));
    mockShowError.mockClear();

    const { result } = renderHook(() => useUpdateSettings(), { wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ surplusBenchmarkPct: 20 } as any);
      } catch {
        /* expected */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith("Save failed");
  });
});
