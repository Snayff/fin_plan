import { prisma } from '../config/database';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Fire-and-forget audit logging.
 * Writes are non-blocking — failures are logged but never throw to callers.
 */
export const auditService = {
  log(entry: AuditLogEntry): void {
    prisma.auditLog
      .create({ data: entry })
      .catch((err) => {
        console.error('Audit log write failed:', err);
      });
  },
};
