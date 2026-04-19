import { describe, it, expect } from "bun:test";
import { createDiscretionaryItemSchema, updateDiscretionaryItemSchema } from "./waterfall.schemas";
import { updateSettingsSchema } from "./settings.schemas";
import { ForecastProjectionSchema } from "./forecast.schemas";

describe("createDiscretionaryItemSchema — linkedAccountId", () => {
  it("accepts a string linkedAccountId", () => {
    const r = createDiscretionaryItemSchema.safeParse({
      name: "ISA top-up",
      amount: 200,
      subcategoryId: "sub1",
      linkedAccountId: "acc1",
    });
    expect(r.success).toBe(true);
  });
  it("accepts null", () => {
    const r = createDiscretionaryItemSchema.safeParse({
      name: "n",
      amount: 1,
      subcategoryId: "sub1",
      linkedAccountId: null,
    });
    expect(r.success).toBe(true);
  });
});

describe("updateDiscretionaryItemSchema", () => {
  it("accepts linkedAccountId", () => {
    const r = updateDiscretionaryItemSchema.safeParse({ linkedAccountId: "acc1" });
    expect(r.success).toBe(true);
  });
});

describe("updateSettingsSchema — asset rate defaults", () => {
  it("accepts propertyRatePct / vehicleRatePct / otherAssetRatePct", () => {
    const r = updateSettingsSchema.safeParse({
      propertyRatePct: 3.5,
      vehicleRatePct: -15,
      otherAssetRatePct: 0,
    });
    expect(r.success).toBe(true);
  });
  it("rejects vehicleRatePct below −100", () => {
    const r = updateSettingsSchema.safeParse({ vehicleRatePct: -150 });
    expect(r.success).toBe(false);
  });
  it("rejects propertyRatePct above 100", () => {
    const r = updateSettingsSchema.safeParse({ propertyRatePct: 101 });
    expect(r.success).toBe(false);
  });
});

describe("ForecastProjectionSchema — monthlyContributionsByScope", () => {
  it("accepts monthlyContributionsByScope", () => {
    const r = ForecastProjectionSchema.safeParse({
      netWorth: [],
      surplus: [],
      retirement: [],
      monthlyContributionsByScope: { netWorth: 500, retirement: 700 },
    });
    expect(r.success).toBe(true);
  });
});
