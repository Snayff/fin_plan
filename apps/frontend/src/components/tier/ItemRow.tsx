import { formatTwoLineAmount, SPEND_TYPE_LABELS, isStale, type SpendType } from "./formatAmount";
import type { TierConfig } from "./tierConfig";

interface WaterfallItem {
  id: string;
  name: string;
  amount: number;
  spendType: SpendType;
  subcategoryId: string;
  subcategoryName: string;
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
  const amounts = formatTwoLineAmount(item.amount, item.spendType);
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);

  return (
    <div>
      <button
        type="button"
        data-testid={`item-row-${item.id}`}
        onClick={onToggle}
        className={[
          "flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm transition-colors",
          config.hoverBgClass,
          isExpanded
            ? `${config.bgClass}/8 border-l-2 ${config.borderClass} pl-[14px]`
            : "",
        ].join(" ")}
      >
        {/* Stale dot — fixed-width column */}
        <span className="w-2 shrink-0 flex items-center justify-center mt-1">
          {stale && (
            <span
              data-testid="stale-dot"
              className="h-1.5 w-1.5 rounded-full bg-attention"
              aria-hidden
            />
          )}
        </span>

        {/* Left: name + metadata */}
        <span className="flex-1 flex flex-col gap-px">
          <span className="text-foreground/65">{item.name}</span>
          <span className="text-[11px] text-foreground/30">
            {SPEND_TYPE_LABELS[item.spendType]} · {item.subcategoryName}
          </span>
        </span>

        {/* Right: amounts */}
        <span className="flex flex-col items-end gap-px">
          <span
            className={[
              "font-numeric text-sm",
              amounts.monthly.bright ? "text-foreground/70" : "text-foreground/30",
            ].join(" ")}
          >
            {amounts.monthly.value}
          </span>
          {amounts.yearly && (
            <span
              className={[
                "font-numeric text-[11px]",
                amounts.yearly.bright ? "text-foreground/70" : "text-foreground/30",
              ].join(" ")}
            >
              {amounts.yearly.value}
            </span>
          )}
        </span>
      </button>
      {isExpanded && children}
    </div>
  );
}
