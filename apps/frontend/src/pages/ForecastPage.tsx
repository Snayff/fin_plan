import { useState } from "react";
import type { ForecastHorizon } from "@finplan/shared";
import { TimeHorizonSelector } from "@/components/forecast/TimeHorizonSelector";
import { NetWorthChart } from "@/components/forecast/NetWorthChart";
import { SurplusAccumulationChart } from "@/components/forecast/SurplusAccumulationChart";
import { RetirementChart } from "@/components/forecast/RetirementChart";
import { useForecast } from "@/hooks/useForecast";

const CHART_SKELETON = (
  <div className="bg-surface border border-surface-elevated rounded-xl h-48 animate-pulse" />
);

const CHART_ERROR = (
  <div className="bg-surface border border-surface-elevated rounded-xl h-48 flex items-center justify-center">
    <p className="text-sm text-text-tertiary">Could not load forecast — try refreshing</p>
  </div>
);

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(10);
  const { data, isLoading, isError } = useForecast(horizon);

  const currentYear = new Date().getFullYear();
  const horizonEndYear = currentYear + horizon;

  const retirementMarkers = (data?.retirement ?? [])
    .filter((m) => m.retirementYear != null && m.retirementYear >= currentYear)
    .map((m) => ({
      year: Math.min(m.retirementYear!, horizonEndYear),
      name: m.memberName,
      beyondHorizon: m.retirementYear! > horizonEndYear,
    }));

  return (
    <div className="h-full flex flex-col overflow-hidden" data-page="forecast">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
        <h1 className="font-heading font-bold text-lg uppercase tracking-widest text-page-accent">
          Forecast
        </h1>
        <TimeHorizonSelector value={horizon} onChange={setHorizon} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* Net worth — full width */}
          {isLoading ? (
            CHART_SKELETON
          ) : isError ? (
            CHART_ERROR
          ) : (
            <NetWorthChart data={data?.netWorth ?? []} retirementMarkers={retirementMarkers} />
          )}

          {/* Bottom row: surplus left, retirement right */}
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {CHART_SKELETON}
                {CHART_SKELETON}
              </>
            ) : isError ? (
              <>
                {CHART_ERROR}
                {CHART_ERROR}
              </>
            ) : (
              <>
                <SurplusAccumulationChart data={data?.surplus ?? []} />
                <RetirementChart members={data?.retirement ?? []} horizonEndYear={horizonEndYear} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
