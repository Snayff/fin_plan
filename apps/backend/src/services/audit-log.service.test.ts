import { describe, it, expect, beforeEach } from "bun:test";
import { prismaMock } from "../test/mocks/prisma";
import { queryAuditLog } from "./audit-log.service";

const mockEntry = {
  id: "al_1",
  actorName: "Alice",
  action: "CREATE_INCOME_SOURCE",
  resource: "income-source",
  resourceId: "inc_1",
  changes: [{ field: "amount", after: 100 }],
  createdAt: new Date("2026-03-01T10:00:00Z"),
};

describe("queryAuditLog", () => {
  beforeEach(() => {
    prismaMock.auditLog.findMany.mockResolvedValue([mockEntry] as any);
  });

  it("returns entries and null nextCursor when under limit", async () => {
    const result = await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      limit: 50,
    });
    expect(result.entries).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it("returns nextCursor when limit+1 entries exist", async () => {
    const entries = Array.from({ length: 51 }, (_, i) => ({
      ...mockEntry,
      id: `al_${i}`,
      createdAt: new Date(`2026-03-0${Math.floor(i / 10) + 1}T10:00:00Z`),
    }));
    prismaMock.auditLog.findMany.mockResolvedValue(entries as any);

    const result = await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      limit: 50,
    });
    expect(result.entries).toHaveLength(50);
    expect(result.nextCursor).not.toBeNull();
  });

  it("filters by actorId", async () => {
    await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      actorId: "user_1",
      limit: 50,
    });
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ actorId: "user_1" }),
      })
    );
  });

  it("scopes to householdId always", async () => {
    await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      limit: 50,
    });
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ householdId: "hh_1" }),
      })
    );
  });

  it("resolves FK UUIDs (linkedAccountId) to account names", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        ...mockEntry,
        changes: [
          { field: "name", after: "Tandem" },
          { field: "linkedAccountId", after: "acc_123" },
        ],
      },
    ] as any);
    prismaMock.account.findMany.mockResolvedValue([
      { id: "acc_123", name: "Tandem Savings" },
    ] as any);

    const result = await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      limit: 50,
    });

    expect(prismaMock.account.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["acc_123"] }, householdId: "hh_1" },
      select: { id: true, name: true },
    });
    expect(result.entries[0]!.changes).toEqual([
      { field: "name", after: "Tandem" },
      { field: "linkedAccountId", after: "Tandem Savings" },
    ]);
  });

  it("falls back to (deleted) when a referenced FK is missing", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        ...mockEntry,
        changes: [{ field: "linkedAccountId", before: "acc_old", after: "acc_new" }],
      },
    ] as any);
    prismaMock.account.findMany.mockResolvedValue([{ id: "acc_new", name: "New Account" }] as any);

    const result = await queryAuditLog(prismaMock as any, {
      householdId: "hh_1",
      limit: 50,
    });

    expect(result.entries[0]!.changes).toEqual([
      { field: "linkedAccountId", before: "(deleted)", after: "New Account" },
    ]);
  });
});
