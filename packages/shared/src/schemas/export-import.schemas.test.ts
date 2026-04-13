import { describe, it, expect } from "bun:test";
import { householdExportSchema } from "./export-import.schemas";

describe("householdExportSchema", () => {
  it("accepts a minimal valid export", () => {
    const result = householdExportSchema.safeParse({
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      household: { name: "Test Household" },
      settings: {},
      members: [],
      subcategories: [],
      incomeSources: [],
      committedItems: [],
      discretionaryItems: [],
      itemAmountPeriods: [],
      waterfallHistory: [],
      assets: [],
      accounts: [],
      purchaseItems: [],
      plannerYearBudgets: [],
      gifts: {
        settings: { mode: "synced", syncedDiscretionaryItemId: null },
        people: [],
        events: [],
        allocations: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects schemaVersion > 2", () => {
    const result = householdExportSchema.safeParse({
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      household: { name: "Test" },
      settings: {},
      members: [],
      subcategories: [],
      incomeSources: [],
      committedItems: [],
      discretionaryItems: [],
      itemAmountPeriods: [],
      waterfallHistory: [],
      assets: [],
      accounts: [],
      purchaseItems: [],
      plannerYearBudgets: [],
      gifts: {
        settings: { mode: "synced", syncedDiscretionaryItemId: null },
        people: [],
        events: [],
        allocations: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a gift section with populated data", () => {
    const result = householdExportSchema.safeParse({
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      household: { name: "Test" },
      settings: {},
      members: [],
      subcategories: [],
      incomeSources: [],
      committedItems: [],
      discretionaryItems: [],
      itemAmountPeriods: [],
      waterfallHistory: [],
      assets: [],
      accounts: [],
      purchaseItems: [],
      plannerYearBudgets: [],
      gifts: {
        settings: { mode: "independent", syncedDiscretionaryItemId: null },
        people: [{ name: "Mum", notes: "Likes flowers", sortOrder: 0, isHouseholdMember: false }],
        events: [
          {
            name: "Birthday",
            dateType: "personal",
            dateMonth: 8,
            dateDay: 20,
            isLocked: false,
            sortOrder: 0,
          },
        ],
        allocations: [
          {
            personName: "Mum",
            eventName: "Birthday",
            year: 2026,
            planned: 50,
            spent: null,
            status: "planned",
            notes: null,
            dateMonth: 8,
            dateDay: 20,
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});
