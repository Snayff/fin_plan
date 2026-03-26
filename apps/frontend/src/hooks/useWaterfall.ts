import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waterfallService } from "@/services/waterfall.service";

export const WATERFALL_KEYS = {
  summary: ["waterfall", "summary"] as const,
  cashflow: (year: number) => ["waterfall", "cashflow", year] as const,
  history: (type: string, id: string) => ["waterfall", "history", type, id] as const,
  subcategories: (tier: string) => ["waterfall", "subcategories", tier] as const,
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

export function useSubcategories(tier: "income" | "committed" | "discretionary") {
  return useQuery({
    queryKey: WATERFALL_KEYS.subcategories(tier),
    queryFn: () => waterfallService.getSubcategories(tier),
    staleTime: 10 * 60 * 1000,
  });
}

export interface TierItemRow {
  id: string;
  name: string;
  amount: number;
  spendType: "monthly" | "yearly" | "one_off";
  subcategoryId: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

const TIER_ITEM_KEYS = {
  items: (tier: string) => ["waterfall", "tier-items", tier] as const,
};

function normaliseIncomeFrequency(frequency: string): "monthly" | "yearly" | "one_off" {
  if (frequency === "annual") return "yearly";
  if (frequency === "one_off") return "one_off";
  return "monthly";
}

async function fetchTierItems(
  tier: "income" | "committed" | "discretionary"
): Promise<TierItemRow[]> {
  if (tier === "income") {
    const rows = await waterfallService.listIncome();
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      spendType: normaliseIncomeFrequency(r.frequency),
      subcategoryId: r.subcategoryId ?? "",
      notes: r.notes ?? null,
      lastReviewedAt: new Date(r.lastReviewedAt),
      sortOrder: r.sortOrder ?? 0,
    }));
  }
  if (tier === "committed") {
    const rows = await waterfallService.listCommitted();
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      spendType: (r.spendType ?? "monthly") as "monthly" | "yearly" | "one_off",
      subcategoryId: r.subcategoryId ?? "",
      notes: r.notes ?? null,
      lastReviewedAt: new Date(r.lastReviewedAt),
      sortOrder: r.sortOrder ?? 0,
    }));
  }
  // discretionary
  const rows = await waterfallService.listDiscretionary();
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    spendType: (r.spendType ?? "monthly") as "monthly" | "yearly" | "one_off",
    subcategoryId: r.subcategoryId ?? "",
    notes: r.notes ?? null,
    lastReviewedAt: new Date(r.lastReviewedAt),
    sortOrder: r.sortOrder ?? 0,
  }));
}

export function useTierItems(tier: "income" | "committed" | "discretionary") {
  return useQuery({
    queryKey: TIER_ITEM_KEYS.items(tier),
    queryFn: () => fetchTierItems(tier),
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
