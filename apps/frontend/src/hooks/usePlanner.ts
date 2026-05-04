import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plannerService } from "@/services/planner.service";
import { waterfallService } from "@/services/waterfall.service";
import { showError } from "@/lib/toast";

export const PLANNER_KEYS = {
  purchases: (year: number) => ["planner", "purchases", year],
  budget: (year: number) => ["planner", "budget", year],
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function usePurchases(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.purchases(year),
    queryFn: () => plannerService.listPurchases(year),
  });
}

export function useYearBudget(year: number) {
  return useQuery({
    queryKey: PLANNER_KEYS.budget(year),
    queryFn: () => waterfallService.getYearBudget(year),
  });
}

// ─── Purchase Mutations ───────────────────────────────────────────────────────

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof plannerService.createPurchase>[0]) =>
      plannerService.createPurchase(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to create purchase");
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof plannerService.updatePurchase>[1];
    }) => plannerService.updatePurchase(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to update purchase");
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plannerService.deletePurchase(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "purchases"] });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to delete purchase");
    },
  });
}

// ─── Budget Mutation ──────────────────────────────────────────────────────────

export function useUpsertBudget(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof waterfallService.upsertYearBudget>[1]) =>
      waterfallService.upsertYearBudget(year, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLANNER_KEYS.budget(year) });
    },
    onError: (err: Error) => {
      showError(err.message ?? "Failed to update budget");
    },
  });
}
