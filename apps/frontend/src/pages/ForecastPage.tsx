import { useState } from "react";
import type { ForecastHorizon } from "@finplan/shared";
import { TimeHorizonSelector } from "@/components/forecast/TimeHorizonSelector";

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(10);

  return (
    <div className="h-full flex flex-col overflow-hidden" data-page="forecast">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
        <h1 className="font-heading font-bold text-lg uppercase tracking-widest text-page-accent">
          Forecast
        </h1>
        <TimeHorizonSelector value={horizon} onChange={setHorizon} />
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        {/* Chart panels wired in Task 10 */}
      </div>
    </div>
  );
}
