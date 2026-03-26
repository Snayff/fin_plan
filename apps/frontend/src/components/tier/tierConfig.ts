// Tier colours and labels for use in TierPage and child components
export type TierKey = "income" | "committed" | "discretionary";

export interface TierConfig {
  tier: TierKey;
  label: string;
  /** Tailwind text colour class for the tier */
  textClass: string;
  /** Tailwind bg colour class at low opacity (for hover/selected states) */
  bgClass: string;
  /** Tailwind border colour class (for selected left border) */
  borderClass: string;
}

export const TIER_CONFIGS: Record<TierKey, TierConfig> = {
  income: {
    tier: "income",
    label: "Income",
    textClass: "text-tier-income",
    bgClass: "bg-tier-income",
    borderClass: "border-tier-income",
  },
  committed: {
    tier: "committed",
    label: "Committed",
    textClass: "text-tier-committed",
    bgClass: "bg-tier-committed",
    borderClass: "border-tier-committed",
  },
  discretionary: {
    tier: "discretionary",
    label: "Discretionary",
    textClass: "text-tier-discretionary",
    bgClass: "bg-tier-discretionary",
    borderClass: "border-tier-discretionary",
  },
};
