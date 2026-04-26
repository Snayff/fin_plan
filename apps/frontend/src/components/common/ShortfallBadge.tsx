import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortfallTooltip } from "./ShortfallTooltip";
import type { ShortfallItem } from "@finplan/shared";

interface ShortfallBadgeProps {
  daysToFirst: number;
  count: number;
  items: ShortfallItem[];
  balanceToday: number;
  lowest: { value: number; date: string };
  showPence?: boolean;
}

export function ShortfallBadge({
  daysToFirst,
  count,
  items,
  balanceToday,
  lowest,
  showPence = false,
}: ShortfallBadgeProps) {
  const label = `Cashflow shortfall: ${count} item${count === 1 ? "" : "s"} in the next 30 days`;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label={label}
            className="inline-flex items-center gap-1 text-xs text-attention focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            <span
              className="inline-block h-[5px] w-[5px] rounded-full shrink-0 bg-attention"
              aria-hidden
            />
            shortfall in {daysToFirst}d
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-80 p-0">
          <ShortfallTooltip
            items={items}
            balanceToday={balanceToday}
            lowest={lowest}
            showPence={showPence}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
