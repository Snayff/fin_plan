import { format } from "date-fns";
import type { CashflowEvent } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

interface CashflowEventListProps {
  events: CashflowEvent[];
}

export function CashflowEventList({ events }: CashflowEventListProps) {
  if (events.length === 0)
    return <p className="text-xs text-text-tertiary px-2 py-3">No dated events this month.</p>;
  return (
    <ul className="divide-y divide-surface-border">
      {events.map((e, idx) => {
        const sign = e.amount >= 0 ? "+" : "-";
        return (
          <li
            key={`${e.date}-${idx}`}
            className="flex items-center justify-between px-2 py-2 text-xs"
          >
            <span className="flex items-center gap-3">
              <span className="text-text-tertiary w-12">{format(new Date(e.date), "d MMM")}</span>
              <span className="text-foreground">{e.label}</span>
            </span>
            <span className="flex items-center gap-4">
              <span className="font-numeric text-text-secondary">
                {sign}
                {formatCurrency(Math.abs(e.amount))}
              </span>
              <span className="font-numeric text-text-tertiary">
                {formatCurrency(e.runningBalanceAfter)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
