import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { purgeOldAuditLogs, RETENTION_DAYS } from "./retention.service";

beforeEach(() => resetPrismaMocks());

describe("purgeOldAuditLogs", () => {
  it("deletes rows older than RETENTION_DAYS and returns the count", async () => {
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 5 } as any);
    const deleted = await purgeOldAuditLogs(prismaMock as any);
    expect(deleted).toBe(5);
    expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
      })
    );
  });

  it("does not write an audit row for its own activity", async () => {
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 0 } as any);
    await purgeOldAuditLogs(prismaMock as any);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("RETENTION_DAYS is 180", () => {
    expect(RETENTION_DAYS).toBe(180);
  });
});
