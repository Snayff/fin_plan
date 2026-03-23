import { z } from "zod";

export const IncomeFrequencyEnum = z.enum(["monthly", "annual", "one_off"]);
export type IncomeFrequency = z.infer<typeof IncomeFrequencyEnum>;

export const WaterfallItemTypeEnum = z.enum([
  "income_source",
  "committed_bill",
  "yearly_bill",
  "discretionary_category",
  "savings_allocation",
]);
export type WaterfallItemType = z.infer<typeof WaterfallItemTypeEnum>;

// ─── Income ──────────────────────────────────────────────────────────────────

export const createIncomeSourceSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: IncomeFrequencyEnum,
  expectedMonth: z.number().int().min(1).max(12).optional(),
  ownerId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateIncomeSourceSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  frequency: IncomeFrequencyEnum.optional(),
  expectedMonth: z.number().int().min(1).max(12).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const endIncomeSourceSchema = z.object({
  endedAt: z.coerce.date().optional(),
});

export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>;
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

export interface WaterfallSummary {
  income: {
    total: number;
    monthly: IncomeSourceRow[];
    annual: (IncomeSourceRow & { monthlyAmount: number })[];
    oneOff: IncomeSourceRow[];
  };
  committed: {
    monthlyTotal: number;
    monthlyAvg12: number;
    bills: CommittedBillRow[];
    yearlyBills: YearlyBillRow[];
  };
  discretionary: {
    total: number;
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
  expectedMonth: number | null;
  ownerId: string | null;
  sortOrder: number;
  endedAt: Date | null;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
