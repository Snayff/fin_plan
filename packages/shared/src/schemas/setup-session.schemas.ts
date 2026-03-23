import { z } from "zod";

export const updateSetupSessionSchema = z.object({
  currentStep: z.number().int().min(0),
});

export type UpdateSetupSessionInput = z.infer<typeof updateSetupSessionSchema>;
