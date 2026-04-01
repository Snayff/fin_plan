import { motion, LayoutGroup } from "framer-motion";
import { toGBP } from "@finplan/shared";
import { usePrefersReducedMotion } from "@/utils/motion";
import { AnimatedCurrency } from "@/components/common/AnimatedCurrency";
import { isStale } from "./formatAmount";
import type { TierConfig, TierKey } from "./tierConfig";
import type { TierItemRow } from "@/hooks/useWaterfall";

interface SubcategoryRow {
  id: string;
  name: string;
  tier: TierKey;
  sortOrder: number;
  isLocked: boolean;
}

interface SubcategorySummary {
  subcategoryId: string;
  name: string;
  total: number;
  items: TierItemRow[];
}

interface Props {
  tier: TierKey;
  config: TierConfig;
  subcategories: SubcategoryRow[];
  subcategoryTotals: Record<string, SubcategorySummary>;
  tierTotal: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  now?: Date;
  stalenessMonths?: number;
}

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  initial: { opacity: 0, x: -22 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } },
};

export default function SubcategoryList({
  tier,
  config,
  subcategories,
  subcategoryTotals,
  tierTotal,
  selectedId,
  onSelect,
  isLoading,
  now = new Date(),
  stalenessMonths = 12,
}: Props) {
  const reduced = usePrefersReducedMotion();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-foreground/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <LayoutGroup>
        <motion.div
          role="tablist"
          aria-label="Subcategories"
          className="flex-1 overflow-y-auto"
          variants={containerVariants}
          initial={reduced ? false : "initial"}
          animate="animate"
        >
          {subcategories.map((sub) => {
            const isSelected = sub.id === selectedId;
            const summary = subcategoryTotals[sub.id];
            const isSubStale = (subcategoryTotals[sub.id]?.items ?? []).some((item) =>
              isStale(item.lastReviewedAt, now, stalenessMonths)
            );
            return (
              <motion.button
                type="button"
                role="tab"
                key={sub.id}
                data-testid={`subcategory-row-${sub.id}`}
                aria-selected={isSelected}
                onClick={() => onSelect(sub.id)}
                variants={rowVariants}
                className={[
                  "relative flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected
                    ? `font-medium ${config.textClass}`
                    : `text-foreground/60 ${config.hoverBgClass}`,
                ].join(" ")}
              >
                {isSelected && !reduced && (
                  <motion.div
                    layoutId={`subcategory-indicator-${tier}`}
                    className={`absolute inset-0 ${config.bgClass}/14 border-l-2 ${config.borderClass} rounded-r-sm`}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                  />
                )}
                {isSelected && reduced && (
                  <div
                    className={`absolute inset-0 ${config.bgClass}/14 border-l-2 ${config.borderClass} rounded-r-sm`}
                  />
                )}
                <span className="relative z-10 w-2 shrink-0 flex items-center justify-center">
                  {isSubStale && (
                    <span
                      data-testid={`stale-dot-${sub.id}`}
                      className="h-1.5 w-1.5 rounded-full bg-attention"
                      aria-hidden
                    />
                  )}
                </span>
                <span className="relative z-10 flex-1">{sub.name}</span>
                <span className="relative z-10 font-numeric text-xs text-foreground/50">
                  <AnimatedCurrency value={summary ? toGBP(summary.total) : 0} />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </LayoutGroup>
      {/* Tier total — static, not animated */}
      <div
        data-testid="tier-total"
        className="border-t border-foreground/10 px-4 py-3 flex justify-between text-sm"
      >
        <span className="text-foreground/50">Total</span>
        <span className={`font-numeric font-semibold ${config.textClass}`}>
          <AnimatedCurrency value={toGBP(tierTotal)} />
        </span>
      </div>
    </div>
  );
}
