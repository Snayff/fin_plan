import { prisma } from "../config/database";
import type { Prisma, PrismaClient } from "@prisma/client";

// Universal: every model carries these, never user-meaningful
const SYSTEM_FIELDS = new Set([
  "id",
  "householdId",
  "createdAt",
  "updatedAt",
  "sortOrder",
  "lastReviewedAt",
  "subcategoryId",
  "yearAdded",
  "tokenHash",
  "passwordHash",
  "twoFactorSecret",
  "twoFactorBackupCodes",
  "refreshToken",
  "token",
  "password",
  "email",
]);

// Per-resource: fields that exist on the row but the user does not directly drive
const RESOURCE_FIELD_DENYLIST: Record<string, Set<string>> = {
  "committed-item": new Set(["isPlannerOwned"]),
  "discretionary-item": new Set(["isPlannerOwned"]),
  "planner-goal": new Set(["scheduledThisYear"]),
};

export function isHiddenField(field: string, resource?: string): boolean {
  if (SYSTEM_FIELDS.has(field)) return true;
  if (resource && RESOURCE_FIELD_DENYLIST[resource]?.has(field)) return true;
  return false;
}

export function filterChanges<T extends { field: string }>(changes: T[], resource?: string): T[] {
  return changes.filter((c) => !isHiddenField(c.field, resource));
}

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Fire-and-forget audit logging.
 * Writes are non-blocking — failures are logged but never throw to callers.
 */
export const auditService = {
  log(entry: AuditLogEntry): void {
    prisma.auditLog.create({ data: entry }).catch((err) => {
      console.error("Audit log write failed:", err);
    });
  },
};

// ── transactional wrapper ─────────────────────────────────────────────────────

export type ActorCtx = {
  householdId: string;
  actorId: string;
  actorName: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditChange = {
  field: string;
  before?: unknown;
  after?: unknown;
};

export function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  resource?: string
): AuditChange[] {
  if (!before && !after) return [];

  if (!before) {
    // CREATE — all after fields
    return Object.entries(after!)
      .filter(([field]) => !isHiddenField(field, resource))
      .map(([field, value]) => ({
        field,
        after: value,
      }));
  }

  if (!after) {
    // DELETE — all before fields
    return Object.entries(before)
      .filter(([field]) => !isHiddenField(field, resource))
      .map(([field, value]) => ({
        field,
        before: value,
      }));
  }

  // UPDATE — changed fields only
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: AuditChange[] = [];

  for (const field of allKeys) {
    if (isHiddenField(field, resource)) continue;
    const b = before[field];
    const a = after[field];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes.push({ field, before: b, after: a });
    }
  }

  return changes;
}

export type AuditedParams<T> = {
  db: PrismaClient;
  ctx: ActorCtx;
  action: string;
  resource: string;
  resourceId: string;
  beforeFetch: (tx: PrismaClient) => Promise<Record<string, unknown> | null>;
  mutation: (tx: PrismaClient) => Promise<T>;
};

export async function audited<T>({
  db,
  ctx,
  action,
  resource,
  resourceId,
  beforeFetch,
  mutation,
}: AuditedParams<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    const beforeState = await beforeFetch(tx as unknown as PrismaClient);
    const result = await mutation(tx as unknown as PrismaClient);

    const afterState =
      result !== null && typeof result === "object" && !Array.isArray(result)
        ? (result as Record<string, unknown>)
        : null;

    const changes = computeDiff(beforeState, afterState, resource);

    await (tx as any).auditLog.create({
      data: {
        householdId: ctx.householdId,
        actorId: ctx.actorId,
        actorName: ctx.actorName,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        action,
        resource,
        resourceId,
        changes,
      },
    });

    return result;
  });
}
