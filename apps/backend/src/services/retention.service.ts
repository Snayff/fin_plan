import type { PrismaClient } from "@prisma/client";

export const RETENTION_DAYS = 180;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 60 * 1000;

export async function purgeOldAuditLogs(db: PrismaClient): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * ONE_DAY_MS);
  const { count } = await db.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}

let started = false;
export function startRetentionJob(db: PrismaClient): void {
  if (started) return;
  started = true;
  setTimeout(() => {
    purgeOldAuditLogs(db).catch((err) => console.error("purgeOldAuditLogs boot run failed:", err));
  }, BOOT_DELAY_MS).unref();
  setInterval(() => {
    purgeOldAuditLogs(db).catch((err) => console.error("purgeOldAuditLogs interval failed:", err));
  }, CLEANUP_INTERVAL_MS).unref();
}
