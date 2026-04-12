import { z } from "zod";

export const PurchasePriorityEnum = z.enum(["lowest", "low", "medium", "high"]);
export type PurchasePriority = z.infer<typeof PurchasePriorityEnum>;

export const PurchaseStatusEnum = z.enum(["not_started", "in_progress", "done"]);
export type PurchaseStatus = z.infer<typeof PurchaseStatusEnum>;

// ─── Purchases ────────────────────────────────────────────────────────────────

export const createPurchaseSchema = z.object({
  name: z.string().min(1).trim(),
  estimatedCost: z.number().positive(),
  priority: PurchasePriorityEnum.optional(),
  scheduledThisYear: z.boolean().optional(),
  fundingSources: z.array(z.string()).optional(),
  fundingAccountId: z.string().optional(),
  status: PurchaseStatusEnum.optional(),
  reason: z.string().optional(),
  comment: z.string().optional(),
});

export const updatePurchaseSchema = z.object({
  name: z.string().min(1).trim().optional(),
  estimatedCost: z.number().positive().optional(),
  priority: PurchasePriorityEnum.optional(),
  scheduledThisYear: z.boolean().optional(),
  fundingSources: z.array(z.string()).optional(),
  fundingAccountId: z.string().nullable().optional(),
  status: PurchaseStatusEnum.optional(),
  reason: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

export const upsertYearBudgetSchema = z.object({
  purchaseBudget: z.number().min(0).optional(),
  giftBudget: z.number().min(0).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type UpsertYearBudgetInput = z.infer<typeof upsertYearBudgetSchema>;
