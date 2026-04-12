import { describe, it, expect } from "bun:test";
import { GLOSSARY_ENTRIES, getGlossaryEntry, type GlossaryTag } from "./glossary";

describe("GLOSSARY_ENTRIES", () => {
  it("contains all 35 canonical entries", () => {
    expect(GLOSSARY_ENTRIES.length).toBe(35);
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

  it("every entry has a valid tag", () => {
    const validTags: GlossaryTag[] = ["financial", "finplan"];
    for (const entry of GLOSSARY_ENTRIES) {
      expect(validTags).toContain(entry.tag);
    }
  });

  it("no entry references itself in relatedConceptIds", () => {
    for (const entry of GLOSSARY_ENTRIES) {
      expect(entry.relatedConceptIds).not.toContain(entry.id);
    }
  });

  it("no entry references itself in relatedTermIds", () => {
    for (const entry of GLOSSARY_ENTRIES) {
      expect(entry.relatedTermIds).not.toContain(entry.id);
    }
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
