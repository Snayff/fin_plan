import { z } from "zod";

export const AssetClassEnum = z.enum([
  "savings",
  "pensions",
  "investments",
  "property",
  "vehicles",
  "other",
]);
export type AssetClass = z.infer<typeof AssetClassEnum>;

export const createWealthAccountSchema = z.object({
  assetClass: AssetClassEnum,
  name: z.string().min(1),
  provider: z.string().optional(),
  notes: z.string().optional(),
  balance: z.number().default(0),
  interestRate: z.number().optional(),
  isISA: z.boolean().default(false),
  isaYearContribution: z.number().optional(),
  ownerId: z.string().optional(),
  isTrust: z.boolean().default(false),
  trustBeneficiaryName: z.string().optional(),
});

export const updateWealthAccountSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  interestRate: z.number().nullable().optional(),
  isISA: z.boolean().optional(),
  isaYearContribution: z.number().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  isTrust: z.boolean().optional(),
  trustBeneficiaryName: z.string().nullable().optional(),
});

export const updateValuationSchema = z.object({
  balance: z.number(),
  valuationDate: z.coerce.date().optional(),
});

export const confirmBatchWealthSchema = z.object({
  ids: z.array(z.string()),
});

export type CreateWealthAccountInput = z.infer<typeof createWealthAccountSchema>;
export type UpdateWealthAccountInput = z.infer<typeof updateWealthAccountSchema>;
export type UpdateValuationInput = z.infer<typeof updateValuationSchema>;
export type ConfirmBatchWealthInput = z.infer<typeof confirmBatchWealthSchema>;

export interface WealthSummary {
  netWorth: number;
  ytdChange: number;
  byLiquidity: {
    cashAndSavings: number;
    investmentsAndPensions: number;
    propertyAndVehicles: number;
  };
  byClass: Record<AssetClass, number>;
  trust: {
    total: number;
    beneficiaries: { name: string; total: number }[];
  };
}

export interface IsaAllowance {
  taxYearStart: string;
  taxYearEnd: string;
  annualLimit: number;
  byPerson: { ownerId: string; name: string; used: number; remaining: number }[];
}
