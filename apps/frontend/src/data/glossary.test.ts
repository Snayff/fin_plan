import { describe, it, expect } from "bun:test";
import { GLOSSARY_ENTRIES, getGlossaryEntry } from "./glossary";

describe("GLOSSARY_ENTRIES", () => {
  it("contains all 29 canonical entries", () => {
    expect(GLOSSARY_ENTRIES.length).toBe(29);
  });

  it("each entry has required fields", () => {
    for (const entry of GLOSSARY_ENTRIES) {
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.term).toBe("string");
      expect(typeof entry.definition).toBe("string");
      expect(Array.isArray(entry.relatedConceptIds)).toBe(true);
      expect(Array.isArray(entry.appearsIn)).toBe(true);
    }
  });

  it("entries are sorted alphabetically by term", () => {
    const terms = GLOSSARY_ENTRIES.map((e) => e.term);
    const sorted = [...terms].sort((a, b) => a.localeCompare(b));
    expect(terms).toEqual(sorted);
  });
});

describe("getGlossaryEntry", () => {
  it("returns entry by id", () => {
    const entry = getGlossaryEntry("waterfall");
    expect(entry?.term).toBe("Waterfall");
  });

  it("returns undefined for unknown id", () => {
    expect(getGlossaryEntry("unknown-id")).toBeUndefined();
  });
});
