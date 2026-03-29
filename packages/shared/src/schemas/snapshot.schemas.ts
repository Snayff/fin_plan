import { z } from "zod";

export const createSnapshotSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  isAuto: z.boolean().optional(),
});

export const renameSnapshotSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export const SparklinePointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const FinancialSummarySchema = z.object({
  current: z.object({
    netWorth: z.number().nullable(),
    income: z.number(),
    committed: z.number(),
    discretionary: z.number(),
    surplus: z.number(),
  }),
  sparklines: z.object({
    netWorth: z.array(SparklinePointSchema),
    income: z.array(SparklinePointSchema),
    committed: z.array(SparklinePointSchema),
    discretionary: z.array(SparklinePointSchema),
    surplus: z.array(SparklinePointSchema),
  }),
});

export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type RenameSnapshotInput = z.infer<typeof renameSnapshotSchema>;
export type SparklinePoint = z.infer<typeof SparklinePointSchema>;
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;
