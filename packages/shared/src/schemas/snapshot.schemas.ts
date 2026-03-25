import { z } from "zod";

export const createSnapshotSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  isAuto: z.boolean().optional(),
});

export const renameSnapshotSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type RenameSnapshotInput = z.infer<typeof renameSnapshotSchema>;
