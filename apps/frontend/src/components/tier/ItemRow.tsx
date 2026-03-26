import { formatItemAmount, getMonthsAgo, isStale, type SpendType } from "./formatAmount";
import type { TierConfig } from "./tierConfig";

interface WaterfallItem {
  id: string;
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  notes: string | null;
  lastReviewedAt: Date;
  sortOrder: number;
}

interface Props {
  item: WaterfallItem;
  config: TierConfig;
  isExpanded: boolean;
  onToggle: () => void;
  now: Date;
  stalenessMonths?: number;
  children?: React.ReactNode;
}

export default function ItemRow({
  item,
  config,
  isExpanded,
  onToggle,
  now,
  stalenessMonths = 12,
  children,
}: Props) {
  const { primary, secondary } = formatItemAmount(item.amount, item.spendType);
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);
  const monthsAgo = stale ? getMonthsAgo(item.lastReviewedAt, now) : 0;

  return (
    <div>
      <button
        data-testid={`item-row-${item.id}`}
        onClick={onToggle}
        className={[
          "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
          `hover:${config.bgClass}/5`,
          isExpanded ? `${config.bgClass}/8` : "",
        ].join(" ")}
      >
        {/* Stale dot — fixed-width column */}
        <span className="w-2 shrink-0 flex items-center justify-center">
          {stale && <span className="h-1.5 w-1.5 rounded-full bg-attention" aria-hidden />}
        </span>
        <span className="flex-1 text-foreground/80">{item.name}</span>
        {stale && (
          <span data-testid="stale-age" className="text-xs text-attention mr-2">
            {monthsAgo}mo ago
          </span>
        )}
        <span className="font-numeric text-sm text-foreground/70">
          {primary}
          {secondary && <span className="text-foreground/40"> · {secondary}</span>}
        </span>
      </button>
      {isExpanded && children}
    </div>
  );
}
