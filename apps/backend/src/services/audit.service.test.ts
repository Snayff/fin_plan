import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { auditService, computeDiff, audited } from "./audit.service";

beforeEach(() => {
  resetPrismaMocks();
});

describe("auditService.log", () => {
  it("calls prisma.auditLog.create with the provided entry", async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    auditService.log({ userId: "user-1", action: "LOGIN" });

    // fire-and-forget: we flush the microtask queue before asserting
    await Promise.resolve();

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: { userId: "user-1", action: "LOGIN" },
    });
  });

  it("does not throw when prisma.auditLog.create rejects", () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error("DB write failed"));

    // Should not throw — fire-and-forget
    expect(() => auditService.log({ action: "SIGNUP" })).not.toThrow();
  });

  it("passes optional fields (resource, resourceId, metadata) to prisma", async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    auditService.log({
      userId: "user-2",
      action: "DELETE",
      resource: "transaction",
      resourceId: "tx-1",
      metadata: { reason: "user request" },
    });

    await Promise.resolve();

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        resource: "transaction",
        resourceId: "tx-1",
        metadata: { reason: "user request" },
      }),
    });
  });
});

const ctx = {
  householdId: "hh_1",
  actorId: "user_1",
  actorName: "Alice",
  ipAddress: "127.0.0.1",
  userAgent: "test",
};

describe("computeDiff", () => {
  it("detects updated fields", () => {
    const diff = computeDiff({ amount: 100, name: "Salary" }, { amount: 200, name: "Salary" });
    expect(diff).toEqual([{ field: "amount", before: 100, after: 200 }]);
  });

  it("detects created fields (no before state)", () => {
    const diff = computeDiff(null, { amount: 100, name: "Salary" });
    expect(diff).toEqual([
      { field: "amount", after: 100 },
      { field: "name", after: "Salary" },
    ]);
  });

  it("detects deleted fields (no after state)", () => {
    const diff = computeDiff({ amount: 100 }, null);
    expect(diff).toEqual([{ field: "amount", before: 100 }]);
  });

  it("ignores unchanged fields", () => {
    const diff = computeDiff({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(diff).toEqual([{ field: "b", before: 2, after: 3 }]);
  });
});

describe("audited()", () => {
  beforeEach(() => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("returns the mutation result", async () => {
    const result = await audited({
      db: prismaMock as any,
      ctx,
      action: "CREATE_INCOME_SOURCE",
      resource: "income-source",
      resourceId: "inc_1",
      beforeFetch: async () => null,
      mutation: async () => ({ id: "inc_1", amount: 100 }),
    });
    expect(result).toEqual({ id: "inc_1", amount: 100 });
  });

  it("writes an AuditLog entry with correct fields", async () => {
    await audited({
      db: prismaMock as any,
      ctx,
      action: "CREATE_INCOME_SOURCE",
      resource: "income-source",
      resourceId: "inc_1",
      beforeFetch: async () => null,
      mutation: async (_tx) => ({ id: "inc_1", amount: 100, name: "Salary" }),
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "hh_1",
        actorId: "user_1",
        actorName: "Alice",
        action: "CREATE_INCOME_SOURCE",
        resource: "income-source",
        resourceId: "inc_1",
      }),
    });
  });

  it("rolls back if audit write fails", async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error("DB error"));

    await expect(
      audited({
        db: prismaMock as any,
        ctx,
        action: "UPDATE_INCOME_SOURCE",
        resource: "income-source",
        resourceId: "inc_1",
        beforeFetch: async () => ({ amount: 100 }),
        mutation: async () => ({ id: "inc_1", amount: 200 }),
      })
    ).rejects.toThrow("DB error");
  });
});
