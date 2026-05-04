import { describe, it, expect } from "bun:test";
import { getItemNamePlaceholder } from "./itemNamePlaceholder";

describe("getItemNamePlaceholder", () => {
  it("returns subcategory-specific copy for known keys", () => {
    expect(getItemNamePlaceholder("Salary", "income")).toBe("e.g. Salary, Bonus");
    expect(getItemNamePlaceholder("Housing", "committed")).toBe("e.g. Mortgage, Council Tax");
    expect(getItemNamePlaceholder("Food", "discretionary")).toBe("e.g. Weekly Shop, Work Lunches");
    expect(getItemNamePlaceholder("Savings", "discretionary")).toBe(
      "e.g. Emergency Fund, ISA Top-up"
    );
  });

  it("is case- and whitespace-insensitive", () => {
    expect(getItemNamePlaceholder("  salary  ", "income")).toBe("e.g. Salary, Bonus");
    expect(getItemNamePlaceholder("NETFLIX-ish", "committed")).toBe(
      getItemNamePlaceholder("committed-other", "committed")
    );
  });

  it("falls back to the tier-other entry for unknown subcategories", () => {
    expect(getItemNamePlaceholder("Unknown", "income")).toBe("e.g. Freelance, Rental Income");
    expect(getItemNamePlaceholder("Unknown", "committed")).toBe("e.g. Insurance, Childcare");
    expect(getItemNamePlaceholder("Unknown", "discretionary")).toBe("e.g. Hobbies, Gadgets");
  });

  it("every placeholder follows the 'e.g. X, Y' tone rule", () => {
    const cases: Array<[string, "income" | "committed" | "discretionary"]> = [
      ["Salary", "income"],
      ["Dividends", "income"],
      ["Other", "income"],
      ["Housing", "committed"],
      ["Utilities", "committed"],
      ["Services", "committed"],
      ["Other", "committed"],
      ["Food", "discretionary"],
      ["Fun", "discretionary"],
      ["Clothes", "discretionary"],
      ["Savings", "discretionary"],
      ["Other", "discretionary"],
    ];
    for (const [name, tier] of cases) {
      const result = getItemNamePlaceholder(name, tier);
      expect(result.startsWith("e.g. ")).toBe(true);
      expect(result.split(", ").length).toBe(2);
    }
  });
});
