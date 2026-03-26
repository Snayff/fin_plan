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

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
        {entry.term}
      </h1>

      <p className="text-sm text-foreground/80 leading-relaxed">
        {entry.definition}
      </p>

      {entry.appearsIn.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground/60">
          <span className="font-medium">Appears in:</span>{" "}
          {entry.appearsIn.join(", ")}
        </p>
      )}

      {entry.relatedConceptIds.length > 0 && (
        <>
          <hr className="my-4 border-border" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Related concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.relatedConceptIds.map((conceptId) => {
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

      {entry.relatedTermIds.length > 0 && (
        <>
          <hr className="my-4 border-border" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Related terms
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {entry.relatedTermIds.map((termId) => {
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
