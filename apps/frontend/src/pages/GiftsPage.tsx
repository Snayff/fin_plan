import { useState } from "react";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { GiftsLeftAside, type GiftsMode } from "@/components/gifts/GiftsLeftAside";
import { GiftsModePanel } from "@/components/gifts/GiftsModePanel";
import { UpcomingModePanel } from "@/components/gifts/UpcomingModePanel";
import { ConfigModePanel } from "@/components/gifts/ConfigModePanel";
import { YearRolloverBanner } from "@/components/gifts/YearRolloverBanner";
import { useGiftsState, useGiftsYears } from "@/hooks/useGifts";

export default function GiftsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState<GiftsMode>("gifts");

  const stateQuery = useGiftsState(year);
  const yearsQuery = useGiftsYears();

  if (stateQuery.isLoading || !stateQuery.data) {
    return (
      <div
        data-testid="gifts-page"
        className="flex h-screen items-center justify-center text-sm text-foreground/40"
      >
        Loading…
      </div>
    );
  }

  const state = stateQuery.data;
  const years = yearsQuery.data ?? [year];

  return (
    <div data-testid="gifts-page" className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />
      <YearRolloverBanner year={year} pending={state.rolloverPending} />
      <TwoPanelLayout
        left={
          <GiftsLeftAside
            year={year}
            years={years}
            onYearChange={setYear}
            mode={mode}
            onModeChange={setMode}
            budget={state.budget}
            readOnly={state.isReadOnly}
            peopleCount={state.people.length}
          />
        }
        right={
          <div className="flex h-full flex-col">
            {mode === "gifts" && (
              <GiftsModePanel
                people={state.people}
                year={year}
                readOnly={state.isReadOnly}
                onNavigateToConfig={() => setMode("config")}
              />
            )}
            {mode === "upcoming" && (
              <UpcomingModePanel year={year} onNavigateToGifts={() => setMode("gifts")} />
            )}
            {mode === "config" && (
              <ConfigModePanel currentMode={state.mode} readOnly={state.isReadOnly} year={year} />
            )}
          </div>
        }
      />
    </div>
  );
}
