import { describe, it, expect } from "bun:test";
import { CONCEPT_ENTRIES, getConceptEntry } from "./concepts";

describe("CONCEPT_ENTRIES", () => {
  it("contains exactly 6 concepts", () => {
    expect(CONCEPT_ENTRIES.length).toBe(6);
  });

  it("each entry has required fields", () => {
    for (const entry of CONCEPT_ENTRIES) {
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.title).toBe("string");
      expect(typeof entry.summary).toBe("string");
      expect(typeof entry.whyItMatters).toBe("string");
      expect(typeof entry.visualType).toBe("string");
      expect(Array.isArray(entry.relatedTermIds)).toBe(true);
    }
  });

  it("seeThisInFinplan is omitted when no target page exists", () => {
    const netWorth = getConceptEntry("net-worth");
    expect(netWorth?.seeThisInFinplan).toBeUndefined();
  });

  it("waterfall concept has a seeThisInFinplan route", () => {
    const waterfall = getConceptEntry("waterfall");
    expect(waterfall?.seeThisInFinplan).toBe("/overview");
  });

  it("no concept references itself in relatedTermIds", () => {
    for (const entry of CONCEPT_ENTRIES) {
      expect(entry.relatedTermIds).not.toContain(entry.id);
    }
  });
});

describe("getConceptEntry", () => {
  it("returns entry by id", () => {
    const entry = getConceptEntry("amortisation");
    expect(entry?.title).toBe("Amortisation (÷12)");
  });

  it("returns undefined for unknown id", () => {
    expect(getConceptEntry("unknown-id")).toBeUndefined();
  });
});
