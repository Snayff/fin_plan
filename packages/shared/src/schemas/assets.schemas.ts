import { z } from "zod";

export const assetTypeSchema = z.enum(["Property", "Vehicle", "Other"]);
export const accountTypeSchema = z.enum([
  "Current",
  "Savings",
  "Pension",
  "StocksAndShares",
  "Other",
]);

// ─── Disposal helpers ────────────────────────────────────────────────────────
// `disposedAt` and `disposalAccountId` must be set together (or both cleared).
// undefined = field not in the patch (no change); null = explicit clear.
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const disposalPair = {
  disposedAt: isoDateString.nullable().optional(),
  disposalAccountId: z.string().min(1).nullable().optional(),
};

type DisposalShape = { disposedAt?: string | null; disposalAccountId?: string | null };

function disposalRefine(data: DisposalShape): boolean {
  const dateProvided = data.disposedAt !== undefined;
  const acctProvided = data.disposalAccountId !== undefined;
  if (!dateProvided && !acctProvided) return true;
  // When either field is in the patch, both must be present and match (both set or both null).
  if (dateProvided !== acctProvided) return false;
  const dateSet = data.disposedAt != null;
  const acctSet = data.disposalAccountId != null;
  return dateSet === acctSet;
}

const disposalRefineMessage: { message: string; path: (string | number)[] } = {
  message: "disposedAt and disposalAccountId must be set or cleared together",
  path: ["disposedAt"],
};

// Asset CRUD
export const createAssetSchema = z
  .object({
    name: z.string().min(1).max(100).trim(),
    type: assetTypeSchema,
    memberId: z.string().nullable().optional(),
    growthRatePct: z.number().min(-100).max(100).nullable().optional(),
    initialValue: z.number().positive().optional(),
    ...disposalPair,
  })
  .refine(disposalRefine, disposalRefineMessage);

export const updateAssetSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    memberId: z.string().nullable().optional(),
    growthRatePct: z.number().min(-100).max(100).nullable().optional(),
    ...disposalPair,
  })
  .refine(disposalRefine, disposalRefineMessage);

export const recordAssetBalanceSchema = z.object({
  value: z.number().positive(),
  date: isoDateString,
  note: z.string().max(500).nullable().optional(),
});

// Account CRUD
export const createAccountSchema = z
  .object({
    name: z.string().min(1).max(100).trim(),
    type: accountTypeSchema,
    memberId: z.string().nullable().optional(),
    growthRatePct: z.number().min(0).max(100).nullable().optional(),
    isCashflowLinked: z.boolean().optional(),
    initialValue: z.number().positive().optional(),
    ...disposalPair,
  })
  .refine(disposalRefine, disposalRefineMessage);

export const updateAccountSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    memberId: z.string().nullable().optional(),
    growthRatePct: z.number().min(0).max(100).nullable().optional(),
    isCashflowLinked: z.boolean().optional(),
    ...disposalPair,
  })
  .refine(disposalRefine, disposalRefineMessage);

export const recordAccountBalanceSchema = z.object({
  value: z.number().positive(),
  date: isoDateString,
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
