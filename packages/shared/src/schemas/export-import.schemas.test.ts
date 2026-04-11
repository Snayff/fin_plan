import { describe, it, expect } from "bun:test";
import { householdExportSchema } from "./export-import.schemas";

describe("householdExportSchema", () => {
  it("accepts a minimal valid export", () => {
    const result = householdExportSchema.safeParse({
      schemaVersion: 1,
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
      giftPersons: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects schemaVersion > 1", () => {
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
      giftPersons: [],
    });
    expect(result.success).toBe(false);
  });
});
