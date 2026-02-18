import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

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
    prisma.auditLog
      .create({ data: entry })
      .catch((err) => {
        console.error('Audit log write failed:', err);
      });
  },
};
