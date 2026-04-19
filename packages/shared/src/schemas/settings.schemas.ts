import { z } from "zod";

export const stalenessThresholdsSchema = z.object({
  income_source: z.number().int().min(1).optional(),
  committed_item: z.number().int().min(1).optional(),
  discretionary_item: z.number().int().min(1).optional(),
  asset_item: z.number().int().positive().optional(),
  account_item: z.number().int().positive().optional(),
});

export const updateSettingsSchema = z.object({
  surplusBenchmarkPct: z.number().min(0).max(100).optional(),
  isaAnnualLimit: z.number().min(0).optional(),
  isaYearStartMonth: z.number().int().min(1).max(12).optional(),
  isaYearStartDay: z.number().int().min(1).max(31).optional(),
  stalenessThresholds: stalenessThresholdsSchema.optional(),
  currentRatePct: z.number().min(0).max(100).optional(),
  savingsRatePct: z.number().min(0).max(100).optional(),
  investmentRatePct: z.number().min(0).max(100).optional(),
  pensionRatePct: z.number().min(0).max(100).optional(),
  inflationRatePct: z.number().min(0).max(100).optional(),
  showPence: z.boolean().optional(),
  waterfallTipDismissed: z.boolean().optional(),
});

export type StalenessThresholds = z.infer<typeof stalenessThresholdsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
