import { describe, it, expect } from "bun:test";
import { updateSettingsSchema } from "./settings.schemas";

describe("updateSettingsSchema", () => {
  it("accepts waterfallTipDismissed as boolean", () => {
    const result = updateSettingsSchema.safeParse({ waterfallTipDismissed: true });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean waterfallTipDismissed", () => {
    const result = updateSettingsSchema.safeParse({ waterfallTipDismissed: "yes" });
    expect(result.success).toBe(false);
  });
});
