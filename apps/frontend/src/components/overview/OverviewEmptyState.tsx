import { Link } from "react-router-dom";
import { GlossaryTermMarker } from "@/components/help/GlossaryTermMarker";

const GHOSTED_TIERS = [
  { label: "Income", colorClass: "text-tier-income" },
  { label: "Committed spend", colorClass: "text-tier-committed" },
  { label: "Discretionary", colorClass: "text-tier-discretionary" },
  { label: "Surplus", colorClass: "text-tier-surplus" },
];

export default function OverviewEmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 px-8 py-12">
      <div className="flex flex-col items-center gap-3 opacity-25">
        {GHOSTED_TIERS.map((tier, i) => (
          <div key={tier.label} className="flex items-center gap-3">
            <span
              className={`font-heading text-xs font-bold uppercase tracking-widest ${tier.colorClass}`}
            >
              {tier.label}
            </span>
            <span className="font-numeric text-xs text-text-tertiary">£—</span>
            {i < GHOSTED_TIERS.length - 1 && (
              <span className="text-[10px] text-text-tertiary opacity-60">↓</span>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-page-accent/10 px-4 py-3.5 max-w-md w-full text-center bg-page-accent/5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-1">
          Build your waterfall
        </h3>
        <p className="text-xs text-text-tertiary mb-3">
          Add your <GlossaryTermMarker entryId="net-income">income</GlossaryTermMarker>,{" "}
          <GlossaryTermMarker entryId="committed-spend">committed spend</GlossaryTermMarker>, and{" "}
          <GlossaryTermMarker entryId="discretionary-spend">discretionary</GlossaryTermMarker>{" "}
          budgets to see your monthly cascade.
        </p>
        <Link
          to="/waterfall"
          className="inline-block rounded-md bg-page-accent/15 border border-page-accent/40 px-3 py-1.5 text-xs font-medium text-page-accent hover:bg-page-accent/25 transition-colors"
        >
          Build your waterfall
        </Link>
      </div>
    </div>
  );
}
