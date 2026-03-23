import type { WaterfallSummary } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { isStale } from "@/utils/staleness";
import { StalenessIndicator } from "@/components/common/StalenessIndicator";
import { useSettings } from "@/hooks/useSettings";

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
}: {
  label: string;
  total: string;
  colorClass: string;
  staleCount: number;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2">
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-semibold tracking-widest uppercase", colorClass)}>
          {label}
        </span>
        <StaleCountBadge count={staleCount} />
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

  return (
    <div className="space-y-4 text-sm">
      {/* INCOME */}
      <div>
        <SectionHeader
          label="Income"
          total={formatCurrency(income.total)}
          colorClass="text-tier-income"
          staleCount={incomeStaleCount}
        />
        <div className="space-y-0.5">
          {income.monthly.map((src) => (
            <div
              key={src.id}
              className={cn(ROW_CLASS, selectedItemId === src.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={src.lastReviewedAt}
                  thresholdMonths={thresholds.income_source ?? 12}
                />
                <span>{formatCurrency(src.amount)}</span>
              </div>
            </div>
          ))}
          {income.annual.map((src) => (
            <div
              key={src.id}
              className={cn(ROW_CLASS, selectedItemId === src.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={src.lastReviewedAt}
                  thresholdMonths={thresholds.income_source ?? 12}
                />
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
              className={cn(ROW_CLASS, selectedItemId === src.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={src.lastReviewedAt}
                  thresholdMonths={thresholds.income_source ?? 12}
                />
                <span>{formatCurrency(src.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMMITTED */}
      <div>
        <SectionHeader
          label="Committed"
          total={formatCurrency(committed.monthlyTotal + committed.monthlyAvg12)}
          colorClass="text-tier-committed"
          staleCount={committedStaleCount}
        />
        <div className="space-y-0.5">
          {committed.bills.map((bill) => (
            <div
              key={bill.id}
              className={cn(ROW_CLASS, selectedItemId === bill.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={bill.lastReviewedAt}
                  thresholdMonths={thresholds.committed_bill ?? 6}
                />
                <span>{formatCurrency(bill.amount)}</span>
              </div>
            </div>
          ))}
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
        </div>
      </div>

      {/* DISCRETIONARY */}
      <div>
        <SectionHeader
          label="Discretionary"
          total={formatCurrency(discretionary.total + discretionary.savings.total)}
          colorClass="text-tier-discretionary"
          staleCount={discretionaryStaleCount}
        />
        <div className="space-y-0.5">
          {discretionary.categories.map((cat) => (
            <div
              key={cat.id}
              className={cn(ROW_CLASS, selectedItemId === cat.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={cat.lastReviewedAt}
                  thresholdMonths={thresholds.discretionary_category ?? 12}
                />
                <span>{formatCurrency(cat.monthlyBudget)}</span>
              </div>
            </div>
          ))}
          <div className="py-1.5 px-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Savings
            </span>
          </div>
          {discretionary.savings.allocations.map((sav) => (
            <div
              key={sav.id}
              className={cn(ROW_CLASS, selectedItemId === sav.id && "bg-accent")}
              onClick={() =>
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
                <StalenessIndicator
                  lastReviewedAt={sav.lastReviewedAt}
                  thresholdMonths={thresholds.savings_allocation ?? 12}
                />
                <span>{formatCurrency(sav.monthlyAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SURPLUS */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between py-1.5 px-2">
          <span className="text-xs font-semibold tracking-widest uppercase">Surplus</span>
          <span className="text-sm font-medium">{formatCurrency(surplus.amount)}</span>
        </div>
        {surplus.percentOfIncome < surplusBenchmark && (
          <div className="flex items-center gap-1.5 px-2 text-xs" style={{ color: "#f59e0b" }}>
            <span
              className="h-[5px] w-[5px] rounded-full shrink-0"
              style={{ background: "#f59e0b" }}
              aria-hidden
            />
            <span>Below benchmark</span>
          </div>
        )}
        {discretionary.savings.allocations.length > 0 && (
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
