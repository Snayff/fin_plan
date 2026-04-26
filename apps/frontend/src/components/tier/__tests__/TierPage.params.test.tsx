import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TierPage from "../TierPage";

mock.module("@/hooks/useWaterfall", () => ({
  useSubcategories: mock(() => ({
    isLoading: false,
    data: [{ id: "sub-1", name: "Housing", tier: "committed", sortOrder: 0, isLocked: false }],
  })),
  useTierItems: mock(() => ({ isLoading: false, data: [] })),
  useCreateItem: mock(() => ({ isPending: false, mutateAsync: async () => ({}) })),
  useDeleteItem: mock(() => ({ isPending: false, mutateAsync: async () => {} })),
}));

mock.module("@/hooks/useSettings", () => ({
  useSettings: mock(() => ({ data: { showPence: false } })),
  useHouseholdMembers: mock(() => ({ data: [] })),
}));

function renderAt(url: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/committed" element={<TierPage tier="committed" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("TierPage ?add=1", () => {
  it("opens the add-item form when navigated with ?add=1", () => {
    renderAt("/committed?add=1");
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("does not show the add-item form when no ?add param", () => {
    renderAt("/committed");
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});
