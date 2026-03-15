import { z } from 'zod';

export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
});

const optionalInviteEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().trim().email('A valid email address is required').optional()
);

export const renameHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
});

export const createHouseholdInviteSchema = z.object({
  email: optionalInviteEmailSchema,
});

export const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email address is required'),
  password: z.string().min(12, 'Password must be at least 12 characters long'),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type RenameHouseholdInput = z.infer<typeof renameHouseholdSchema>;
export type CreateHouseholdInviteInput = z.infer<typeof createHouseholdInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
