import { format } from "date-fns";
import type { CashflowEvent } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";

interface CashflowEventListProps {
  events: CashflowEvent[];
}

export function CashflowEventList({ events }: CashflowEventListProps) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  if (events.length === 0)
    return <p className="text-xs text-text-tertiary px-2 py-3">No dated events this month.</p>;
  return (
    <ul className="divide-y divide-border">
      {events.map((e, idx) => {
        const sign = e.amount >= 0 ? "+" : "-";
        const isLiquidation =
          e.itemType === "asset_liquidation" || e.itemType === "account_liquidation";
        return (
          <li
            key={`${e.date}-${idx}`}
            className="flex items-center justify-between px-2 py-2 text-xs"
          >
            <span className="flex items-center gap-3">
              <span className="text-text-tertiary w-12">{format(new Date(e.date), "d MMM")}</span>
              <span className="flex items-center gap-1.5">
                {isLiquidation && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0"
                    aria-hidden
                  />
                )}
                <span className={isLiquidation ? "text-teal-300" : "text-foreground"}>
                  {e.label}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-4">
              <span
                className={[
                  "font-numeric",
                  isLiquidation ? "text-teal-400" : "text-text-secondary",
                ].join(" ")}
              >
                {sign}
                {formatCurrency(Math.abs(e.amount), showPence)}
              </span>
              <span className="font-numeric text-text-tertiary">
                {formatCurrency(e.runningBalanceAfter, showPence)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
