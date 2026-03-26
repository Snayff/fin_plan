import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { WaterfallSummary } from "@finplan/shared";
import { usePrefersReducedMotion } from "@/utils/motion";
import { formatCurrency } from "@/utils/format";
import { AnimatedCurrency } from "@/components/common/AnimatedCurrency";
import { cn } from "@/lib/utils";
import { isStale } from "@/utils/staleness";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { DefinitionTooltip } from "@/components/common/DefinitionTooltip";
import { useSettings } from "@/hooks/useSettings";
import { TierAddForm } from "@/components/overview/build/TierAddForm";
import type { BuildPhase } from "@/components/overview/build/quick-picks";
import { WaterfallConnector } from "@/components/overview/WaterfallConnector";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
  wealthAccountId?: string | null;
}

interface WaterfallLeftPanelProps {
  summary: WaterfallSummary;
  onSelectItem: (item: SelectedItem) => void;
  onOpenCashflowCalendar: () => void;
  selectedItemId: string | null;
  /** Build mode: which phase is active (null = normal mode) */
  buildPhase?: BuildPhase | null;
  /** Pre-filled name from quick-pick chip */
  prefillName?: string | null;
}

const ROW_CLASS =
  "flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors text-[13px] font-body text-text-secondary";

const AMOUNT_CLASS = "font-numeric text-foreground/60";

const PHASE_TIER_INDEX: Record<BuildPhase, number> = {
  household: -1,
  income: 0,
  committed: 1,
  yearly_bills: 1,
  discretionary: 2,
  savings: 2,
  summary: 3,
};

const TIER_IDX = { income: 0, committed: 1, discretionary: 2 } as const;

function StaleCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-attention"
      aria-label={`${count} item${count === 1 ? "" : "s"} need review`}
    >
      <span
        className="inline-block h-[5px] w-[5px] rounded-full shrink-0 bg-attention"
        aria-hidden
      />
      {count} stale
    </span>
  );
}

function SectionHeader({
  label,
  total,
  colorClass,
  staleCount,
  dimmed,
  onHeaderClick,
  headerTestId,
}: {
  label: React.ReactNode;
  total: React.ReactNode;
  colorClass: string;
  staleCount: number;
  dimmed?: boolean;
  onHeaderClick?: () => void;
  headerTestId?: string;
}) {
  const content = (
    <div className={cn("flex items-center justify-between py-1.5 px-2", dimmed && "opacity-40")}>
      <div className="flex items-center gap-2">
        <h3
          className={cn(
            "text-[13px] font-heading font-semibold tracking-tier uppercase",
            colorClass
          )}
        >
          {label}
        </h3>
        {!dimmed && <StaleCountBadge count={staleCount} />}
      </div>
      <span className={cn("text-[15px] font-numeric font-semibold", colorClass)}>{total}</span>
    </div>
  );

  if (onHeaderClick) {
    return (
      <button
        type="button"
        data-testid={headerTestId}
        onClick={onHeaderClick}
        className="w-full text-left hover:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }
  return content;
}

export function WaterfallLeftPanel({
  summary,
  onSelectItem,
  onOpenCashflowCalendar,
  selectedItemId,
  buildPhase = null,
  prefillName = null,
}: WaterfallLeftPanelProps) {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const thresholds = settings?.stalenessThresholds ?? {
    income_source: 12,
    committed_bill: 6,
    yearly_bill: 12,
    discretionary_category: 12,
    savings_allocation: 12,
    wealth_account: 3,
  };

  const [showAllCategories, setShowAllCategories] = useState(false);

  const { income, committed, discretionary, surplus } = summary;

  const allIncomeSources = [...income.monthly, ...income.annual, ...income.oneOff];
  const incomeStaleCount = allIncomeSources.filter((s) =>
    isStale(s.lastReviewedAt, thresholds.income_source ?? 12)
  ).length;

  const committedStaleCount = committed.bills.filter((b) =>
    isStale(b.lastReviewedAt, thresholds.committed_bill ?? 6)
  ).length;

  const discCatStaleCount = discretionary.categories.filter((c) =>
    isStale(c.lastReviewedAt, thresholds.discretionary_category ?? 12)
  ).length;
  const savingsStaleCount = discretionary.savings.allocations.filter((s) =>
    isStale(s.lastReviewedAt, thresholds.savings_allocation ?? 12)
  ).length;
  const discretionaryStaleCount = discCatStaleCount + savingsStaleCount;

  const surplusBenchmark = settings?.surplusBenchmarkPct ?? 10;

  const inBuild = buildPhase !== null;
  const activeIdx = buildPhase !== null ? PHASE_TIER_INDEX[buildPhase] : -1;

  function tierState(tier: "income" | "committed" | "discretionary") {
    if (!inBuild) return "normal" as const;
    const tierIdx = TIER_IDX[tier];
    if (tierIdx === activeIdx) return "active" as const;
    if (tierIdx < activeIdx) return "completed" as const;
    return "future" as const;
  }

  const isSavingsActive = buildPhase === "savings";

  const incomeState = tierState("income");
  const committedState = tierState("committed");
  const discretionaryState = tierState("discretionary");

  const reduced = usePrefersReducedMotion();

  const containerVariants = {
    animate: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
  };

  return (
    <motion.div
      className="space-y-4 text-sm"
      variants={containerVariants}
      initial={reduced ? false : "initial"}
      animate="animate"
    >
      {/* INCOME */}
      <motion.div variants={itemVariants} className={cn(incomeState === "future" && "opacity-40")}>
        <SectionHeader
          label={<DefinitionTooltip term="Income">Income</DefinitionTooltip>}
          total={<AnimatedCurrency value={income.total} />}
          colorClass="text-tier-income"
          staleCount={incomeStaleCount}
          dimmed={incomeState === "future"}
          onHeaderClick={!inBuild ? () => navigate("/income") : undefined}
          headerTestId="tier-heading-income"
        />
        {incomeState !== "future" && (
          <div className="space-y-0.5">
            {income.byType.map((group) => {
              const handleSelect = () =>
                !inBuild &&
                onSelectItem({
                  id: `type:${group.type}`,
                  type: "income_type",
                  name: group.label,
                  amount: group.monthlyTotal,
                  lastReviewedAt: new Date(),
                });
              return (
                <div
                  key={group.type}
                  role="button"
                  tabIndex={inBuild ? -1 : 0}
                  aria-pressed={selectedItemId === `type:${group.type}`}
                  className={cn(
                    ROW_CLASS,
                    selectedItemId === `type:${group.type}` && "bg-accent",
                    inBuild && "cursor-default hover:bg-transparent"
                  )}
                  onClick={handleSelect}
                  onKeyDown={(e) => e.key === "Enter" && handleSelect()}
                >
                  <span>{group.label}</span>
                  <span className={AMOUNT_CLASS}>{formatCurrency(group.monthlyTotal)}</span>
                </div>
              );
            })}
            {incomeState === "active" && <TierAddForm phase="income" prefillName={prefillName} />}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="minus committed" />
      </motion.div>

      {/* COMMITTED */}
      <motion.div
        variants={itemVariants}
        className={cn(committedState === "future" && "opacity-40")}
      >
        <SectionHeader
          label={<DefinitionTooltip term="Committed Spend">Committed</DefinitionTooltip>}
          total={<AnimatedCurrency value={committed.monthlyTotal + committed.monthlyAvg12} />}
          colorClass="text-tier-committed"
          staleCount={committedStaleCount}
          dimmed={committedState === "future"}
          onHeaderClick={!inBuild ? () => navigate("/committed") : undefined}
          headerTestId="tier-heading-committed"
        />
        {committedState !== "future" && (
          <div className="space-y-0.5">
            <div
              role="button"
              tabIndex={inBuild ? -1 : 0}
              aria-pressed={selectedItemId === "aggregate:committed_bills"}
              className={cn(
                ROW_CLASS,
                selectedItemId === "aggregate:committed_bills" && "bg-accent",
                inBuild && "cursor-default hover:bg-transparent"
              )}
              onClick={() =>
                !inBuild &&
                onSelectItem({
                  id: "aggregate:committed_bills",
                  type: "committed_bills",
                  name: "Monthly bills",
                  amount: committed.monthlyTotal,
                  lastReviewedAt: new Date(),
                })
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !inBuild &&
                onSelectItem({
                  id: "aggregate:committed_bills",
                  type: "committed_bills",
                  name: "Monthly bills",
                  amount: committed.monthlyTotal,
                  lastReviewedAt: new Date(),
                })
              }
            >
              <span>Monthly bills</span>
              <span className={AMOUNT_CLASS}>{formatCurrency(committed.monthlyTotal)}</span>
            </div>
            <div
              role="button"
              tabIndex={inBuild ? -1 : 0}
              aria-pressed={false}
              className={cn(ROW_CLASS, inBuild && "cursor-default hover:bg-transparent")}
              onClick={() => !inBuild && onOpenCashflowCalendar()}
              onKeyDown={(e) => e.key === "Enter" && !inBuild && onOpenCashflowCalendar()}
            >
              <span>Yearly ÷12</span>
              <span className={AMOUNT_CLASS}>{formatCurrency(committed.monthlyAvg12)}</span>
            </div>
            {committedState === "active" && (
              <TierAddForm
                key={buildPhase === "yearly_bills" ? "yearly" : "monthly"}
                phase="committed"
                prefillName={prefillName}
                lockedFrequency={
                  buildPhase === "yearly_bills"
                    ? "yearly"
                    : buildPhase === "committed"
                      ? "monthly"
                      : undefined
                }
              />
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="minus discretionary" />
      </motion.div>

      {/* DISCRETIONARY */}
      <motion.div
        variants={itemVariants}
        className={cn(discretionaryState === "future" && "opacity-40")}
      >
        <SectionHeader
          label={<DefinitionTooltip term="Discretionary Spend">Discretionary</DefinitionTooltip>}
          total={<AnimatedCurrency value={discretionary.total + discretionary.savings.total} />}
          colorClass="text-tier-discretionary"
          staleCount={discretionaryStaleCount}
          dimmed={discretionaryState === "future"}
          onHeaderClick={!inBuild ? () => navigate("/discretionary") : undefined}
          headerTestId="tier-heading-discretionary"
        />
        {discretionaryState !== "future" && (
          <div className="space-y-0.5">
            {(showAllCategories || discretionary.categories.length <= 5
              ? discretionary.categories
              : discretionary.categories.slice(0, 5)
            ).map((cat) => {
              const handleSelect = () =>
                !inBuild &&
                onSelectItem({
                  id: cat.id,
                  type: "discretionary_category",
                  name: cat.name,
                  amount: cat.monthlyBudget,
                  lastReviewedAt: new Date(cat.lastReviewedAt),
                });
              return (
                <div
                  key={cat.id}
                  role="button"
                  tabIndex={inBuild ? -1 : 0}
                  aria-pressed={selectedItemId === cat.id}
                  className={cn(
                    ROW_CLASS,
                    selectedItemId === cat.id && "bg-accent",
                    inBuild && "cursor-default hover:bg-transparent"
                  )}
                  onClick={handleSelect}
                  onKeyDown={(e) => e.key === "Enter" && handleSelect()}
                >
                  <span>{cat.name}</span>
                  <div className="flex items-center gap-2">
                    {!inBuild && (
                      <StalenessIndicator
                        lastReviewedAt={cat.lastReviewedAt}
                        thresholdMonths={thresholds.discretionary_category ?? 12}
                      />
                    )}
                    <span className={AMOUNT_CLASS}>{formatCurrency(cat.monthlyBudget)}</span>
                  </div>
                </div>
              );
            })}
            {!showAllCategories && discretionary.categories.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className={cn(ROW_CLASS, "text-muted-foreground hover:text-foreground")}
              >
                ··· {discretionary.categories.length - 5} more
              </button>
            )}
            {/* Inline add form for categories (non-savings) */}
            {discretionaryState === "active" && !isSavingsActive && (
              <TierAddForm phase="discretionary" prefillName={prefillName} />
            )}

            <div className="py-1.5 px-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Savings
              </span>
            </div>
            {discretionary.savings.allocations.map((sav) => {
              const handleSelect = () =>
                !inBuild &&
                onSelectItem({
                  id: sav.id,
                  type: "savings_allocation",
                  name: sav.name,
                  amount: sav.monthlyAmount,
                  lastReviewedAt: new Date(sav.lastReviewedAt),
                  wealthAccountId: sav.wealthAccountId,
                });
              return (
                <div
                  key={sav.id}
                  role="button"
                  tabIndex={inBuild ? -1 : 0}
                  aria-pressed={selectedItemId === sav.id}
                  className={cn(
                    ROW_CLASS,
                    selectedItemId === sav.id && "bg-accent",
                    inBuild && "cursor-default hover:bg-transparent"
                  )}
                  onClick={handleSelect}
                  onKeyDown={(e) => e.key === "Enter" && handleSelect()}
                >
                  <span>{sav.name}</span>
                  <div className="flex items-center gap-2">
                    {!inBuild && (
                      <StalenessIndicator
                        lastReviewedAt={sav.lastReviewedAt}
                        thresholdMonths={thresholds.savings_allocation ?? 12}
                      />
                    )}
                    <span className={AMOUNT_CLASS}>{formatCurrency(sav.monthlyAmount)}</span>
                  </div>
                </div>
              );
            })}
            {/* Inline add form for savings */}
            {discretionaryState === "active" && isSavingsActive && (
              <TierAddForm phase="discretionary" prefillName={prefillName} isSavings />
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <WaterfallConnector text="equals" />
      </motion.div>

      {/* SURPLUS */}
      <motion.div
        variants={itemVariants}
        className={cn("relative", inBuild && buildPhase !== "summary" && "opacity-60")}
      >
        {surplus.amount > 0 && !reduced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut", times: [0, 0.2, 1] }}
            className="absolute inset-0 pointer-events-none rounded"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, hsl(175 72% 57% / 0.09) 0%, transparent 70%)",
            }}
          />
        )}
        <SectionHeader
          label={<DefinitionTooltip term="Surplus">Surplus</DefinitionTooltip>}
          total={<AnimatedCurrency value={surplus.amount} />}
          colorClass="text-tier-surplus"
          staleCount={0}
          onHeaderClick={!inBuild ? () => navigate("/surplus") : undefined}
          headerTestId="tier-heading-surplus"
        />
        <div aria-live="polite" aria-atomic="true">
          {!inBuild && surplus.percentOfIncome < surplusBenchmark && (
            <div className="flex items-center gap-1.5 px-2 text-xs text-attention">
              <span className="h-[5px] w-[5px] rounded-full shrink-0 bg-attention" aria-hidden />
              <span>Below benchmark</span>
            </div>
          )}
        </div>
        {!inBuild && discretionary.savings.allocations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const first = discretionary.savings.allocations[0];
              if (first) {
                onSelectItem({
                  id: first.id,
                  type: "savings_allocation",
                  name: first.name,
                  amount: first.monthlyAmount,
                  lastReviewedAt: new Date(first.lastReviewedAt),
                });
              }
            }}
            className="px-2 py-2 text-xs text-primary hover:underline min-h-[44px] flex items-center"
          >
            Increase savings ▸
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
