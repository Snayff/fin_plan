import { useState } from "react";
import type { ForecastHorizon } from "@finplan/shared";
import { TimeHorizonSelector } from "@/components/forecast/TimeHorizonSelector";
import { NetWorthChart } from "@/components/forecast/NetWorthChart";
import { SurplusAccumulationChart } from "@/components/forecast/SurplusAccumulationChart";
import { RetirementChart } from "@/components/forecast/RetirementChart";
import { useForecast } from "@/hooks/useForecast";

const CHART_SKELETON = (
  <div className="bg-card border border-border rounded-xl h-48 animate-pulse" />
);

const CHART_ERROR = (
  <div className="bg-card border border-border rounded-xl h-48 flex items-center justify-center">
    <p className="text-sm text-text-tertiary">Could not load forecast — try refreshing</p>
  </div>
);

export function GrowthSectionPanel() {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base uppercase tracking-widest text-page-accent">
          Growth
        </h2>
        <TimeHorizonSelector value={horizon} onChange={setHorizon} />
      </div>
      {isLoading ? (
        CHART_SKELETON
      ) : isError ? (
        CHART_ERROR
      ) : (
        <NetWorthChart data={data?.netWorth ?? []} retirementMarkers={retirementMarkers} />
      )}
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
  );
}
