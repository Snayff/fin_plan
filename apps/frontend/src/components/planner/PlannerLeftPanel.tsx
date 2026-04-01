import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type ActiveView = "purchases" | "gifts-upcoming" | "gifts-by-person";

interface PlannerLeftPanelProps {
  year: number;
  budget: any | null;
  purchases: any[];
  giftPersons: any[];
  activeView: ActiveView;
  onSelectView: (v: ActiveView) => void;
}

export function PlannerLeftPanel({
  budget,
  purchases,
  giftPersons,
  activeView,
  onSelectView,
}: PlannerLeftPanelProps) {
  const scheduledTotal = purchases
    .filter((p) => p.scheduledThisYear === true && p.status !== "done")
    .reduce((sum: number, p) => sum + (p.estimatedCost ?? 0), 0);

  const purchaseBudget = budget?.purchaseBudget ?? 0;
  const purchasesOverBudget = scheduledTotal > purchaseBudget;

  const giftBudget = budget?.giftBudget ?? 0;
  const totalAllocated = giftPersons.reduce(
    (sum: number, person) => sum + (person.budgetTotal ?? 0),
    0
  );
  const giftsOverBudget = totalAllocated > giftBudget;

  return (
    <div className="space-y-1">
      {/* PURCHASES section */}
      <div className="mb-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Purchases
          </span>
          <span className="text-sm font-medium">{formatCurrency(purchaseBudget)}</span>
        </div>

        <div className="flex items-center justify-between px-2 py-0.5 text-sm">
          <span className="text-muted-foreground">Scheduled</span>
          <span>{formatCurrency(scheduledTotal)}</span>
        </div>

        {purchasesOverBudget && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-amber-600 dark:text-amber-400">over budget</span>
          </div>
        )}

        <button
          className={cn(
            "w-full text-left px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent mt-0.5",
            activeView === "purchases" && "bg-accent font-medium"
          )}
          onClick={() => onSelectView("purchases")}
        >
          View purchases →
        </button>
      </div>

      <hr className="my-2" />

      {/* GIFTS section */}
      <div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Gifts
          </span>
          <span className="text-sm font-medium">{formatCurrency(giftBudget)}</span>
        </div>

        <div className="flex items-center justify-between px-2 py-0.5 text-sm">
          <span className="text-muted-foreground">Total allocated</span>
          <span>{formatCurrency(totalAllocated)}</span>
        </div>

        {giftsOverBudget && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-amber-600 dark:text-amber-400">over budget</span>
          </div>
        )}

        <div className="space-y-0.5 mt-0.5">
          <button
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent",
              activeView === "gifts-upcoming" && "bg-accent font-medium"
            )}
            onClick={() => onSelectView("gifts-upcoming")}
          >
            Upcoming
          </button>
          <button
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent",
              activeView === "gifts-by-person" && "bg-accent font-medium"
            )}
            onClick={() => onSelectView("gifts-by-person")}
          >
            By person
          </button>
        </div>
      </div>
    </div>
  );
}
