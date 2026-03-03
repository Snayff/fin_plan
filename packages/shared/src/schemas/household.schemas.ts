import { z } from 'zod';

export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
});

export const renameHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('A valid email address is required'),
});

export const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email address is required'),
  password: z.string().min(12, 'Password must be at least 12 characters long'),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type RenameHouseholdInput = z.infer<typeof renameHouseholdSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
