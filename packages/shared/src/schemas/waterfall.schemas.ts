import { z } from "zod";

export const IncomeFrequencyEnum = z.enum(["monthly", "annual", "one_off"]);
export type IncomeFrequency = z.infer<typeof IncomeFrequencyEnum>;

export const IncomeTypeEnum = z.enum([
  "salary",
  "dividends",
  "freelance",
  "rental",
  "benefits",
  "other",
]);
export type IncomeType = z.infer<typeof IncomeTypeEnum>;

export const WaterfallItemTypeEnum = z.enum([
  "income_source",
  "committed_item",
  "discretionary_item",
  // Legacy (kept for WaterfallHistory backward compat)
  "committed_bill",
  "yearly_bill",
  "discretionary_category",
  "savings_allocation",
]);
export type WaterfallItemType = z.infer<typeof WaterfallItemTypeEnum>;

// ─── New enums ───────────────────────────────────────────────────────────────

export const SpendTypeEnum = z.enum(["monthly", "yearly", "one_off"]);
export type SpendType = z.infer<typeof SpendTypeEnum>;

export const WaterfallTierEnum = z.enum(["income", "committed", "discretionary"]);
export type WaterfallTier = z.infer<typeof WaterfallTierEnum>;

// ─── Subcategory ─────────────────────────────────────────────────────────────

export interface SubcategoryRow {
  id: string;
  householdId: string;
  tier: WaterfallTier;
  name: string;
  sortOrder: number;
  isLocked: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subcategory totals (for overview left panel) ────────────────────────────

export interface SubcategoryTotal {
  id: string;
  name: string;
  sortOrder: number;
  monthlyTotal: number;
  oldestReviewedAt: Date | null;
  itemCount: number;
}

// ─── Committed items (replaces CommittedBill + YearlyBill) ───────────────────

export const createCommittedItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  subcategoryId: z.string().min(1),
  spendType: SpendTypeEnum.default("monthly"),
  notes: z.string().max(500).nullable().optional(),
  ownerId: z.string().optional(),
  dueMonth: z.number().int().min(1).max(12).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCommittedItemSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  subcategoryId: z.string().min(1).optional(),
  spendType: SpendTypeEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  dueMonth: z.number().int().min(1).max(12).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateCommittedItemInput = z.infer<typeof createCommittedItemSchema>;
export type UpdateCommittedItemInput = z.infer<typeof updateCommittedItemSchema>;

// ─── Discretionary items (replaces DiscretionaryCategory + SavingsAllocation) ─

export const createDiscretionaryItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  subcategoryId: z.string().min(1),
  spendType: SpendTypeEnum.default("monthly"),
  notes: z.string().max(500).nullable().optional(),
  wealthAccountId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateDiscretionaryItemSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  subcategoryId: z.string().min(1).optional(),
  spendType: SpendTypeEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
  wealthAccountId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateDiscretionaryItemInput = z.infer<typeof createDiscretionaryItemSchema>;
export type UpdateDiscretionaryItemInput = z.infer<typeof updateDiscretionaryItemSchema>;

// ─── Income ──────────────────────────────────────────────────────────────────

export const createIncomeSourceSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: IncomeFrequencyEnum,
  incomeType: IncomeTypeEnum.default("other"),
  expectedMonth: z.number().int().min(1).max(12).optional(),
  ownerId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  subcategoryId: z.string().min(1).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateIncomeSourceSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  frequency: IncomeFrequencyEnum.optional(),
  incomeType: IncomeTypeEnum.optional(),
  expectedMonth: z.number().int().min(1).max(12).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  subcategoryId: z.string().min(1).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const endIncomeSourceSchema = z.object({
  endedAt: z.coerce.date().optional(),
});

export type CreateIncomeSourceInput = z.input<typeof createIncomeSourceSchema>;
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>;
export type EndIncomeSourceInput = z.infer<typeof endIncomeSourceSchema>;

// ─── Committed Bills ──────────────────────────────────────────────────────────

export const createCommittedBillSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  ownerId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCommittedBillSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  ownerId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateCommittedBillInput = z.infer<typeof createCommittedBillSchema>;
export type UpdateCommittedBillInput = z.infer<typeof updateCommittedBillSchema>;

// ─── Yearly Bills ─────────────────────────────────────────────────────────────

export const createYearlyBillSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  dueMonth: z.number().int().min(1).max(12),
  sortOrder: z.number().int().optional(),
});

export const updateYearlyBillSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  dueMonth: z.number().int().min(1).max(12).optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateYearlyBillInput = z.infer<typeof createYearlyBillSchema>;
export type UpdateYearlyBillInput = z.infer<typeof updateYearlyBillSchema>;

// ─── Discretionary ────────────────────────────────────────────────────────────

export const createDiscretionaryCategorySchema = z.object({
  name: z.string().min(1),
  monthlyBudget: z.number().positive(),
  sortOrder: z.number().int().optional(),
});

export const updateDiscretionaryCategorySchema = z.object({
  name: z.string().min(1).optional(),
  monthlyBudget: z.number().positive().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateDiscretionaryCategoryInput = z.infer<typeof createDiscretionaryCategorySchema>;
export type UpdateDiscretionaryCategoryInput = z.infer<typeof updateDiscretionaryCategorySchema>;

// ─── Savings ──────────────────────────────────────────────────────────────────

export const createSavingsAllocationSchema = z.object({
  name: z.string().min(1),
  monthlyAmount: z.number().positive(),
  wealthAccountId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateSavingsAllocationSchema = z.object({
  name: z.string().min(1).optional(),
  monthlyAmount: z.number().positive().optional(),
  wealthAccountId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateSavingsAllocationInput = z.infer<typeof createSavingsAllocationSchema>;
export type UpdateSavingsAllocationInput = z.infer<typeof updateSavingsAllocationSchema>;

// ─── Batch confirm ────────────────────────────────────────────────────────────

export const confirmBatchSchema = z.object({
  items: z.array(
    z.object({
      type: WaterfallItemTypeEnum,
      id: z.string(),
    })
  ),
});

export type ConfirmBatchInput = z.infer<typeof confirmBatchSchema>;

// ─── Response types ───────────────────────────────────────────────────────────

export interface IncomeByType {
  type: IncomeType;
  label: string;
  monthlyTotal: number;
  sources: IncomeSourceRow[];
}

export interface WaterfallSummary {
  income: {
    total: number;
    byType: IncomeByType[];
    bySubcategory: SubcategoryTotal[];
    monthly: IncomeSourceRow[];
    annual: (IncomeSourceRow & { monthlyAmount: number })[];
    oneOff: IncomeSourceRow[];
  };
  committed: {
    monthlyTotal: number;
    monthlyAvg12: number;
    bySubcategory: SubcategoryTotal[];
    bills: CommittedBillRow[];
    yearlyBills: YearlyBillRow[];
  };
  discretionary: {
    total: number;
    bySubcategory: SubcategoryTotal[];
    categories: DiscretionaryCategoryRow[];
    savings: { total: number; allocations: SavingsAllocationRow[] };
  };
  surplus: {
    amount: number;
    percentOfIncome: number;
  };
}

export interface IncomeSourceRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  incomeType: IncomeType;
  expectedMonth: number | null;
  ownerId: string | null;
  sortOrder: number;
  endedAt: Date | null;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  subcategoryId: string | null;
  notes: string | null;
}

export interface CommittedBillRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  ownerId: string | null;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
  dueMonth?: number | null;
}

export interface YearlyBillRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  dueMonth: number;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
  ownerId?: string | null;
}

export interface DiscretionaryCategoryRow {
  id: string;
  householdId: string;
  name: string;
  monthlyBudget: number;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
}

export interface SavingsAllocationRow {
  id: string;
  householdId: string;
  name: string;
  monthlyAmount: number;
  sortOrder: number;
  wealthAccountId: string | null;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
}

export interface CashflowMonth {
  month: number;
  year: number;
  contribution: number;
  bills: { id: string; name: string; amount: number }[];
  oneOffIncome: { id: string; name: string; amount: number }[];
  potAfter: number;
  shortfall: boolean;
}

export const deleteAllWaterfallSchema = z.object({
  confirm: z.literal(true),
});
export type DeleteAllWaterfallInput = z.infer<typeof deleteAllWaterfallSchema>;
