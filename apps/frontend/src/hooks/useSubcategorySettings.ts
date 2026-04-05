import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waterfallService } from "@/services/waterfall.service";
import { WATERFALL_KEYS } from "./useWaterfall";
import type {
  BatchSaveSubcategoriesInput,
  ResetSubcategoriesInput,
  WaterfallTier,
} from "@finplan/shared";

export const SUBCATEGORY_SETTINGS_KEYS = {
  counts: (tier: string) => ["subcategory-counts", tier] as const,
};

export function useSubcategoryCounts(tier: WaterfallTier) {
  return useQuery({
    queryKey: SUBCATEGORY_SETTINGS_KEYS.counts(tier),
    queryFn: () => waterfallService.getSubcategoryCounts(tier),
  });
}

export function useSaveSubcategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tier, data }: { tier: WaterfallTier; data: BatchSaveSubcategoriesInput }) =>
      waterfallService.saveSubcategories(tier, data),
    onSuccess: (_data, { tier }) => {
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.subcategories(tier) });
      void qc.invalidateQueries({ queryKey: SUBCATEGORY_SETTINGS_KEYS.counts(tier) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useResetSubcategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ResetSubcategoriesInput) => waterfallService.resetSubcategories(data),
    onSuccess: () => {
      for (const tier of ["income", "committed", "discretionary"]) {
        void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.subcategories(tier) });
        void qc.invalidateQueries({ queryKey: SUBCATEGORY_SETTINGS_KEYS.counts(tier) });
      }
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}
