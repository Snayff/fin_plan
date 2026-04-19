import { describe, it, expect } from "bun:test";
import { settingsService } from "@/services/settings.service";

describe("settingsService.dismissWaterfallTip", () => {
  it("exists as a function", () => {
    expect(typeof (settingsService as any).dismissWaterfallTip).toBe("function");
  });
});
