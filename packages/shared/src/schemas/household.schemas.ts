import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().min(1, "Household name is required").trim(),
});

export const renameHouseholdSchema = z.object({
  name: z.string().min(1, "Household name is required").trim(),
});

export const createHouseholdInviteSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
  role: z.enum(["member", "admin"]).optional().default("member"),
});

export const acceptInviteSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("A valid email address is required"),
  password: z.string().min(12, "Password must be at least 12 characters long"),
});

// role: only member or admin can be assigned — owner is immutable
// targetUserId comes from the URL param, not the body
export const updateMemberRoleSchema = z.object({
  role: z.enum(["member", "admin"]),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type RenameHouseholdInput = z.infer<typeof renameHouseholdSchema>;
export type CreateHouseholdInviteInput = z.infer<typeof createHouseholdInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
