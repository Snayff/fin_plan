import { describe, it, expect } from "bun:test";
import { waterfallService } from "@/services/waterfall.service";

describe("waterfallService.createSubcategory", () => {
  it("exists as a function", () => {
    expect(typeof (waterfallService as any).createSubcategory).toBe("function");
  });
});
