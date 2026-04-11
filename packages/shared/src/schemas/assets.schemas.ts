import { z } from "zod";

export const assetTypeSchema = z.enum(["Property", "Vehicle", "Other"]);
export const accountTypeSchema = z.enum([
  "Current",
  "Savings",
  "Pension",
  "StocksAndShares",
  "Other",
]);

// Asset CRUD
export const createAssetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: assetTypeSchema,
  memberId: z.string().nullable().optional(),
  growthRatePct: z.number().min(-100).max(100).nullable().optional(),
  initialValue: z.number().positive().optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  memberId: z.string().nullable().optional(),
  growthRatePct: z.number().min(-100).max(100).nullable().optional(),
});

export const recordAssetBalanceSchema = z.object({
  value: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  note: z.string().max(500).nullable().optional(),
});

// Account CRUD
export const createAccountSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: accountTypeSchema,
  memberId: z.string().nullable().optional(),
  growthRatePct: z.number().min(0).max(100).nullable().optional(),
  isCashflowLinked: z.boolean().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  memberId: z.string().nullable().optional(),
  growthRatePct: z.number().min(0).max(100).nullable().optional(),
  isCashflowLinked: z.boolean().optional(),
});

export const recordAccountBalanceSchema = z.object({
  value: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  note: z.string().max(500).nullable().optional(),
});

// Member profile (retirement fields)
export const updateMemberProfileSchema = z.object({
  dateOfBirth: z.string().datetime().nullable().optional(),
  retirementYear: z.number().int().min(2000).max(2100).nullable().optional(),
});

export type AssetType = z.infer<typeof assetTypeSchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type RecordAssetBalanceInput = z.infer<typeof recordAssetBalanceSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type RecordAccountBalanceInput = z.infer<typeof recordAccountBalanceSchema>;
export type UpdateMemberProfileInput = z.infer<typeof updateMemberProfileSchema>;
