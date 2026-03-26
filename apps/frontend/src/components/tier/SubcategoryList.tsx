import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
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

export default function SubcategoryList({
  config,
  subcategories,
  subcategoryTotals,
  tierTotal,
  selectedId,
  onSelect,
  isLoading,
}: Props) {
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
      <div className="flex-1 overflow-y-auto">
        {subcategories.map((sub) => {
          const isSelected = sub.id === selectedId;
          const summary = subcategoryTotals[sub.id];
          return (
            <button
              key={sub.id}
              data-testid={`subcategory-row-${sub.id}`}
              aria-selected={isSelected}
              onClick={() => onSelect(sub.id)}
              className={[
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? `border-l-2 ${config.borderClass} ${config.bgClass}/14 font-medium ${config.textClass}`
                  : "border-l-2 border-transparent text-foreground/60 hover:bg-foreground/5",
              ].join(" ")}
            >
              {/* Stale dot column (fixed width, always present — active in Task 10) */}
              <span className="w-2 shrink-0" aria-hidden />
              <span className="flex-1">{sub.name}</span>
              <span className="font-numeric text-xs text-foreground/50">
                {summary ? formatCurrency(toGBP(summary.total)) : "£0"}
              </span>
            </button>
          );
        })}
      </div>
      {/* Tier total */}
      <div
        data-testid="tier-total"
        className="border-t border-foreground/10 px-4 py-3 flex justify-between text-sm"
      >
        <span className="text-foreground/50">Total</span>
        <span className={`font-numeric font-semibold ${config.textClass}`}>
          {formatCurrency(toGBP(tierTotal))}
        </span>
      </div>
    </div>
  );
}
