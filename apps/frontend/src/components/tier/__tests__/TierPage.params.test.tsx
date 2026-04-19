import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TierPage from "../TierPage";

let _searchParams = new URLSearchParams();

mock.module("react-router-dom", () => ({
  useSearchParams: () => [_searchParams, (_next: URLSearchParams) => {}],
}));

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: mock(() => ({
    isLoading: false,
    data: [{ id: "sub-1", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false }],
  })),
  useTierItems: mock(() => ({
    isLoading: false,
    data: [],
  })),
  useCreateItem: mock(() => ({ isPending: false, mutateAsync: async () => ({}) })),
  useDeleteItem: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: mock(() => ({ data: { showPence: false } })),
}));

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: mock(() => ({
    isLoading: false,
    data: [{ id: "sub-1", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false }],
  })),
  useTierItems: mock(() => ({
    isLoading: false,
    data: [],
  })),
  useCreateItem: mock(() => ({ isPending: false, mutateAsync: async () => ({}) })),
  useDeleteItem: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
}));

function renderAt(searchParams: URLSearchParams) {
  _searchParams = searchParams;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TierPage tier="committed" />
    </QueryClientProvider>
  );
}

describe("TierPage ?add=1", () => {
  it("opens the add-item form when navigated with ?add=1", () => {
    renderAt(new URLSearchParams("add=1"));
    // ItemArea with initialIsAdding=true shows the ItemForm which has a Name input
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("does not show the add-item form when no ?add param", () => {
    renderAt(new URLSearchParams());
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});
