import type { PrismaClient } from "@prisma/client";
import type { AuditLogQuery, AuditEntry, AuditLogResponse } from "@finplan/shared";

type QueryParams = AuditLogQuery & { householdId: string };

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString("base64");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    if (typeof parsed?.createdAt !== "string" || typeof parsed?.id !== "string") return null;
    return parsed as { createdAt: string; id: string };
  } catch {
    return null;
  }
}

export async function queryAuditLog(
  db: PrismaClient,
  params: QueryParams
): Promise<AuditLogResponse> {
  const { householdId, actorId, resource, dateFrom, dateTo, cursor, limit } = params;

  const where: Record<string, unknown> = { householdId };
  if (actorId) where.actorId = actorId;
  if (resource) where.resource = resource;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) throw Object.assign(new Error("Invalid cursor"), { statusCode: 400 });
    const { createdAt, id } = decoded;
    Object.assign(where, {
      OR: [
        { createdAt: { lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), id: { lt: id } },
      ],
    });
  }

  // Fetch limit+1 to detect if there's a next page
  const rows = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      actorName: true,
      action: true,
      resource: true,
      resourceId: true,
      changes: true,
      createdAt: true,
    },
  });

  const hasNext = rows.length > limit;
  const entries = rows.slice(0, limit);
  const lastEntry = entries[entries.length - 1];

  const nextCursor = hasNext && lastEntry ? encodeCursor(lastEntry.createdAt, lastEntry.id) : null;

  return {
    entries: entries.map((e) => ({
      id: e.id,
      actorName: e.actorName ?? null,
      action: e.action ?? "",
      resource: e.resource ?? "",
      resourceId: e.resourceId ?? null,
      changes: Array.isArray(e.changes) ? (e.changes as AuditEntry["changes"]) : null,
      createdAt: e.createdAt.toISOString(),
    })),
    nextCursor,
  };
}
