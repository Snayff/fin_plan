import { z } from "zod";

export const HouseholdRoleEnum = z.enum(["owner", "admin", "member"]);
export type HouseholdRole = z.infer<typeof HouseholdRoleEnum>;

export const ResourceSlugEnum = z.enum([
  "income-source",
  "committed-item",
  "discretionary-item",
  "wealth-account",
  "liability",
  "household-settings",
  "household-member",
  "household-invite",
  "planner-goal",
  "review-session",
  "setup-session",
  "surplus-config",
  "isa-config",
  "staleness-config",
]);
export type ResourceSlug = z.infer<typeof ResourceSlugEnum>;

export const AuditChangeSchema = z.object({
  field: z.string(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
});
export type AuditChange = z.infer<typeof AuditChangeSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  actorName: z.string().nullable(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().nullable(),
  changes: z.array(AuditChangeSchema).nullable(),
  createdAt: z.string().datetime(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditLogQuerySchema = z.object({
  actorId: z.string().optional(),
  resource: ResourceSlugEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

export const AuditLogResponseSchema = z.object({
  entries: z.array(AuditEntrySchema),
  nextCursor: z.string().nullable(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;
