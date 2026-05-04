import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AssetsPage from "../AssetsPage";

let _searchParams = new URLSearchParams();

mock.module("react-router-dom", () => ({
  useSearchParams: () => [_searchParams, (_next: URLSearchParams) => {}],
}));

mock.module("../../hooks/useAssets.js", () => ({
  useAssetsSummary: mock(() => ({ data: null, isLoading: false })),
  useAssetsByType: mock(() => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: async () => {},
  })),
  useAccountsByType: mock(() => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: async () => {},
  })),
  useCreateAsset: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useUpdateAsset: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useDeleteAsset: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useRecordAssetBalance: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useConfirmAsset: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useCreateAccount: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useUpdateAccount: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useDeleteAccount: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useRecordAccountBalance: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
  useConfirmAccount: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: mock(() => ({ data: { showPence: false } })),
}));

mock.module("@/hooks/useHousehold", () => ({
  useHouseholdMembers: mock(() => ({ data: [], isLoading: false })),
}));

function renderAt(searchParams: URLSearchParams) {
  _searchParams = searchParams;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AssetsPage />
    </QueryClientProvider>
  );
}

describe("AssetsPage ?add=<kind>", () => {
  it("opens the add-asset form when navigated with ?add=asset", () => {
    renderAt(new URLSearchParams("add=asset"));
    // AssetForm renders an aria-label="Name" input when isAddingItem=true
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("does not show the add form when no ?add param", () => {
    renderAt(new URLSearchParams());
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});
