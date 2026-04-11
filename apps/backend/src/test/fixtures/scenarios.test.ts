import { describe, it, expect } from "bun:test";
import { dualIncomeHousehold, complexHousehold } from "./scenarios";

describe("fixtures use dueDate", () => {
  it("dualIncomeHousehold income sources have dueDate not expectedMonth", () => {
    for (const income of dualIncomeHousehold.incomeSources) {
      expect(income).toHaveProperty("dueDate");
      expect(income).not.toHaveProperty("expectedMonth");
    }
  });

  it("dualIncomeHousehold committed items have dueDate not dueMonth", () => {
    for (const item of dualIncomeHousehold.committedItems) {
      expect(item).toHaveProperty("dueDate");
      expect(item).not.toHaveProperty("dueMonth");
    }
  });

  it("complexHousehold income sources have dueDate not expectedMonth", () => {
    for (const income of complexHousehold.incomeSources) {
      expect(income).toHaveProperty("dueDate");
      expect(income).not.toHaveProperty("expectedMonth");
    }
  });

  it("complexHousehold committed items have dueDate not dueMonth", () => {
    for (const item of complexHousehold.committedItems) {
      expect(item).toHaveProperty("dueDate");
      expect(item).not.toHaveProperty("dueMonth");
    }
  });
});
