import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface SnapshotMeta {
  id: string;
  name: string;
  isAuto: boolean;
  createdAt: string;
}

interface SnapshotDotProps {
  snapshot: SnapshotMeta;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SnapshotDot({ snapshot, isSelected, isLoading, onClick }: SnapshotDotProps) {
  const tooltipLabel = `${snapshot.name} — ${format(new Date(snapshot.createdAt), "d MMMM yyyy")}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={tooltipLabel}
            onClick={onClick}
            className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center group"
          >
            <span
              data-testid="dot-ring"
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full border-2 transition-all duration-150 ease-out motion-reduce:transition-none",
                snapshot.isAuto ? "border-dashed" : "border-solid",
                isLoading && "animate-pulse",
                isSelected
                  ? "bg-primary border-primary shadow-[0_0_0_3px_rgba(124,58,237,0.25)]"
                  : "bg-transparent border-muted-foreground/40 group-hover:border-muted-foreground"
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-surface-overlay border border-[hsl(var(--surface-overlay-border))] text-xs"
        >
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
