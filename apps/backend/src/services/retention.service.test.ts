import { describe, it, expect, beforeEach, mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { purgeOldAuditLogs, RETENTION_DAYS, startRetentionJob } from "./retention.service";

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

  it("computes the cutoff as roughly RETENTION_DAYS in the past", async () => {
    prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 0 } as any);
    const before = Date.now();
    await purgeOldAuditLogs(prismaMock as any);

    const arg = (prismaMock.auditLog.deleteMany as any).mock.calls[0][0];
    const cutoff: Date = arg.where.createdAt.lt;
    const expectedMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    // cutoff should be ~180 days before "now" (allow a generous 5s window)
    expect(before - cutoff.getTime()).toBeGreaterThan(expectedMs - 5000);
    expect(before - cutoff.getTime()).toBeLessThan(expectedMs + 5000);
  });
});

describe("startRetentionJob", () => {
  it("registers a boot timeout and a recurring interval on first call", () => {
    const setTimeoutSpy = mock(() => ({ unref: () => {} }) as any);
    const setIntervalSpy = mock(() => ({ unref: () => {} }) as any);
    const origTimeout = globalThis.setTimeout;
    const origInterval = globalThis.setInterval;
    globalThis.setTimeout = setTimeoutSpy as any;
    globalThis.setInterval = setIntervalSpy as any;

    try {
      startRetentionJob(prismaMock as any);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      // Idempotent: a second call must not register more timers.
      startRetentionJob(prismaMock as any);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.setTimeout = origTimeout;
      globalThis.setInterval = origInterval;
    }
  });
});
