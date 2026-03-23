import type { WaterfallSummary } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

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

function SectionHeader({
  label,
  total,
  colorClass,
}: {
  label: string;
  total: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2">
      <span className={cn("text-xs font-semibold tracking-widest uppercase", colorClass)}>
        {label}
      </span>
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
  const { income, committed, discretionary, surplus } = summary;

  return (
    <div className="space-y-4 text-sm">
      {/* INCOME */}
      <div>
        <SectionHeader
          label="Income"
          total={formatCurrency(income.total)}
          colorClass="text-tier-income"
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
              <span>{formatCurrency(src.amount)}</span>
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
              <span className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">÷12</span>
                {formatCurrency(src.monthlyAmount / 12)}
              </span>
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
              <span>{formatCurrency(src.amount)}</span>
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
              <span>{formatCurrency(bill.amount)}</span>
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
              <span>{formatCurrency(cat.monthlyBudget)}</span>
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
              <span>{formatCurrency(sav.monthlyAmount)}</span>
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
        {surplus.percentOfIncome < 10 && (
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
