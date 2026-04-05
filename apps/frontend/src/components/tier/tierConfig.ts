// Tier colours and labels for use in TierPage and child components
export type TierKey = "income" | "committed" | "discretionary";

export interface TierConfig {
  tier: TierKey;
  label: string;
  /** Hex colour for the tier (for recharts / non-Tailwind contexts) */
  color: string;
  /** Tailwind text colour class for the tier */
  textClass: string;
  /** Tailwind bg colour class at low opacity (for hover/selected states) */
  bgClass: string;
  /** Tailwind border colour class (for selected left border) */
  borderClass: string;
  /** Tailwind hover bg class at 5% opacity (for unselected subcategory rows) */
  hoverBgClass: string;
}

export const TIER_CONFIGS: Record<TierKey, TierConfig> = {
  income: {
    tier: "income",
    label: "Income",
    color: "#0ea5e9",
    textClass: "text-tier-income",
    bgClass: "bg-tier-income",
    borderClass: "border-tier-income",
    hoverBgClass: "hover:bg-tier-income/5",
  },
  committed: {
    tier: "committed",
    label: "Committed",
    color: "#6366f1",
    textClass: "text-tier-committed",
    bgClass: "bg-tier-committed",
    borderClass: "border-tier-committed",
    hoverBgClass: "hover:bg-tier-committed/5",
  },
  discretionary: {
    tier: "discretionary",
    label: "Discretionary",
    color: "#a855f7",
    textClass: "text-tier-discretionary",
    bgClass: "bg-tier-discretionary",
    borderClass: "border-tier-discretionary",
    hoverBgClass: "hover:bg-tier-discretionary/5",
  },
};
