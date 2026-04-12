import { Link } from "react-router-dom";
import { getConceptEntry } from "@/data/concepts";
import { getGlossaryEntry } from "@/data/glossary";
import { GlossaryTermMarker } from "./GlossaryTermMarker";
import { ConceptVisualExplainer } from "./ConceptVisualExplainer";

interface Props {
  conceptId: string;
  onNavigate: (id: string) => void;
}

export function ConceptDetailView({ conceptId, onNavigate }: Props) {
  const concept = getConceptEntry(conceptId);
  if (!concept) return null;

  const matchingGlossary = getGlossaryEntry(conceptId);
  const filteredTermIds = concept.relatedTermIds.filter((id) => id !== conceptId);

  return (
    <div className="p-6 max-w-2xl space-y-0">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">{concept.title}</h1>

      {matchingGlossary && (
        <p className="mb-4">
          <button
            type="button"
            onClick={() => onNavigate(conceptId)}
            className="text-xs text-foreground/50 hover:text-foreground/70 transition-colors underline"
          >
            See glossary definition →
          </button>
        </p>
      )}

      {!matchingGlossary && <div className="mb-4" />}

      <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
        {concept.summary}
      </div>

      <hr className="my-6 border-border" />

      <ConceptVisualExplainer visualType={concept.visualType} />

      <hr className="my-6 border-border" />

      <div>
        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
          Why it matters in finplan
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">{concept.whyItMatters}</p>
      </div>

      {concept.seeThisInFinplan && (
        <>
          <hr className="my-6 border-border" />
          <div className="rounded-lg border border-page-accent/30 bg-page-accent/5 p-4">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              See this in finplan
            </p>
            <Link
              to={concept.seeThisInFinplan}
              className="text-sm text-page-accent hover:text-page-accent/80 transition-colors font-medium"
            >
              Open {concept.seeThisInFinplan.replace("/", "")} →
            </Link>
          </div>
        </>
      )}

      {filteredTermIds.length > 0 && (
        <>
          <hr className="my-6 border-border" />
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
