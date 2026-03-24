import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import PlannerPage from "./PlannerPage";

mock.module("@/hooks/usePlanner", () => ({
  usePurchases: () => ({ data: undefined, isLoading: true, isError: false, refetch: () => {} }),
  useGiftPersons: () => ({ data: undefined, isLoading: false, isError: false, refetch: () => {} }),
  useYearBudget: () => ({ data: undefined, isLoading: false }),
  useUpcomingGifts: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useCreatePurchase: () => ({ mutate: () => {}, isPending: false }),
  useUpdatePurchase: () => ({ mutate: () => {}, isPending: false }),
  useDeletePurchase: () => ({ mutate: () => {}, isPending: false }),
  useUpsertBudget: () => ({ mutate: () => {}, isPending: false }),
  useCreateGiftPerson: () => ({ mutate: () => {}, isPending: false }),
  useDeleteGiftPerson: () => ({ mutate: () => {}, isPending: false }),
}));

describe("PlannerPage loading state", () => {
  it("shows SkeletonLoader in right panel when purchases are loading", () => {
    renderWithProviders(<PlannerPage />, { initialEntries: ["/planner"] });
    // SkeletonLoader renders blocks with bg-muted class
    const blocks = document.querySelectorAll(".bg-muted");
    expect(blocks.length).toBeGreaterThan(0);
  });
});
