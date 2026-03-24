import type { WaterfallSummary } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { isStale } from "@/utils/staleness";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { useSettings } from "@/hooks/useSettings";
import { TierAddForm } from "@/components/overview/build/TierAddForm";
import type { BuildPhase } from "@/components/overview/build/quick-picks";

interface SelectedItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  lastReviewedAt: Date;
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
  "flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors text-sm";

function StaleCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
      <span
        className="inline-block h-[5px] w-[5px] rounded-full shrink-0"
        style={{ background: "#f59e0b" }}
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
  label: string;
  total: string;
  colorClass: string;
  staleCount: number;
  dimmed?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 px-2", dimmed && "opacity-40")}>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-semibold tracking-widest uppercase", colorClass)}>
          {label}
        </span>
        {!dimmed && <StaleCountBadge count={staleCount} />}
      </div>
      <span className="text-sm font-medium">{total}</span>
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
            {income.monthly.map((src) => (
              <div
                key={src.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === src.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: src.id,
                    type: "income_source",
                    name: src.name,
                    amount: src.amount,
                    lastReviewedAt: new Date(src.lastReviewedAt),
                  })
                }
              >
                <span>{src.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={src.lastReviewedAt}
                      thresholdMonths={thresholds.income_source ?? 12}
                    />
                  )}
                  <span>{formatCurrency(src.amount)}</span>
                </div>
              </div>
            ))}
            {income.annual.map((src) => (
              <div
                key={src.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === src.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: src.id,
                    type: "income_source",
                    name: src.name,
                    amount: src.amount,
                    lastReviewedAt: new Date(src.lastReviewedAt),
                  })
                }
              >
                <span>{src.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={src.lastReviewedAt}
                      thresholdMonths={thresholds.income_source ?? 12}
                    />
                  )}
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">÷12</span>
                    {formatCurrency(src.monthlyAmount / 12)}
                  </span>
                </div>
              </div>
            ))}
            {income.oneOff.map((src) => (
              <div
                key={src.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === src.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: src.id,
                    type: "income_source",
                    name: src.name,
                    amount: src.amount,
                    lastReviewedAt: new Date(src.lastReviewedAt),
                  })
                }
              >
                <span>{src.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={src.lastReviewedAt}
                      thresholdMonths={thresholds.income_source ?? 12}
                    />
                  )}
                  <span>{formatCurrency(src.amount)}</span>
                </div>
              </div>
            ))}
            {incomeState === "active" && <TierAddForm phase="income" prefillName={prefillName} />}
          </div>
        )}
      </div>

      {/* COMMITTED */}
      <div className={cn(committedState === "future" && "opacity-40")}>
        <SectionHeader
          label="Committed"
          total={formatCurrency(committed.monthlyTotal + committed.monthlyAvg12)}
          colorClass="text-tier-committed"
          staleCount={committedStaleCount}
          dimmed={committedState === "future"}
        />
        {committedState !== "future" && (
          <div className="space-y-0.5">
            {committed.bills.map((bill) => (
              <div
                key={bill.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === bill.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: bill.id,
                    type: "committed_bill",
                    name: bill.name,
                    amount: bill.amount,
                    lastReviewedAt: new Date(bill.lastReviewedAt),
                  })
                }
              >
                <span>{bill.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={bill.lastReviewedAt}
                      thresholdMonths={thresholds.committed_bill ?? 6}
                    />
                  )}
                  <span>{formatCurrency(bill.amount)}</span>
                </div>
              </div>
            ))}
            {/* Show yearly bills inline during build mode too */}
            {committed.yearlyBills.map((bill) => (
              <div
                key={bill.id}
                className={cn(ROW_CLASS, inBuild && "cursor-default hover:bg-transparent")}
              >
                <span>{bill.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">÷12</span>
                  <span>{formatCurrency(bill.amount / 12)}</span>
                </div>
              </div>
            ))}
            {!inBuild && (
              <div className={cn(ROW_CLASS, "group")}>
                <div className="flex items-center gap-1">
                  <span>Yearly bills (÷12)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCashflowCalendar();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    See cashflow →
                  </button>
                </div>
                <span>{formatCurrency(committed.monthlyAvg12)}</span>
              </div>
            )}
            {committedState === "active" && (
              <TierAddForm phase="committed" prefillName={prefillName} />
            )}
          </div>
        )}
      </div>

      {/* DISCRETIONARY */}
      <div className={cn(discretionaryState === "future" && "opacity-40")}>
        <SectionHeader
          label="Discretionary"
          total={formatCurrency(discretionary.total + discretionary.savings.total)}
          colorClass="text-tier-discretionary"
          staleCount={discretionaryStaleCount}
          dimmed={discretionaryState === "future"}
        />
        {discretionaryState !== "future" && (
          <div className="space-y-0.5">
            {discretionary.categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === cat.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: cat.id,
                    type: "discretionary_category",
                    name: cat.name,
                    amount: cat.monthlyBudget,
                    lastReviewedAt: new Date(cat.lastReviewedAt),
                  })
                }
              >
                <span>{cat.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={cat.lastReviewedAt}
                      thresholdMonths={thresholds.discretionary_category ?? 12}
                    />
                  )}
                  <span>{formatCurrency(cat.monthlyBudget)}</span>
                </div>
              </div>
            ))}
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
            {discretionary.savings.allocations.map((sav) => (
              <div
                key={sav.id}
                className={cn(
                  ROW_CLASS,
                  selectedItemId === sav.id && "bg-accent",
                  inBuild && "cursor-default hover:bg-transparent"
                )}
                onClick={() =>
                  !inBuild &&
                  onSelectItem({
                    id: sav.id,
                    type: "savings_allocation",
                    name: sav.name,
                    amount: sav.monthlyAmount,
                    lastReviewedAt: new Date(sav.lastReviewedAt),
                  })
                }
              >
                <span>{sav.name}</span>
                <div className="flex items-center gap-2">
                  {!inBuild && (
                    <StalenessIndicator
                      lastReviewedAt={sav.lastReviewedAt}
                      thresholdMonths={thresholds.savings_allocation ?? 12}
                    />
                  )}
                  <span>{formatCurrency(sav.monthlyAmount)}</span>
                </div>
              </div>
            ))}
            {/* Inline add form for savings */}
            {discretionaryState === "active" && isSavingsActive && (
              <TierAddForm phase="discretionary" prefillName={prefillName} isSavings />
            )}
          </div>
        )}
      </div>

      {/* SURPLUS */}
      <div className={cn("border-t pt-3", inBuild && buildPhase !== "summary" && "opacity-60")}>
        <div className="flex items-center justify-between py-1.5 px-2">
          <span className="text-xs font-semibold tracking-widest uppercase">Surplus</span>
          <span className="text-sm font-medium">{formatCurrency(surplus.amount)}</span>
        </div>
        {!inBuild && surplus.percentOfIncome < surplusBenchmark && (
          <div className="flex items-center gap-1.5 px-2 text-xs" style={{ color: "#f59e0b" }}>
            <span
              className="h-[5px] w-[5px] rounded-full shrink-0"
              style={{ background: "#f59e0b" }}
              aria-hidden
            />
            <span>Below benchmark</span>
          </div>
        )}
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
            className="px-2 text-xs text-primary hover:underline"
          >
            Increase savings ▸
          </button>
        )}
      </div>
    </div>
  );
}
