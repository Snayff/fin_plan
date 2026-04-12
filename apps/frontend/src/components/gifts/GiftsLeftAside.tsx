import { PageHeader } from "@/components/common/PageHeader";
import { NudgeCard } from "@/components/common/NudgeCard";
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
  peopleCount: number;
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
  peopleCount,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Gifts" />
      <div className="flex items-center gap-2 px-4 pb-2">
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
      {budget.annualBudget === 0 && peopleCount === 0 && (
        <div className="px-4 pb-2">
          <NudgeCard
            message="Set up your gift plan in a few steps."
            options={[
              "Config → People — add the people you buy for",
              "Config → Events — review or add occasions",
              "Config → Quick add — set planned amounts in bulk",
            ]}
            actionLabel="Open Config"
            onAction={() => onModeChange("config")}
          />
        </div>
      )}
      <nav className="mt-2 flex flex-col">
        {TABS.map((tab) => {
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-active={isActive}
              onClick={() => onModeChange(tab.id)}
              className={[
                "relative flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors",
                isActive
                  ? "font-medium text-tier-discretionary"
                  : "text-foreground/60 hover:bg-tier-discretionary/5",
              ].join(" ")}
            >
              {isActive && (
                <div className="absolute inset-0 bg-tier-discretionary/14 border-l-2 border-tier-discretionary rounded-r-sm" />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
