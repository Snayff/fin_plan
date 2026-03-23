import { z } from "zod";

export const updateReviewSessionSchema = z.object({
  currentStep: z.number().int().min(0).optional(),
  confirmedItems: z.record(z.array(z.string())).optional(),
  updatedItems: z.record(z.object({ from: z.number(), to: z.number() })).optional(),
});

export type UpdateReviewSessionInput = z.infer<typeof updateReviewSessionSchema>;
