import { cn } from "@/lib/utils";

export type ForecastSection = "cashflow" | "growth";

interface ForecastSectionNavigatorProps {
  selected: ForecastSection;
  onSelect: (section: ForecastSection) => void;
}

const ENTRIES: Array<{ id: ForecastSection; label: string }> = [
  { id: "cashflow", label: "Cashflow" },
  { id: "growth", label: "Growth" },
];

export function ForecastSectionNavigator({ selected, onSelect }: ForecastSectionNavigatorProps) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Forecast sections">
      {ENTRIES.map((e) => {
        const active = e.id === selected;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelect(e.id)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "w-full text-left px-3 py-2 rounded transition-colors text-sm font-heading uppercase tracking-widest",
              active
                ? "bg-page-accent/10 text-page-accent"
                : "text-text-secondary hover:bg-accent/40 hover:text-foreground"
            )}
          >
            {e.label}
          </button>
        );
      })}
    </nav>
  );
}
