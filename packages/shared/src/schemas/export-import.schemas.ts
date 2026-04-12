import { z } from "zod";

const CURRENT_SCHEMA_VERSION = 2;

const exportMemberSchema = z.object({
  name: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  dateOfBirth: z.string().datetime().nullable().optional(),
  retirementYear: z.number().int().nullable().optional(),
});

const exportSubcategorySchema = z.object({
  tier: z.enum(["income", "committed", "discretionary"]),
  name: z.string(),
  sortOrder: z.number().int(),
  isLocked: z.boolean(),
  isDefault: z.boolean(),
  items: z.array(z.string()).optional(),
});

const exportIncomeSourceSchema = z.object({
  subcategoryName: z.string(),
  name: z.string(),
  frequency: z.enum(["monthly", "annual", "one_off"]),
  incomeType: z.enum(["salary", "dividends", "freelance", "rental", "benefits", "other"]),
  dueDate: z.coerce.date(),
  ownerName: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  lastReviewedAt: z.string().datetime(),
  notes: z.string().nullable().optional(),
  periods: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      amount: z.number(),
    })
  ),
});

const exportCommittedItemSchema = z.object({
  subcategoryName: z.string(),
  name: z.string(),
  spendType: z.enum(["monthly", "yearly", "one_off"]),
  notes: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  dueDate: z.coerce.date(),
  sortOrder: z.number().int(),
  lastReviewedAt: z.string().datetime(),
  periods: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      amount: z.number(),
    })
  ),
});

const exportDiscretionaryItemSchema = z.object({
  subcategoryName: z.string(),
  name: z.string(),
  spendType: z.enum(["monthly", "yearly", "one_off"]),
  notes: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable(),
  sortOrder: z.number().int(),
  lastReviewedAt: z.string().datetime(),
  periods: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      amount: z.number(),
    })
  ),
});

const exportItemAmountPeriodSchema = z.object({
  itemType: z.enum(["income_source", "committed_item", "discretionary_item"]),
  itemName: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  amount: z.number(),
});

const exportWaterfallHistorySchema = z.object({
  itemType: z.enum(["income_source", "committed_item", "discretionary_item"]),
  itemName: z.string(),
  value: z.number(),
  recordedAt: z.string().datetime(),
});

const exportAssetSchema = z.object({
  name: z.string(),
  type: z.enum(["Property", "Vehicle", "Other"]),
  ownerName: z.string().nullable().optional(),
  growthRatePct: z.number().nullable().optional(),
  lastReviewedAt: z.string().datetime().nullable().optional(),
  balances: z.array(
    z.object({
      value: z.number(),
      date: z.string(),
      note: z.string().nullable().optional(),
    })
  ),
});

const exportAccountSchema = z.object({
  name: z.string(),
  type: z.enum(["Current", "Savings", "Pension", "StocksAndShares", "Other"]),
  ownerName: z.string().nullable().optional(),
  growthRatePct: z.number().nullable().optional(),
  monthlyContribution: z.number(),
  isCashflowLinked: z.boolean().default(false),
  lastReviewedAt: z.string().datetime().nullable().optional(),
  balances: z.array(
    z.object({
      value: z.number(),
      date: z.string(),
      note: z.string().nullable().optional(),
    })
  ),
});

const exportPurchaseItemSchema = z.object({
  yearAdded: z.number().int(),
  name: z.string(),
  estimatedCost: z.number(),
  priority: z.enum(["lowest", "low", "medium", "high"]),
  scheduledThisYear: z.boolean(),
  fundingSources: z.array(z.string()),
  fundingAccountId: z.string().nullable().optional(),
  status: z.enum(["not_started", "in_progress", "done"]),
  reason: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

const exportPlannerYearBudgetSchema = z.object({
  year: z.number().int(),
  purchaseBudget: z.number(),
  giftBudget: z.number(),
});

const exportGiftPersonSchemaV2 = z.object({
  name: z.string(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  isHouseholdMember: z.boolean(),
});

const exportGiftEventSchemaV2 = z.object({
  name: z.string(),
  dateType: z.enum(["shared", "personal"]),
  dateMonth: z.number().int().nullable().optional(),
  dateDay: z.number().int().nullable().optional(),
  isLocked: z.boolean(),
  sortOrder: z.number().int(),
});

const exportGiftAllocationSchemaV2 = z.object({
  personName: z.string(),
  eventName: z.string(),
  year: z.number().int(),
  planned: z.number(),
  spent: z.number().nullable().optional(),
  status: z.enum(["planned", "bought", "skipped"]),
  notes: z.string().nullable().optional(),
  dateMonth: z.number().int().nullable().optional(),
  dateDay: z.number().int().nullable().optional(),
});

const exportGiftPlannerSettingsSchemaV2 = z.object({
  mode: z.enum(["synced", "independent"]),
  syncedDiscretionaryItemId: z.string().nullable(),
});

const exportGiftsSectionSchema = z.object({
  settings: exportGiftPlannerSettingsSchemaV2,
  people: z.array(exportGiftPersonSchemaV2),
  events: z.array(exportGiftEventSchemaV2),
  allocations: z.array(exportGiftAllocationSchemaV2),
});

const stalenessThresholdsSchema = z.object({
  income_source: z.number().int().nonnegative(),
  committed_item: z.number().int().nonnegative(),
  discretionary_item: z.number().int().nonnegative(),
  asset_item: z.number().int().nonnegative(),
  account_item: z.number().int().nonnegative(),
});

const exportSettingsSchema = z.object({
  surplusBenchmarkPct: z.number().optional(),
  isaAnnualLimit: z.number().optional(),
  isaYearStartMonth: z.number().int().optional(),
  isaYearStartDay: z.number().int().optional(),
  stalenessThresholds: stalenessThresholdsSchema.optional(),
  currentRatePct: z.number().nullable().optional(),
  savingsRatePct: z.number().nullable().optional(),
  investmentRatePct: z.number().nullable().optional(),
  pensionRatePct: z.number().nullable().optional(),
  inflationRatePct: z.number().optional(),
  showPence: z.boolean().optional(),
});

export const householdExportSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  household: z.object({ name: z.string() }),
  settings: exportSettingsSchema,
  members: z.array(exportMemberSchema),
  subcategories: z.array(exportSubcategorySchema),
  incomeSources: z.array(exportIncomeSourceSchema),
  committedItems: z.array(exportCommittedItemSchema),
  discretionaryItems: z.array(exportDiscretionaryItemSchema),
  itemAmountPeriods: z.array(exportItemAmountPeriodSchema),
  waterfallHistory: z.array(exportWaterfallHistorySchema),
  assets: z.array(exportAssetSchema),
  accounts: z.array(exportAccountSchema),
  purchaseItems: z.array(exportPurchaseItemSchema),
  plannerYearBudgets: z.array(exportPlannerYearBudgetSchema),
  gifts: exportGiftsSectionSchema,
});

export const importOptionsSchema = z.object({
  mode: z.enum(["overwrite", "create_new"]),
});

export const importResultSchema = z.object({
  success: z.boolean(),
  householdId: z.string(),
  backupId: z.string().optional(),
});

export const CURRENT_EXPORT_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

export type HouseholdExport = z.infer<typeof householdExportSchema>;
export type ImportOptions = z.infer<typeof importOptionsSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
