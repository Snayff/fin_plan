import { z } from "zod";

export const PurchasePriorityEnum = z.enum(["lowest", "low", "medium", "high"]);
export type PurchasePriority = z.infer<typeof PurchasePriorityEnum>;

export const PurchaseStatusEnum = z.enum(["not_started", "in_progress", "done"]);
export type PurchaseStatus = z.infer<typeof PurchaseStatusEnum>;

export const GiftEventTypeEnum = z.enum([
  "birthday",
  "christmas",
  "mothers_day",
  "fathers_day",
  "valentines_day",
  "anniversary",
  "custom",
]);
export type GiftEventType = z.infer<typeof GiftEventTypeEnum>;

export const GiftRecurrenceEnum = z.enum(["annual", "one_off"]);
export type GiftRecurrence = z.infer<typeof GiftRecurrenceEnum>;

// ─── Purchases ────────────────────────────────────────────────────────────────

export const createPurchaseSchema = z.object({
  name: z.string().min(1),
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
  name: z.string().min(1).optional(),
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

// ─── Gift persons ─────────────────────────────────────────────────────────────

export const createGiftPersonSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateGiftPersonSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateGiftPersonInput = z.infer<typeof createGiftPersonSchema>;
export type UpdateGiftPersonInput = z.infer<typeof updateGiftPersonSchema>;

// ─── Gift events ──────────────────────────────────────────────────────────────

export const createGiftEventSchema = z.object({
  eventType: GiftEventTypeEnum,
  customName: z.string().optional(),
  dateMonth: z.number().int().min(1).max(12).optional(),
  dateDay: z.number().int().min(1).max(31).optional(),
  specificDate: z.coerce.date().optional(),
  recurrence: GiftRecurrenceEnum.optional(),
});

export const updateGiftEventSchema = z.object({
  eventType: GiftEventTypeEnum.optional(),
  customName: z.string().nullable().optional(),
  dateMonth: z.number().int().min(1).max(12).nullable().optional(),
  dateDay: z.number().int().min(1).max(31).nullable().optional(),
  specificDate: z.coerce.date().nullable().optional(),
  recurrence: GiftRecurrenceEnum.optional(),
});

export const upsertGiftYearRecordSchema = z.object({
  budget: z.number().min(0),
  notes: z.string().nullable().optional(),
});

export type CreateGiftEventInput = z.infer<typeof createGiftEventSchema>;
export type UpdateGiftEventInput = z.infer<typeof updateGiftEventSchema>;
export type UpsertGiftYearRecordInput = z.infer<typeof upsertGiftYearRecordSchema>;
