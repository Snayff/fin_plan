import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { querySecurityActivity } from "./security-activity.service";

beforeEach(() => resetPrismaMocks());

const makeRow = (
  overrides: Partial<{
    id: string;
    action: string;
    createdAt: Date;
    metadata: unknown;
  }> = {}
) => ({
  id: "log-1",
  action: "LOGIN_SUCCESS",
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  metadata: null,
  ...overrides,
});

describe("querySecurityActivity", () => {
  it("returns only the requesting user's events (householdId null filter)", async () => {
    const rows = [makeRow()];
    prismaMock.auditLog.findMany.mockResolvedValue(rows as any);

    await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 50 });

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          householdId: null,
        }),
      })
    );
  });

  it("excludes TOKEN_REFRESH events", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([] as any);

    await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 50 });

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: { not: "TOKEN_REFRESH" },
        }),
      })
    );
  });

  it("never returns ipAddress or userAgent fields", async () => {
    const rows = [makeRow()];
    prismaMock.auditLog.findMany.mockResolvedValue(rows as any);

    const result = await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 50 });

    for (const entry of result.entries) {
      expect(entry).not.toHaveProperty("ipAddress");
      expect(entry).not.toHaveProperty("userAgent");
    }

    // Verify the select clause does not request those fields
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          ipAddress: expect.anything(),
          userAgent: expect.anything(),
        }),
      })
    );
  });

  it("returns entries with expected shape", async () => {
    const rows = [
      makeRow({
        id: "log-1",
        action: "LOGIN_SUCCESS",
        createdAt: new Date("2024-01-15T10:00:00.000Z"),
        metadata: { ip: "1.2.3.4" },
      }),
    ];
    prismaMock.auditLog.findMany.mockResolvedValue(rows as any);

    const result = await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 50 });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      id: "log-1",
      action: "LOGIN_SUCCESS",
      createdAt: "2024-01-15T10:00:00.000Z",
      metadata: { ip: "1.2.3.4" },
    });
    expect(result.nextCursor).toBeNull();
  });

  it("paginates with cursor — returns nextCursor when more rows exist", async () => {
    // Return limit+1 rows to trigger hasNext
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `log-${i + 1}`, createdAt: new Date(`2024-01-${15 - i}T10:00:00.000Z`) })
    );
    prismaMock.auditLog.findMany.mockResolvedValue(rows as any);

    const result = await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 2 });

    expect(result.entries).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    expect(typeof result.nextCursor).toBe("string");
  });

  it("nextCursor is null when no further pages exist", async () => {
    const rows = [makeRow()];
    prismaMock.auditLog.findMany.mockResolvedValue(rows as any);

    const result = await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 50 });

    expect(result.nextCursor).toBeNull();
  });

  it("passes cursor filter to query when cursor provided", async () => {
    // First call to get a valid cursor
    const firstRows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `log-${i + 1}`, createdAt: new Date(`2024-01-${15 - i}T10:00:00.000Z`) })
    );
    prismaMock.auditLog.findMany.mockResolvedValueOnce(firstRows as any);

    const firstPage = await querySecurityActivity(prismaMock as any, {
      userId: "user-1",
      limit: 2,
    });
    const cursor = firstPage.nextCursor!;

    // Second call with cursor
    prismaMock.auditLog.findMany.mockResolvedValueOnce([] as any);
    await querySecurityActivity(prismaMock as any, { userId: "user-1", limit: 2, cursor });

    const secondCall = (prismaMock.auditLog.findMany as any).mock.calls[1][0];
    expect(secondCall.where).toHaveProperty("OR");
  });

  it("throws 400 for invalid cursor", async () => {
    await expect(
      querySecurityActivity(prismaMock as any, {
        userId: "user-1",
        limit: 50,
        cursor: "not-valid-base64!!",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
