import { describe, it, expect } from "bun:test";
import { formatTwoLineAmount, SPEND_TYPE_LABELS } from "./formatAmount";

describe("formatTwoLineAmount", () => {
  it("monthly item: monthly is bright, yearly is muted", () => {
    const result = formatTwoLineAmount(350, "monthly");
    expect(result.monthly.value).toBe("£350/mo");
    expect(result.monthly.bright).toBe(true);
    expect(result.yearly.value).toBe("£4,200/yr");
    expect(result.yearly.bright).toBe(false);
  });

  it("yearly item: yearly is bright, monthly is muted", () => {
    const result = formatTwoLineAmount(840, "yearly");
    expect(result.monthly.value).toBe("£70/mo");
    expect(result.monthly.bright).toBe(false);
    expect(result.yearly.value).toBe("£840/yr");
    expect(result.yearly.bright).toBe(true);
  });

  it("one-off item: single amount, no yearly", () => {
    const result = formatTwoLineAmount(3200, "one_off");
    expect(result.monthly.value).toBe("£3,200");
    expect(result.monthly.bright).toBe(true);
    expect(result.yearly).toBeNull();
  });

  it("rounds monthly conversion of yearly to nearest whole pound", () => {
    // 1000 yearly / 12 = 83.33 → Math.round = 83
    const result = formatTwoLineAmount(1000, "yearly");
    expect(result.monthly.value).toBe("£83/mo");
  });
});

describe("formatTwoLineAmount with showPence = true", () => {
  it("monthly item: shows pence on both lines", () => {
    const result = formatTwoLineAmount(350.5, "monthly", true);
    expect(result.monthly.value).toBe("£350.50/mo");
    expect(result.yearly!.value).toBe("£4,206.00/yr");
  });

  it("yearly item: preserves pence in monthly conversion instead of rounding", () => {
    // 1000 / 12 = 83.333... → toGBP rounds to 83.33
    const result = formatTwoLineAmount(1000, "yearly", true);
    expect(result.monthly.value).toBe("£83.33/mo");
    expect(result.yearly!.value).toBe("£1,000.00/yr");
  });

  it("one-off item: shows pence, no yearly line", () => {
    const result = formatTwoLineAmount(3200.99, "one_off", true);
    expect(result.monthly.value).toBe("£3,200.99");
    expect(result.yearly).toBeNull();
  });
});

describe("SPEND_TYPE_LABELS", () => {
  it("provides human-readable labels", () => {
    expect(SPEND_TYPE_LABELS.monthly).toBe("Monthly");
    expect(SPEND_TYPE_LABELS.yearly).toBe("Yearly");
    expect(SPEND_TYPE_LABELS.one_off).toBe("One-off");
  });
});
