import { z } from "zod";

export const createSnapshotSchema = z.object({
  name: z.string().min(1),
  isAuto: z.boolean().optional(),
});

export const renameSnapshotSchema = z.object({
  name: z.string().min(1),
});

export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type RenameSnapshotInput = z.infer<typeof renameSnapshotSchema>;
