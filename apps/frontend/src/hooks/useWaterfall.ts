import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waterfallService } from "@/services/waterfall.service";

export const WATERFALL_KEYS = {
  summary: ["waterfall", "summary"] as const,
  cashflow: (year: number) => ["waterfall", "cashflow", year] as const,
  history: (type: string, id: string) => ["waterfall", "history", type, id] as const,
};

export function useWaterfallSummary() {
  return useQuery({
    queryKey: WATERFALL_KEYS.summary,
    queryFn: waterfallService.getSummary,
  });
}

export function useCashflow(year: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: WATERFALL_KEYS.cashflow(year),
    queryFn: () => waterfallService.getCashflow(year),
    enabled: options?.enabled ?? true,
  });
}

export function useItemHistory(type: string, id: string) {
  return useQuery({
    queryKey: WATERFALL_KEYS.history(type, id),
    queryFn: () => waterfallService.getHistory(type, id),
    enabled: !!id,
  });
}

type WaterfallItemType =
  | "income_source"
  | "committed_bill"
  | "yearly_bill"
  | "discretionary_category"
  | "savings_allocation";

function typeToUrlSegment(type: string): string {
  const map: Record<string, string> = {
    income_source: "income",
    committed_bill: "committed",
    yearly_bill: "yearly",
    discretionary_category: "discretionary",
    savings_allocation: "savings",
  };
  return map[type] ?? type;
}

export function useConfirmItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }: { type: WaterfallItemType; id: string }) => {
      const segment = typeToUrlSegment(type);
      switch (segment) {
        case "income":
          return waterfallService.confirmIncome(id);
        case "committed":
          return waterfallService.confirmCommitted(id);
        case "yearly":
          return waterfallService.confirmYearly(id);
        case "discretionary":
          return waterfallService.confirmDiscretionary(id);
        case "savings":
          return waterfallService.confirmSavings(id);
        default:
          return Promise.reject(new Error(`Unknown type: ${type}`));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
      data,
    }: {
      type: WaterfallItemType;
      id: string;
      data: { amount?: number; name?: string };
    }) => {
      const segment = typeToUrlSegment(type);
      switch (segment) {
        case "income":
          return waterfallService.updateIncome(id, data);
        case "committed":
          return waterfallService.updateCommitted(id, data);
        case "yearly":
          return waterfallService.updateYearly(id, data);
        case "discretionary":
          return waterfallService.updateDiscretionary(id, { monthlyBudget: data.amount });
        case "savings":
          return waterfallService.updateSavings(id, { monthlyAmount: data.amount });
        default:
          return Promise.reject(new Error(`Unknown type: ${type}`));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useEndIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, endedAt }: { id: string; endedAt: Date }) =>
      waterfallService.endIncome(id, { endedAt }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}
