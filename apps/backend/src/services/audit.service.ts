import { prisma } from "../config/database";
import type { Prisma, PrismaClient } from "@prisma/client";

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
  after: Record<string, unknown> | null
): AuditChange[] {
  if (!before && !after) return [];

  if (!before) {
    // CREATE — all after fields
    return Object.entries(after!).map(([field, value]) => ({
      field,
      after: value,
    }));
  }

  if (!after) {
    // DELETE — all before fields
    return Object.entries(before).map(([field, value]) => ({
      field,
      before: value,
    }));
  }

  // UPDATE — changed fields only
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: AuditChange[] = [];

  for (const field of allKeys) {
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

    const changes = computeDiff(beforeState, afterState);

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
