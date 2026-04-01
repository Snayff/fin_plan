import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

// Mock waterfallService so snapshot creation doesn't need DB for summary
mock.module("./waterfall.service.js", () => ({
  waterfallService: {
    getWaterfallSummary: async () => ({ incomeTotalMonthly: 0 }),
  },
}));

const { snapshotService } = await import("./snapshot.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("snapshotService.listSnapshots", () => {
  it("returns snapshots without full data field", async () => {
    prismaMock.snapshot.findMany.mockResolvedValue([
      { id: "s-1", name: "Test", isAuto: false, createdAt: new Date() },
    ] as any);

    const result = await snapshotService.listSnapshots("hh-1");

    expect(prismaMock.snapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, name: true, isAuto: true, createdAt: true },
      })
    );
    expect(result).toHaveLength(1);
  });
});

describe("snapshotService.getSnapshot", () => {
  it("throws NotFoundError when not found", async () => {
    prismaMock.snapshot.findUnique.mockResolvedValue(null);

    await expect(snapshotService.getSnapshot("hh-1", "s-1")).rejects.toThrow("Snapshot not found");
  });

  it("throws NotFoundError when owned by different household", async () => {
    prismaMock.snapshot.findUnique.mockResolvedValue({
      id: "s-1",
      householdId: "hh-other",
    } as any);

    await expect(snapshotService.getSnapshot("hh-1", "s-1")).rejects.toThrow("Snapshot not found");
  });
});

describe("snapshotService.createSnapshot", () => {
  it("populates data from waterfallService and creates snapshot", async () => {
    prismaMock.snapshot.create.mockResolvedValue({ id: "s-1", name: "My Snapshot" } as any);

    await snapshotService.createSnapshot("hh-1", { name: "My Snapshot" });

    expect(prismaMock.snapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "hh-1",
        name: "My Snapshot",
        isAuto: false,
        data: expect.objectContaining({ incomeTotalMonthly: 0 }),
      }),
    });
  });

  it("throws ConflictError on duplicate name (P2002)", async () => {
    prismaMock.snapshot.create.mockRejectedValue({ code: "P2002" });

    await expect(snapshotService.createSnapshot("hh-1", { name: "Duplicate" })).rejects.toThrow(
      "A snapshot with that name already exists"
    );
  });
});

describe("snapshotService.renameSnapshot", () => {
  it("throws ConflictError on duplicate name (P2002)", async () => {
    prismaMock.snapshot.findUnique.mockResolvedValue({
      id: "s-1",
      householdId: "hh-1",
    } as any);
    prismaMock.snapshot.update.mockRejectedValue({ code: "P2002" });

    await expect(
      snapshotService.renameSnapshot("hh-1", "s-1", { name: "Duplicate" })
    ).rejects.toThrow("A snapshot with that name already exists");
  });
});

describe("snapshotService.deleteSnapshot", () => {
  it("deletes when ownership verified", async () => {
    prismaMock.snapshot.findUnique.mockResolvedValue({
      id: "s-1",
      householdId: "hh-1",
    } as any);
    prismaMock.snapshot.delete.mockResolvedValue({} as any);

    await snapshotService.deleteSnapshot("hh-1", "s-1");

    expect(prismaMock.snapshot.delete).toHaveBeenCalledWith({ where: { id: "s-1" } });
  });
});

describe("snapshotService.ensureBaselineSnapshot", () => {
  it("creates auto:init snapshot when no auto-snapshots exist", async () => {
    prismaMock.snapshot.count.mockResolvedValue(0);
    prismaMock.snapshot.upsert.mockResolvedValue({ id: "snap-init", name: "auto:init" } as any);

    await snapshotService.ensureBaselineSnapshot("hh-1");

    expect(prismaMock.snapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId_name: { householdId: "hh-1", name: "auto:init" } },
        create: expect.objectContaining({ householdId: "hh-1", name: "auto:init", isAuto: true }),
      })
    );
  });

  it("does nothing when auto-snapshots already exist", async () => {
    prismaMock.snapshot.count.mockResolvedValue(2);

    await snapshotService.ensureBaselineSnapshot("hh-1");

    expect(prismaMock.snapshot.upsert).not.toHaveBeenCalled();
  });

  it("is idempotent — second call with existing row is a no-op upsert", async () => {
    prismaMock.snapshot.count.mockResolvedValue(0);
    prismaMock.snapshot.upsert.mockResolvedValue({ id: "snap-init", name: "auto:init" } as any);

    await snapshotService.ensureBaselineSnapshot("hh-1");
    await snapshotService.ensureBaselineSnapshot("hh-1");

    // upsert called twice but update: {} means second call changes nothing
    expect(prismaMock.snapshot.upsert).toHaveBeenCalledTimes(2);
    const call = prismaMock.snapshot.upsert.mock.calls[0][0];
    expect(call.update).toEqual({});
  });
});

describe("snapshotService.ensureJan1Snapshot", () => {
  it("creates auto snapshot when now is Jan 1", async () => {
    const jan1 = new Date("2026-01-01T10:00:00Z");

    prismaMock.snapshot.findUnique.mockResolvedValue(null);
    prismaMock.snapshot.create.mockResolvedValue({
      id: "snap-1",
      name: "January 2026 — Auto",
    } as any);
    // Mock for createSnapshot's internal getWaterfallSummary call
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.householdSettings.findUnique.mockResolvedValue(null);

    await snapshotService.ensureJan1Snapshot("hh-1", jan1);

    expect(prismaMock.snapshot.findUnique).toHaveBeenCalledWith({
      where: { householdId_name: { householdId: "hh-1", name: "January 2026 — Auto" } },
    });
  });

  it("does nothing when now is not Jan 1", async () => {
    const feb15 = new Date("2026-02-15T10:00:00Z");

    await snapshotService.ensureJan1Snapshot("hh-1", feb15);

    expect(prismaMock.snapshot.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when auto snapshot already exists", async () => {
    const jan1 = new Date("2026-01-01T10:00:00Z");

    prismaMock.snapshot.findUnique.mockResolvedValue({ id: "snap-existing" } as any);

    await snapshotService.ensureJan1Snapshot("hh-1", jan1);

    expect(prismaMock.snapshot.create).not.toHaveBeenCalled();
  });
});
