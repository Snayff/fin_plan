import { z } from "zod";

export const confirmedItemsSchema = z.record(z.array(z.string()));

export const updatedItemsSchema = z.record(z.object({ from: z.number(), to: z.number() }));

export const updateReviewSessionSchema = z.object({
  currentStep: z.number().int().min(0).optional(),
  confirmedItems: confirmedItemsSchema.optional(),
  updatedItems: updatedItemsSchema.optional(),
});

export type UpdateReviewSessionInput = z.infer<typeof updateReviewSessionSchema>;
