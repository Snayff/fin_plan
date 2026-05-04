import { describe, it, expect, beforeEach, mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma.js";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { searchService } = await import("./search.service.js");

beforeEach(() => {
  resetPrismaMocks();
  // Default all 8 findMany calls to return an empty array
  prismaMock.incomeSource.findMany.mockResolvedValue([]);
  prismaMock.committedItem.findMany.mockResolvedValue([]);
  prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
  prismaMock.asset.findMany.mockResolvedValue([]);
  prismaMock.account.findMany.mockResolvedValue([]);
  prismaMock.giftPerson.findMany.mockResolvedValue([]);
  prismaMock.giftEvent.findMany.mockResolvedValue([]);
  prismaMock.purchaseItem.findMany.mockResolvedValue([]);
});

describe("searchService.search", () => {
  it("passes householdId and case-insensitive contains filter to Prisma", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      { id: "i1", name: "Mortgage Offset Salary" },
    ] as any);

    const res = await searchService.search("hh-1", "mortgage");

    expect(prismaMock.incomeSource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          householdId: "hh-1",
          name: { contains: "mortgage", mode: "insensitive" },
        },
      })
    );
    expect(res.results).toHaveLength(1);
    expect(res.results[0]!.kind).toBe("income_source");
    expect(res.results[0]!.name).toBe("Mortgage Offset Salary");
  });

  it("ranks exact name > starts-with > contains within a kind", async () => {
    prismaMock.committedItem.findMany.mockResolvedValue([
      { id: "c1", name: "Monthly Food Budget" },
      { id: "c2", name: "Food" },
      { id: "c3", name: "Food Delivery Subscription" },
    ] as any);

    const res = await searchService.search("hh-1", "food");

    const names = res.results.filter((r) => r.kind === "committed_item").map((r) => r.name);
    expect(names[0]).toBe("Food");
    expect(names[1]).toBe("Food Delivery Subscription");
    expect(names[2]).toBe("Monthly Food Budget");
  });

  it("caps results per entity kind at 5", async () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      id: `i${i}`,
      name: `Source ${i}`,
    }));
    prismaMock.incomeSource.findMany.mockResolvedValue(seven as any);

    const res = await searchService.search("hh-1", "source");
    const income = res.results.filter((r) => r.kind === "income_source");
    expect(income).toHaveLength(5);
  });

  it("returns an empty array when nothing matches", async () => {
    const res = await searchService.search("hh-1", "zzz-no-match");
    expect(res.results).toEqual([]);
  });

  it("returns an empty array for a whitespace-only query without hitting Prisma", async () => {
    const res = await searchService.search("hh-1", "   ");
    expect(res.results).toEqual([]);
    expect(prismaMock.incomeSource.findMany).not.toHaveBeenCalled();
  });

  it("produces the design-system subtitle and route for each kind", async () => {
    prismaMock.asset.findMany.mockResolvedValue([{ id: "a1", name: "Flat" }] as any);
    const res = await searchService.search("hh-1", "flat");
    const asset = res.results.find((r) => r.kind === "asset");
    expect(asset?.subtitle).toBe("Wealth · Asset");
    expect(asset?.route).toBe("/assets");
    expect(asset?.focusId).toBe("a1");
  });
});
