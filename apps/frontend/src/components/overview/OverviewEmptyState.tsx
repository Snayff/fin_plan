import { useNavigate } from "react-router-dom";
import { WaterfallConnector } from "@/components/overview/WaterfallConnector";

const GHOST_TIERS = [
  { label: "Income", colorClass: "text-tier-income" },
  { label: "Committed", colorClass: "text-tier-committed" },
  { label: "Discretionary", colorClass: "text-tier-discretionary" },
  { label: "Surplus", colorClass: "text-tier-surplus" },
] as const;

const CONNECTORS = ["minus committed", "minus discretionary", "equals"] as const;

export default function OverviewEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-0">
      {/* Ghosted cascade */}
      <div data-testid="empty-cascade" className="space-y-0">
        {GHOST_TIERS.map((tier, i) => (
          <div key={tier.label}>
            <div className="flex items-center justify-between py-1.5 px-2 opacity-25 select-none pointer-events-none">
              <span
                className={`text-[13px] font-heading font-semibold tracking-tier uppercase ${tier.colorClass}`}
              >
                {tier.label}
              </span>
              <span className={`text-[15px] font-numeric font-semibold ${tier.colorClass}`}>
                £—
              </span>
            </div>
            {i < GHOST_TIERS.length - 1 && (
              <div className="opacity-20">
                <WaterfallConnector text={CONNECTORS[i]!} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Build your waterfall callout card */}
      <div
        className="mt-6 mx-2 p-5 rounded-lg text-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(168, 85, 247, 0.05) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.1)",
        }}
      >
        <p className="text-[15px] font-heading font-semibold text-foreground">
          Build your waterfall
        </p>
        <p className="text-[13px] text-muted-foreground mt-1">
          See where your money flows — from income through to surplus.
        </p>
        <button
          type="button"
          onClick={() => navigate("/income")}
          className="mt-4 px-4 py-2 rounded-lg bg-page-accent/20 text-sm font-medium text-page-accent hover:bg-page-accent/30 transition-colors"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
