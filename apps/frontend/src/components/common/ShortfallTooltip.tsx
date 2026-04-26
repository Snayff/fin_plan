import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import type { ShortfallItem } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

interface ShortfallTooltipProps {
  items: ShortfallItem[];
  balanceToday: number;
  lowest: { value: number; date: string };
  showPence?: boolean;
}

const VISIBLE_LIMIT = 3;

export function ShortfallTooltip({
  items,
  balanceToday,
  lowest,
  showPence = false,
}: ShortfallTooltipProps) {
  const visible = items.slice(0, VISIBLE_LIMIT);
  const overflow = Math.max(0, items.length - VISIBLE_LIMIT);
  return (
    <div className="p-3 text-xs leading-relaxed">
      <p className="text-foreground/85 mb-2">Some items won't be covered by your cashflow.</p>
      <div className="space-y-1">
        {visible.map((item) => (
          <div
            key={item.itemId}
            data-testid="shortfall-item"
            className="grid grid-cols-[1fr_auto_auto] gap-3 items-baseline"
          >
            <span className="text-foreground/85 truncate">{item.itemName}</span>
            <span className="text-foreground/45 font-numeric">
              {format(parseISO(item.dueDate), "d MMM")}
            </span>
            <span className="text-attention font-numeric font-semibold">
              {formatCurrency(item.amount, showPence)}
            </span>
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <div className="mt-2 pt-2 border-t border-foreground/5 text-foreground/55 text-[11px]">
          + {overflow} more ·{" "}
          <Link
            to="/forecast"
            aria-label="open Forecast → Cashflow for the full list"
            className="underline underline-offset-2 hover:text-foreground/85"
          >
            open Forecast → Cashflow for the full list
          </Link>
        </div>
      )}
      <div className="mt-3 pt-2 border-t border-foreground/5 space-y-1">
        <div className="flex justify-between">
          <span className="text-foreground/55">Balance today</span>
          <span className="font-numeric">{formatCurrency(balanceToday, showPence)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/55">Lowest in 30 days</span>
          <span className="font-numeric text-attention">
            {formatCurrency(lowest.value, showPence)} · {format(parseISO(lowest.date), "d MMM")}
          </span>
        </div>
      </div>
    </div>
  );
}
