import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waterfallService } from "@/services/waterfall.service";
import { showError } from "@/lib/toast";
import type { CreatePeriodInput, UpdatePeriodInput } from "@finplan/shared";

export const WATERFALL_KEYS = {
  summary: ["waterfall", "summary"] as const,
  financialSummary: ["waterfall", "financial-summary"] as const,
  history: (type: string, id: string) => ["waterfall", "history", type, id] as const,
  subcategories: (tier: string) => ["waterfall", "subcategories", tier] as const,
};

export function useWaterfallSummary() {
  return useQuery({
    queryKey: WATERFALL_KEYS.summary,
    queryFn: waterfallService.getSummary,
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: WATERFALL_KEYS.financialSummary,
    queryFn: waterfallService.getFinancialSummary,
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
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
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
      data: { name?: string };
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
          return waterfallService.updateDiscretionary(id, data);
        case "savings":
          return waterfallService.updateSavings(id, data);
        default:
          return Promise.reject(new Error(`Unknown type: ${type}`));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      void queryClient.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
    },
  });
}

const TIER_ITEM_KEYS = {
  items: (tier: string) => ["waterfall", "tier-items", tier] as const,
};

export function useSubcategories(tier: "income" | "committed" | "discretionary") {
  return useQuery({
    queryKey: WATERFALL_KEYS.subcategories(tier),
    queryFn: () => waterfallService.getSubcategories(tier),
    staleTime: 10 * 60 * 1000,
  });
}

const spendTypeToFrequency: Record<string, "monthly" | "annual" | "one_off"> = {
  monthly: "monthly",
  yearly: "annual",
  one_off: "one_off",
};

export function useCreateItem(tier: "income" | "committed" | "discretionary") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tier === "income") {
        const { spendType, ...rest } = data;
        return waterfallService.createIncome({
          ...rest,
          frequency: spendTypeToFrequency[spendType as string] ?? "monthly",
        } as any);
      }
      if (tier === "committed") return waterfallService.createCommitted(data as any);
      return waterfallService.createDiscretionary(data as any);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
      void qc.invalidateQueries({ queryKey: TIER_ITEM_KEYS.items(tier) });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : ((error as Record<string, unknown>)?.message as string | undefined);
      showError(message ?? "Failed to save item");
    },
  });
}

export function useConfirmWaterfallItem(
  tier: "income" | "committed" | "discretionary",
  id: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (tier === "income") return waterfallService.confirmIncome(id);
      if (tier === "committed") return waterfallService.confirmCommitted(id);
      return waterfallService.confirmDiscretionary(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
      void qc.invalidateQueries({ queryKey: TIER_ITEM_KEYS.items(tier) });
    },
  });
}

export function useDeleteItem(tier: "income" | "committed" | "discretionary", id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!id) return Promise.reject(new Error("No item ID provided for delete"));
      if (tier === "income") return waterfallService.deleteIncome(id);
      if (tier === "committed") return waterfallService.deleteCommitted(id);
      return waterfallService.deleteDiscretionary(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
      void qc.invalidateQueries({ queryKey: TIER_ITEM_KEYS.items(tier) });
    },
  });
}

export function useTierUpdateItem(tier: "income" | "committed" | "discretionary", id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tier === "income") return waterfallService.updateIncome(id, data as any);
      if (tier === "committed") return waterfallService.updateCommitted(id, data as any);
      return waterfallService.updateDiscretionary(id, data as any);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.financialSummary });
      void qc.invalidateQueries({ queryKey: TIER_ITEM_KEYS.items(tier) });
    },
  });
}

export interface TierItemRow {
  id: string;
  name: string;
  amount: number;
  spendType: "monthly" | "yearly" | "one_off";
  subcategoryId: string;
  notes: string | null;
  /** Required for income/committed; nullable for discretionary (only set on one_off). */
  dueDate: Date | null;
  lastReviewedAt: Date;
  createdAt: Date;
  sortOrder: number;
  lifecycleState?: "active" | "future" | "expired";
  periods?: Array<{ id: string; startDate: Date; endDate: Date | null; amount: number }>;
  nextPeriod?: { amount: number; startDate: Date } | null;
}

function normaliseIncomeFrequency(frequency: string): "monthly" | "yearly" | "one_off" {
  if (frequency === "annual") return "yearly";
  if (frequency === "one_off") return "one_off";
  return "monthly";
}

function mapTierItem(r: any, spendType: string): TierItemRow {
  const periods = (r.periods ?? []).map((p: any) => ({
    id: p.id,
    startDate: new Date(p.startDate),
    endDate: p.endDate ? new Date(p.endDate) : null,
    amount: p.amount,
  }));

  // Find next future period for scheduled change indicator
  const now = new Date();
  const nextPeriod = periods.find((p: { startDate: Date }) => p.startDate > now) ?? null;

  return {
    id: r.id,
    name: r.name,
    amount: r.amount,
    spendType: spendType as "monthly" | "yearly" | "one_off",
    subcategoryId: r.subcategoryId ?? "",
    notes: r.notes ?? null,
    dueDate: r.dueDate ? new Date(r.dueDate) : null,
    lastReviewedAt: new Date(r.lastReviewedAt),
    createdAt: new Date(r.createdAt),
    sortOrder: r.sortOrder ?? 0,
    lifecycleState: r.lifecycleState ?? "active",
    periods,
    nextPeriod,
  };
}

async function fetchTierItems(
  tier: "income" | "committed" | "discretionary"
): Promise<TierItemRow[]> {
  if (tier === "income") {
    const rows = await waterfallService.listIncome();
    return rows.map((r: any) => mapTierItem(r, normaliseIncomeFrequency(r.frequency)));
  }
  if (tier === "committed") {
    const rows = await waterfallService.listCommitted();
    return rows.map((r: any) => mapTierItem(r, r.spendType ?? "monthly"));
  }
  // discretionary
  const rows = await waterfallService.listDiscretionary();
  return rows.map((r: any) => mapTierItem(r, r.spendType ?? "monthly"));
}

export function useTierItems(tier: "income" | "committed" | "discretionary") {
  return useQuery({
    queryKey: TIER_ITEM_KEYS.items(tier),
    queryFn: () => fetchTierItems(tier),
  });
}

// ─── Period hooks ─────────────────────────────────────────────────────────────

export const PERIOD_KEYS = {
  list: (itemType: string, itemId: string) => ["periods", itemType, itemId] as const,
};

export function usePeriods(itemType: string, itemId: string) {
  return useQuery({
    queryKey: PERIOD_KEYS.list(itemType, itemId),
    queryFn: () => waterfallService.listPeriods(itemType, itemId),
    enabled: !!itemId,
  });
}

export function useCreatePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreatePeriodInput, "itemType" | "itemId">) =>
      waterfallService.createPeriod({ ...data, itemType, itemId } as CreatePeriodInput),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useUpdatePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriodInput }) =>
      waterfallService.updatePeriod(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useDeletePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => waterfallService.deletePeriod(periodId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}
