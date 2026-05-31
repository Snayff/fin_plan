import { describe, it, expect } from "bun:test";
import {
  formatItemAmount,
  formatTwoLineAmount,
  getMonthsAgo,
  isStale,
  SPEND_TYPE_LABELS,
} from "./formatAmount";

describe("formatTwoLineAmount", () => {
  it("monthly item: monthly is bright, yearly is muted", () => {
    const result = formatTwoLineAmount(350, "monthly");
    expect(result.monthly.value).toBe("£350/mo");
    expect(result.monthly.bright).toBe(true);
    expect(result.yearly.value).toBe("£4,200/yr");
    expect(result.yearly.bright).toBe(false);
  });

  it("yearly item: monthly is bright, yearly is muted", () => {
    const result = formatTwoLineAmount(840, "yearly");
    expect(result.monthly.value).toBe("£70/mo");
    expect(result.monthly.bright).toBe(true);
    expect(result.yearly.value).toBe("£840/yr");
    expect(result.yearly.bright).toBe(false);
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

describe("formatItemAmount", () => {
  it("monthly: primary only, no secondary or label", () => {
    const r = formatItemAmount(35000, "monthly");
    expect(r.primary).toBe("£35,000");
    expect(r.secondary).toBeNull();
    expect(r.label).toBeNull();
  });

  it("weekly: shows a /mo secondary derived from the weekly amount", () => {
    const r = formatItemAmount(1000, "weekly");
    expect(r.primary).toBe("£1,000");
    expect(r.secondary).toMatch(/\/mo$/);
    expect(r.label).toBeNull();
  });

  it("quarterly: divides by 3 for the /mo secondary", () => {
    const r = formatItemAmount(30000, "quarterly"); // 30000/3 = 10000
    expect(r.secondary).toBe("£10,000/mo");
  });

  it("yearly: divides by 12 and rounds the /mo conversion by default", () => {
    const r = formatItemAmount(120000, "yearly"); // 120000/12 = 10000
    expect(r.secondary).toBe("£10,000/mo");
  });

  it("one_off: labelled and shows a £0/mo secondary", () => {
    const r = formatItemAmount(50000, "one_off");
    expect(r.label).toBe("One-off");
    expect(r.secondary).toBe("£0/mo");
  });

  it("preserves pence in the /mo conversion when showPence is true", () => {
    const rounded = formatItemAmount(100000, "yearly"); // 100000/12 = 8333.33 → rounded
    const pence = formatItemAmount(100000, "yearly", true);
    expect(rounded.secondary).toBe("£8,333/mo");
    expect(pence.secondary).toBe("£8,333.33/mo");
  });
});

describe("getMonthsAgo", () => {
  it("returns 0 for the same day", () => {
    const d = new Date("2026-05-31");
    expect(getMonthsAgo(d, d)).toBe(0);
  });

  it("counts whole calendar months elapsed", () => {
    expect(getMonthsAgo(new Date("2026-01-15"), new Date("2026-04-15"))).toBe(3);
  });
});

describe("isStale", () => {
  it("is false when within the threshold", () => {
    expect(isStale(new Date("2026-04-01"), new Date("2026-05-01"), 3)).toBe(false);
  });

  it("is true once the elapsed months exceed the threshold", () => {
    expect(isStale(new Date("2026-01-01"), new Date("2026-05-01"), 3)).toBe(true);
  });
});
