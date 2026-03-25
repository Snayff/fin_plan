import { useState } from "react";
import type { WaterfallSummary } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
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
  /** Whether savings sub-form is active in discretionary phase */
  isSavingsActive?: boolean;
  /** Toggle between categories and savings in discretionary */
  onToggleSavings?: () => void;
}

const ROW_CLASS =
  "flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors text-[13px] font-body text-text-secondary";

const AMOUNT_CLASS = "font-numeric text-foreground/60";

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
}: {
  label: React.ReactNode;
  total: string;
  colorClass: string;
  staleCount: number;
  dimmed?: boolean;
}) {
  return (
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
}

export function WaterfallLeftPanel({
  summary,
  onSelectItem,
  onOpenCashflowCalendar,
  selectedItemId,
  buildPhase = null,
  prefillName = null,
  isSavingsActive = false,
  onToggleSavings,
}: WaterfallLeftPanelProps) {
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
  const phases: BuildPhase[] = ["income", "committed", "discretionary", "summary"];
  const activeIdx = buildPhase ? phases.indexOf(buildPhase) : -1;

  function tierState(tier: "income" | "committed" | "discretionary") {
    if (!inBuild) return "normal" as const;
    const tierIdx = phases.indexOf(tier);
    if (tierIdx === activeIdx) return "active" as const;
    if (tierIdx < activeIdx) return "completed" as const;
    return "future" as const;
  }

  const incomeState = tierState("income");
  const committedState = tierState("committed");
  const discretionaryState = tierState("discretionary");

  return (
    <div className="space-y-4 text-sm">
      {/* INCOME */}
      <div className={cn(incomeState === "future" && "opacity-40")}>
        <SectionHeader
          label="Income"
          total={formatCurrency(income.total)}
          colorClass="text-tier-income"
          staleCount={incomeStaleCount}
          dimmed={incomeState === "future"}
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
      </div>

      <WaterfallConnector text="minus committed" />

      {/* COMMITTED */}
      <div className={cn(committedState === "future" && "opacity-40")}>
        <SectionHeader
          label={<DefinitionTooltip term="Committed Spend">Committed</DefinitionTooltip>}
          total={formatCurrency(committed.monthlyTotal + committed.monthlyAvg12)}
          colorClass="text-tier-committed"
          staleCount={committedStaleCount}
          dimmed={committedState === "future"}
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
              <TierAddForm phase="committed" prefillName={prefillName} />
            )}
          </div>
        )}
      </div>

      <WaterfallConnector text="minus discretionary" />

      {/* DISCRETIONARY */}
      <div className={cn(discretionaryState === "future" && "opacity-40")}>
        <SectionHeader
          label={<DefinitionTooltip term="Discretionary Spend">Discretionary</DefinitionTooltip>}
          total={formatCurrency(discretionary.total + discretionary.savings.total)}
          colorClass="text-tier-discretionary"
          staleCount={discretionaryStaleCount}
          dimmed={discretionaryState === "future"}
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
              {discretionaryState === "active" && onToggleSavings && (
                <button
                  type="button"
                  onClick={onToggleSavings}
                  className="text-xs text-primary hover:underline"
                >
                  {isSavingsActive ? "← Back to categories" : "Add savings →"}
                </button>
              )}
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
      </div>

      <WaterfallConnector text="equals" />

      {/* SURPLUS */}
      <div className={cn(inBuild && buildPhase !== "summary" && "opacity-60")}>
        <SectionHeader
          label={<DefinitionTooltip term="Surplus">Surplus</DefinitionTooltip>}
          total={formatCurrency(surplus.amount)}
          colorClass="text-tier-surplus"
          staleCount={0}
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
      </div>
    </div>
  );
}
