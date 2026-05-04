import { GLOSSARY_ENTRIES } from "../../data/glossary";
import { CONCEPT_ENTRIES } from "../../data/concepts";

export type HelpMatch = {
  id: string;
  title: string;
  subtitle: string;
  entryType: "glossary" | "concept";
};

export function matchHelp(query: string): HelpMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const gloss = GLOSSARY_ENTRIES.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.definition.toLowerCase().includes(q) ||
      e.tag.toLowerCase().includes(q)
  ).map<HelpMatch>((e) => ({
    id: e.id,
    title: e.term,
    subtitle: e.definition.slice(0, 60),
    entryType: "glossary",
  }));
  const concepts = CONCEPT_ENTRIES.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.whyItMatters.toLowerCase().includes(q)
  ).map<HelpMatch>((e) => ({
    id: e.id,
    title: e.title,
    subtitle: e.summary.slice(0, 60),
    entryType: "concept",
  }));
  return [...gloss, ...concepts].slice(0, 5);
}
