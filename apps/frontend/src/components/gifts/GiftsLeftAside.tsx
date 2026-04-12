import { PageHeader } from "@/components/common/PageHeader";
import { GiftsBudgetSummary } from "./GiftsBudgetSummary";
import type { GiftBudgetSummary } from "@finplan/shared";

export type GiftsMode = "gifts" | "upcoming" | "config";

type Props = {
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
  mode: GiftsMode;
  onModeChange: (mode: GiftsMode) => void;
  budget: GiftBudgetSummary;
  readOnly: boolean;
};

const TABS: { id: GiftsMode; label: string }[] = [
  { id: "gifts", label: "Gifts" },
  { id: "upcoming", label: "Upcoming" },
  { id: "config", label: "Config" },
];

export function GiftsLeftAside({
  year,
  years,
  onYearChange,
  mode,
  onModeChange,
  budget,
  readOnly,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Gifts" />
      <div className="flex items-center gap-2 px-6 pb-2">
        <label
          className="text-[11px] uppercase tracking-wide text-foreground/40"
          htmlFor="gifts-year"
        >
          Year
        </label>
        <select
          id="gifts-year"
          aria-label="Year"
          className="rounded bg-foreground/5 px-2 py-1 text-sm text-foreground"
          value={String(year)}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <GiftsBudgetSummary budget={budget} readOnly={readOnly} />
      <nav className="mt-2 flex flex-col">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={mode === tab.id}
            onClick={() => onModeChange(tab.id)}
            className="px-6 py-2 text-left text-sm text-foreground/65 transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:bg-foreground/5"
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
