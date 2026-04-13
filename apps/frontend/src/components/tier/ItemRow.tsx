import { formatTwoLineAmount, SPEND_TYPE_LABELS, isStale, type SpendType } from "./formatAmount";
import { formatCurrency } from "@/utils/format";
import type { TierConfig } from "./tierConfig";
import { useSettings } from "@/hooks/useSettings";
import type { ItemLifecycleState } from "@finplan/shared";

interface ItemPeriod {
  id: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  amount: number;
}

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
  lifecycleState?: ItemLifecycleState;
  nextPeriod?: { amount: number; startDate: string | Date } | null;
  periods?: ItemPeriod[];
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
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  const amounts = formatTwoLineAmount(item.amount, item.spendType, showPence);
  const stale = isStale(item.lastReviewedAt, now, stalenessMonths);

  const lifecycleClass =
    item.lifecycleState === "future"
      ? "opacity-55 border border-foreground/10"
      : item.lifecycleState === "expired"
        ? "opacity-35"
        : "";

  return (
    <div className={lifecycleClass}>
      <button
        type="button"
        data-testid={`item-row-${item.id}`}
        onClick={onToggle}
        className={[
          "flex w-full items-start gap-2 px-4 py-2.5 text-left text-[13px] transition-colors",
          config.hoverBgClass,
          isExpanded ? `${config.bgClass}/8 border-l-2 ${config.borderClass} pl-[14px]` : "",
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
          <span className="flex items-center text-text-secondary">
            {item.name}
            {item.lifecycleState === "future" && item.periods?.[0]?.startDate && (
              <span
                className={`text-[9px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded ${config.textClass} ${config.bgClass}/10 border ${config.borderClass}/15 ml-2`}
              >
                From{" "}
                {new Date(item.periods[0].startDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </span>
          <span className="text-[11px] text-text-tertiary">
            {SPEND_TYPE_LABELS[item.spendType]} · {item.subcategoryName}
          </span>
        </span>

        {/* Right: amounts + next period indicator */}
        <span className="flex flex-col items-end gap-px">
          <span className="flex items-center gap-2">
            <span
              className={[
                "font-numeric",
                amounts.monthly.bright ? "text-text-secondary" : "text-text-tertiary",
              ].join(" ")}
            >
              {amounts.monthly.value}
            </span>
            {item.nextPeriod && (
              <span className="flex items-center gap-1 font-numeric text-[11px]">
                <span className="text-text-muted">&rarr;</span>
                <span className={`${config.textClass} opacity-70`}>
                  {formatCurrency(item.nextPeriod.amount)}
                </span>
                <span className="font-body text-[10px] text-text-muted">
                  from{" "}
                  {new Date(item.nextPeriod.startDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </span>
            )}
          </span>
          {amounts.yearly && (
            <span
              className={[
                "font-numeric text-[11px]",
                amounts.yearly.bright ? "text-text-secondary" : "text-text-tertiary",
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
