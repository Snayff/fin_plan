import { getGlossaryEntry } from "@/data/glossary";
import { getConceptEntry } from "@/data/concepts";
import { GlossaryTermMarker } from "./GlossaryTermMarker";

interface Props {
  entryId: string;
  onNavigate: (id: string) => void;
}

export function GlossaryDetailView({ entryId, onNavigate }: Props) {
  const entry = getGlossaryEntry(entryId);
  if (!entry) return null;

  const matchingConcept = getConceptEntry(entryId);
  const filteredConceptIds = entry.relatedConceptIds.filter((id) => id !== entryId);
  const filteredTermIds = entry.relatedTermIds.filter((id) => id !== entryId);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">{entry.term}</h1>

      <span
        className={
          entry.tag === "financial"
            ? "inline-block text-[10px] px-2 py-0.5 rounded-full bg-foreground/8 text-foreground/50 mb-3"
            : "inline-block text-[10px] px-2 py-0.5 rounded-full bg-page-accent/10 text-page-accent/70 mb-3"
        }
      >
        {entry.tag === "financial" ? "Financial term" : "finplan concept"}
      </span>

      <p className="text-sm text-foreground/80 leading-relaxed">{entry.definition}</p>

      {entry.appearsIn.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground/60">
          <span className="font-medium">Appears in:</span> {entry.appearsIn.join(", ")}
        </p>
      )}

      {matchingConcept && (
        <>
          <hr className="my-4 border-border" />
          <div className="rounded-lg border border-page-accent/30 bg-page-accent/5 p-4">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Explore this topic
            </p>
            <button
              type="button"
              onClick={() => onNavigate(entryId)}
              className="text-sm text-page-accent hover:text-page-accent/80 transition-colors font-medium"
            >
              {matchingConcept.title} →
            </button>
          </div>
        </>
      )}

      {filteredConceptIds.length > 0 && (
        <>
          <hr className="my-4 border-border" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Related concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredConceptIds.map((conceptId) => {
                const concept = getConceptEntry(conceptId);
                if (!concept) return null;
                return (
                  <button
                    key={conceptId}
                    type="button"
                    onClick={() => onNavigate(conceptId)}
                    className="text-sm text-foreground/60 hover:text-foreground underline transition-colors text-left"
                  >
                    {concept.title}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {filteredTermIds.length > 0 && (
        <>
          <hr className="my-4 border-border" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Related terms
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {filteredTermIds.map((termId) => {
                const term = getGlossaryEntry(termId);
                if (!term) return null;
                return (
                  <GlossaryTermMarker key={termId} entryId={termId}>
                    {term.term}
                  </GlossaryTermMarker>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
